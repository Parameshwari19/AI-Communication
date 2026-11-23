"""
Pydantic schemas used for request validation and response serialization.

Keeping these separate from the SQLAlchemy models lets us control exactly
what shape of data enters and leaves the API.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth / User schemas
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------------
# Analysis / Report schemas
# ---------------------------------------------------------------------------
class GrammarIssue(BaseModel):
    message: str
    error_text: str
    suggestion: Optional[str] = None
    offset: int
    length: int


class AnalysisResult(BaseModel):
    """Full analysis payload returned right after processing audio."""

    transcript: str
    duration_seconds: float
    word_count: int
    wpm: float

    filler_count: int
    filler_words: dict  # e.g. {"um": 3, "like": 2}

    grammar_errors: int
    grammar_issues: List[GrammarIssue]

    vocabulary_unique_words: int
    vocabulary_richness: float
    advanced_word_count: int

    sentiment_score: float
    sentiment_label: str

    grammar_score: float
    vocabulary_score: float
    wpm_score: float
    filler_score: float
    sentiment_score_component: float
    overall_score: float


class ReportCreate(BaseModel):
    """Payload sent by the frontend to persist an analysis as a report."""

    title: Optional[str] = "Untitled Session"
    transcript: str
    duration_seconds: float
    word_count: int
    wpm: float
    filler_count: int
    filler_words: dict
    grammar_errors: int
    grammar_issues: List[GrammarIssue] = []
    vocabulary_unique_words: int
    vocabulary_richness: float
    advanced_word_count: int
    sentiment_score: float
    sentiment_label: str
    grammar_score: float
    vocabulary_score: float
    wpm_score: float
    filler_score: float
    sentiment_score_component: float
    overall_score: float


class ReportOut(BaseModel):
    id: int
    title: Optional[str]
    transcript: str
    duration_seconds: float
    word_count: int
    wpm: float
    filler_count: int
    filler_words: Optional[str]
    grammar_errors: int
    grammar_issues: Optional[str]
    vocabulary_unique_words: int
    vocabulary_richness: float
    advanced_word_count: int
    sentiment_score: float
    sentiment_label: Optional[str]
    grammar_score: float
    vocabulary_score: float
    wpm_score: float
    filler_score: float
    sentiment_score_component: float
    overall_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class ReportSummary(BaseModel):
    """Lightweight representation used in history lists."""

    id: int
    title: Optional[str]
    overall_score: float
    wpm: float
    filler_count: int
    grammar_errors: int
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_reports: int
    average_score: float
    average_wpm: float
    average_fillers: float
    average_grammar_errors: float
    best_score: float
    latest_score: float
    score_trend: List[float]
    dates: List[str]
