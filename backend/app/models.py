"""
SQLAlchemy ORM models.

Two tables back the application:
- users:   account records used for authentication.
- reports: a saved analysis/report generated from a recorded speech session.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One user can have many saved reports.
    reports = relationship(
        "Report", back_populates="owner", cascade="all, delete-orphan"
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Raw transcription text produced by faster-whisper.
    transcript = Column(Text, nullable=False)

    # Core metrics
    duration_seconds = Column(Float, nullable=False, default=0.0)
    word_count = Column(Integer, nullable=False, default=0)
    wpm = Column(Float, nullable=False, default=0.0)

    filler_count = Column(Integer, nullable=False, default=0)
    filler_words = Column(Text, nullable=True)  # JSON-encoded list/dict

    grammar_errors = Column(Integer, nullable=False, default=0)
    grammar_issues = Column(Text, nullable=True)  # JSON-encoded list of issues

    vocabulary_unique_words = Column(Integer, nullable=False, default=0)
    vocabulary_richness = Column(Float, nullable=False, default=0.0)
    advanced_word_count = Column(Integer, nullable=False, default=0)

    sentiment_score = Column(Float, nullable=False, default=0.0)
    sentiment_label = Column(String(20), nullable=True)

    # Sub-scores (0-100) and weighted final score
    grammar_score = Column(Float, nullable=False, default=0.0)
    vocabulary_score = Column(Float, nullable=False, default=0.0)
    wpm_score = Column(Float, nullable=False, default=0.0)
    filler_score = Column(Float, nullable=False, default=0.0)
    sentiment_score_component = Column(Float, nullable=False, default=0.0)
    overall_score = Column(Float, nullable=False, default=0.0)

    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    owner = relationship("User", back_populates="reports")
