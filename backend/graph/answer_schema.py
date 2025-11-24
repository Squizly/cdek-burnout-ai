from pydantic import BaseModel, Field
from typing import Optional

class LLMResponse(BaseModel):
    recommendation: Optional[str] = Field(
        default=None,
        description="Recomendation for user on Russian without greeting or introduction"
    )
    score: int = Field(
        ...,
        description="Is employee burnout (0, 1)"
    )