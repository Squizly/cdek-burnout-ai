import logging
import os
import smtplib
from email.mime.text import MIMEText
from typing import TypedDict, Dict, List, Any, Hashable

from dotenv import load_dotenv
from langchain_core.output_parsers import PydanticOutputParser
from langchain_google_genai import GoogleGenerativeAI
from langgraph.graph import StateGraph, END

from config import prompt_template
from db_utils import get_user_burnout_stats, get_user_data, get_all_user_ids_and_emails
from graph.tasks_generation import generate_project_data
from answer_schema import Recommendations

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
load_dotenv()

class AnalyzerState(TypedDict):
    user_id: int
    user_email: str
    user_data: Dict[str, Any] 
    df_last_3: Dict[Hashable, Any]
    averages: Dict[Hashable, Any]
    projects: List[Dict[str, Any]]
    llm_response: Recommendations


def create_graph(llm: Any):
    def get_data_node(state: AnalyzerState):
        """
        Получение данных о пользователе, его предыдущих тестах и активности.
        """
        logging.info(f"--- [Узел GET_DATA] для user_id: {state['user_id']} ---")
        user_id = state['user_id']
        
        user_data = get_user_data(user_id)
        df_last_3, averages = get_user_burnout_stats(user_id)
        projects = generate_project_data()

        return {
            "user_data": user_data,
            "df_last_3": df_last_3,
            "averages": averages,
            "projects": projects
        }
    
    def llm_node(state: AnalyzerState):
        """
        Вызов LLM и получение структурированного вывода.
        """
        logging.info(f"--- [Узел LLM] для user_id: {state['user_id']} ---")
        parser = PydanticOutputParser(pydantic_object=Recommendations)
        
        input_vars = {
            "user_data": state["user_data"],
            "averages": state["averages"],
            "df_last_3": state["df_last_3"],
            "projects": state["projects"],
            "instructions": parser.get_format_instructions()
        }

        chain = prompt_template | llm | parser
        res = chain.invoke(input_vars).model_dump()
        return {"llm_response": res}

    def send_recommendations_node(state: AnalyzerState):
        """
        Функция отправки рекомендаций на почту пользователя.
        """
        logging.info(f"--- [Узел SEND_RECOMMENDATIONS] для user_id: {state['user_id']} ---")
        
        recipient_email = state["user_email"]
        recommendation = state["llm_response"]["recommendation"]
        
        sender_email = os.getenv("EMAIL_SENDER")
        sender_password = os.getenv("EMAIL_PASSWORD")
        smtp_server = os.getenv("EMAIL_SMTP_SERVER")
        smtp_port = int(os.getenv("EMAIL_SMTP_PORT"))

        recommendations_html = "<ul>" + "".join(f"<li>{rec}</li>" for rec in recommendation) + "</ul>"
        
        email_body = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                    .container {{ padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: auto; }}
                    h2, h3 {{ color: #333; }}
                    .cta-button {{ display: inline-block; padding: 10px 20px; margin-top: 15px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Здравствуйте!</h2>
                    <p>Мы провели анализ вашего состояния на основе последних тестов и рабочей активности.</p>
                    
                    <h3>Рекомендации:</h3>
                    {recommendations_html}

                    <p>Пожалуйста, уделите внимание своему состоянию. Если у вас есть вопросы, обратитесь к вашему руководителю или HR-специалисту.</p>
                    
                    <hr>
                    
                    <p><b>Чтобы мы могли и дальше следить за вашим состоянием и вовремя предлагать поддержку, пожалуйста, пройдите наш тест по анализу рабочего состояния.</b></p>
                    Пройти тест сейчас</a>
                    
                    <p style="margin-top: 25px; color: #555;">С уважением,<br>Ваша система мониторинга состояния</p>
                </div>
            </body>
            </html>
            """

        msg = MIMEText(email_body, 'html', 'utf-8')
        msg['Subject'] = 'Персональные рекомендации по результатам теста на выгорание'
        msg['From'] = sender_email
        msg['To'] = recipient_email

        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
                logging.info(f"Письмо успешно отправлено на {recipient_email}")
        except Exception as e:
            logging.error(f"Не удалось отправить письмо на {recipient_email}. Ошибка: {e}")
        
        return None

    def decide_node(state: AnalyzerState):
        """
        Функция принятия решения об отправке уведомления.
        """
        logging.info(f"--- [Узел DECIDE] для user_id: {state['user_id']} ---")
        if state["llm_response"]["necessity"]:
            logging.info("Решение: ОТПРАВИТЬ уведомление.")
            return "send_recommendations"
        else:
            logging.info("Решение: НЕ отправлять уведомление.")
            return "end"

    
    workflow = StateGraph(AnalyzerState)

    workflow.add_node("get_data", get_data_node)
    workflow.add_node("llm", llm_node)
    workflow.add_node("send_recommendations", send_recommendations_node)
    
    workflow.set_entry_point("get_data")
    workflow.add_edge("get_data", "llm")
    
    workflow.add_conditional_edges(
        "llm", 
        decide_node, 
        {
            "send_recommendations": "send_recommendations",
            "end": END
        }
    )
    workflow.add_edge("send_recommendations", END)

    return workflow.compile()

def run_graph_for_all_users():
    """
    Функция для запуска анализа всех сотрудников из БД.
    """
    logging.info("=== Запуск массового анализа сотрудников ===")

    llm = GoogleGenerativeAI(
        model='gemini-1.5-flash',
        api_key=os.getenv('GEMINI_API_KEY')
    )
    graph = create_graph(llm)

    all_users = get_all_user_ids_and_emails()
    if not all_users:
        logging.warning("Не найдено ни одного пользователя в БД. Завершение работы.")
        return

    for user_id, user_email in all_users:
        if not user_email:
            logging.warning(f"У пользователя с ID {user_id} отсутствует email. Пропускаем.")
            continue
        
        logging.info(f"--- Начало обработки пользователя ID: {user_id}, Email: {user_email} ---")
        
        start_state = AnalyzerState({
            'user_id': user_id,
            'user_email': user_email
        })
        
        try:
            graph.invoke(start_state)
            logging.info(f"--- Завершение обработки пользователя ID: {user_id} ---")
        except Exception as e:
            logging.error(f"Ошибка при обработке пользователя ID: {user_id}. Ошибка: {e}")

if __name__ == '__main__':
    run_graph_for_all_users()