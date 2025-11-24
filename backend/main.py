from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_community.llms.huggingface_pipeline import HuggingFacePipeline
from langchain_openai import ChatOpenAI
from langchain_google_genai import GoogleGenerativeAI
import os

from db_utils import (
    login_user, get_burnout_timeseries, get_departments_list,
    get_user_department, get_user_role, get_position_list, get_city_list
)

from graph.graph import create, AgentState

# ===================== MODELS ===================== #

class UserLogin(BaseModel):
    username: str
    password: str

class MaslachResult(BaseModel):
    exhaustion: int
    depersonalization: int
    achievement: int
    burnoutLevel: float

class ReactionResult(BaseModel):
    times: List[int]
    avgTime: int
    minTime: int
    maxTime: int
    stability: int
    fatigueTrend: int
    cognitiveIndex: int

class CombinedResult(BaseModel):
    maslach_result: MaslachResult
    reaction_result: ReactionResult
    user_id: int

class DashboardRequest(BaseModel):
    characteristic: str
    user_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    cities: Optional[List[str]] = None
    positions: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None

# ===================== APP CONFIG ===================== #

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== ENDPOINTS ===================== #

@app.post("/api/login")
async def login_for_access_token(user_credentials: UserLogin):
    user_id, position = login_user(user_credentials.username, user_credentials.password)

    if user_id != -1:
        return {"status": "success", "user_id": user_id, "position": position}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверное имя пользователя или пароль"
    )


@app.post("/api/submit_results")
async def submit_results(results: CombinedResult):
    llm_id = os.getenv("LLM_ID")

    if llm_id.startswith("gemini"):
        llm = GoogleGenerativeAI(model=llm_id, api_key=os.getenv("GEMINI_API_KEY"))
    elif llm_id.startswith("gpt"):
        llm = ChatOpenAI(model=llm_id, api_key=os.getenv("OPENAI_API_KET"))
    else:
        tokenizer = AutoTokenizer.from_pretrained(llm_id)
        model = AutoModelForCausalLM.from_pretrained(llm_id, device_map="auto")
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.95,
            repetition_penalty=1.15
        )
        llm = HuggingFacePipeline(pipeline=pipe)

    graph = create(llm)

    scores = {
        "exhaustion": results.maslach_result.exhaustion,
        "depersonalization": results.maslach_result.depersonalization,
        "achievement": results.maslach_result.achievement,
        "burnout": results.maslach_result.burnoutLevel,
        "reaction_avg": results.reaction_result.avgTime,
        "cognitive_index": results.reaction_result.cognitiveIndex,
    }

    start_state = AgentState({"user_id": results.user_id, "scores": scores})
    end_state = graph.invoke(start_state)

    return {"status": "success", "message": end_state.get("llm_response").get("recommendation")}


@app.post("/api/get_timeseries")
def get_timeseries(data: DashboardRequest):
    return get_burnout_timeseries(
        data.characteristic,
        data.user_id,
        data.start_date,
        data.end_date,
        data.cities,
        data.positions,
        data.departments,
        data.min_age,
        data.max_age
    )


@app.get("/api/get_departments")
def get_departments():
    department_names = get_departments_list()
    return [{"id": i, "name": name} for i, name in enumerate(department_names)]

@app.get("/api/get_cities")
def get_cities():
    city_names = get_city_list()
    return [{"id": i, "name": name} for i, name in enumerate(city_names)]

@app.get("/api/get_positions")
def get_positions():
    position_names = get_position_list()
    return [{"id": i, "name": name} for i, name in enumerate(position_names)]


@app.get("/api/user_context")
def get_user_context(user_id: int):
    role = get_user_role(user_id)
    department = get_user_department(user_id)
    if not role or not department:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user_id, "role": role, "department": department}


@app.post("/api/statistics_data")
def get_statistics_data(
    user_id: int,
    start_date: str,
    end_date: str,
    department: Optional[str] = None
):
    user_role = get_user_role(user_id)

    if user_role == "Руководитель":
        departments_filter = [department] if department and department != "all" else None
        return {
            "manager_view": get_burnout_timeseries(
                "burnout_score", start_date, end_date, departments=departments_filter
            )
        }

    if user_role == "Сотрудник":
        user_department = get_user_department(user_id)
        return {
            "personal_view": get_burnout_timeseries(
                "burnout_score", start_date, end_date, user_ids=[user_id]
            ),
            "department_view": get_burnout_timeseries(
                "burnout_score", start_date, end_date, departments=[user_department]
            )
        }

    raise HTTPException(status_code=403, detail="Unknown role or insufficient permissions")


@app.get("/")
def read_root():
    return {"message": "Сервер для СДЭК запущен!"}
