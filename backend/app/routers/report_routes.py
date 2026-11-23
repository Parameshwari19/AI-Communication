"""
Report routes.

Handles persisting analysis results as reports, listing report history,
fetching a single report, deleting reports, and computing dashboard
statistics (averages, trends) using pandas/numpy.
"""
import json
from typing import List

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Report, User
from app.schemas import DashboardStats, ReportCreate, ReportOut, ReportSummary

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist an analysis result as a report belonging to the current user."""

    report = Report(
        user_id=current_user.id,
        title=payload.title or "Untitled Session",
        transcript=payload.transcript,
        duration_seconds=payload.duration_seconds,
        word_count=payload.word_count,
        wpm=payload.wpm,
        filler_count=payload.filler_count,
        filler_words=json.dumps(payload.filler_words),
        grammar_errors=payload.grammar_errors,
        grammar_issues=json.dumps([issue.model_dump() for issue in payload.grammar_issues]),
        vocabulary_unique_words=payload.vocabulary_unique_words,
        vocabulary_richness=payload.vocabulary_richness,
        advanced_word_count=payload.advanced_word_count,
        sentiment_score=payload.sentiment_score,
        sentiment_label=payload.sentiment_label,
        grammar_score=payload.grammar_score,
        vocabulary_score=payload.vocabulary_score,
        wpm_score=payload.wpm_score,
        filler_score=payload.filler_score,
        sentiment_score_component=payload.sentiment_score_component,
        overall_score=payload.overall_score,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=List[ReportSummary])
def list_reports(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List report history for the current user, most recent first."""
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return reports


@router.get("/stats/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compute aggregate statistics across all of the user's reports using
    pandas/numpy: averages, best score, and a chronological score trend
    suitable for charting."""

    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.asc())
        .all()
    )

    if not reports:
        return DashboardStats(
            total_reports=0,
            average_score=0.0,
            average_wpm=0.0,
            average_fillers=0.0,
            average_grammar_errors=0.0,
            best_score=0.0,
            latest_score=0.0,
            score_trend=[],
            dates=[],
        )

    df = pd.DataFrame(
        [
            {
                "overall_score": r.overall_score,
                "wpm": r.wpm,
                "filler_count": r.filler_count,
                "grammar_errors": r.grammar_errors,
                "created_at": r.created_at,
            }
            for r in reports
        ]
    )

    return DashboardStats(
        total_reports=int(len(df)),
        average_score=round(float(np.mean(df["overall_score"])), 2),
        average_wpm=round(float(np.mean(df["wpm"])), 2),
        average_fillers=round(float(np.mean(df["filler_count"])), 2),
        average_grammar_errors=round(float(np.mean(df["grammar_errors"])), 2),
        best_score=round(float(np.max(df["overall_score"])), 2),
        latest_score=round(float(df["overall_score"].iloc[-1]), 2),
        score_trend=[round(float(v), 2) for v in df["overall_score"].tolist()],
        dates=[d.strftime("%Y-%m-%d %H:%M") for d in df["created_at"].tolist()],
    )


@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single report by ID, scoped to the current user."""
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found."
        )
    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a report owned by the current user."""
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found."
        )
    db.delete(report)
    db.commit()
    return None
