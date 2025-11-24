from pydantic import BaseModel, Field
from typing import  Dict

class Recommendations(BaseModel):
    recommendations: str = Field(
        ...,
        default=None,
        description="Recommendations"
    )
    necessity: bool = Field(
        ...,
        default=False,
        description="True or False"
    )