import logging
from langchain_core.output_parsers import PydanticOutputParser
from typing import TypedDict, Dict, List, Any
from random import randint

from langgraph.graph import StateGraph, END

from graph.answer_schema import LLMResponse

from graph.config import prompt_template
from graph.tasks_generation import generate_project_data

from db_utils import get_user_burnout_stats, get_user_data, save_burnout_test_result

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


class AgentState(TypedDict):
    user_id: int
    scores: Dict[str, int]
    user_activity: List[Dict[str, Any]]
    user_data: Dict[str, Any]
    prev_results: Dict[str, Any]
    avg_results: Dict[str, Any]
    llm_response: LLMResponse


def create(llm: Any):
    def get_data_node(state: AgentState):
        """
        Узел получения данных
        """
        logging.info("--- Узел: Получение данных ---")
        user_id = state['user_id']
        user_activity = generate_project_data(4, 10, 10, 15)
        user_data = get_user_data(user_id)
        prev_results, avg_results = get_user_burnout_stats(user_id)
        logging.info("Данные получены.")

        return {
            "user_activity": user_activity,
            "user_data": user_data,
            "prev_results": prev_results,
            "avg_results": avg_results
        }

    def llm_node(state: AgentState):
        """
        Вызов выбранной LLM со структурированным выводом.
        """
        logging.info("--- Узел: Вызов LLM ---")
        parser = PydanticOutputParser(pydantic_object=LLMResponse)
        input_vars = {
            "user_data": state['user_data'],
            "prev_test_resulst": state['prev_results'],
            "test_results": state['scores'],
            "user_work_data": state['user_activity'],
            "avg_results": state['avg_results'],
            "instructions": parser.get_format_instructions()
        }
        chain = prompt_template | llm | parser
        res = chain.invoke(input_vars).model_dump()
        logging.info("LLM вернула ответ.")
        return {"llm_response": res}
    
    def db_save_node(state: AgentState):
        """
        Узел сохранения результатов теста в базу данных.
        """
        logging.info("--- Узел: Сохранение данных в БД ---")
        try:
            user_id = state['user_id']
            scores = state['scores']
            llm_response = state['llm_response']
            
            save_burnout_test_result(
                user_id=user_id,
                scores=scores,
                llm_response=llm_response
            )
        except Exception as e:
            logging.error(f"Не удалось сохранить данные в БД: {e}")
        
        return {}
    
    workflow = StateGraph(AgentState)
    workflow.add_node("get_data", get_data_node)
    workflow.add_node("llm", llm_node)
    workflow.add_node("save_to_db", db_save_node)

    workflow.set_entry_point("get_data")
    workflow.add_edge("get_data", "llm")
    workflow.add_edge("llm", "save_to_db")
    workflow.add_edge("save_to_db", END)

    return workflow.compile()

