"""
Speech analysis routes.

Accepts an uploaded audio recording, transcribes it with faster-whisper,
runs the full linguistic analysis pipeline (grammar, vocabulary, fillers,
sentiment, WPM), computes the weighted communication score, and returns
everything to the frontend. This endpoint does NOT persist anything to
the database -- saving happens via a separate explicit call to
/api/reports once the user reviews their results.
"""
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth import get_current_user
from app.config import settings
from app.models import User
from app.schemas import AnalysisResult
from app.services.analysis import (
    analyze_grammar,
    analyze_sentiment,
    analyze_vocabulary,
    calculate_wpm,
    detect_fillers,
)
from app.services.scoring import compute_overall_score
from app.services.transcription import transcribe_audio

router = APIRouter(prefix="/api/speech", tags=["Speech Analysis"])

# Audio container formats the browser's MediaRecorder commonly produces.
ALLOWED_EXTENSIONS = {".webm", ".ogg", ".wav", ".mp3", ".m4a", ".mp4"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB safety cap


@router.post("/transcribe", response_model=AnalysisResult)
async def transcribe_and_analyze(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Transcribe an uploaded audio recording and run full analysis."""

    # --- Validate file extension ---
    _, ext = os.path.splitext(audio.filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        # Browsers sometimes omit a useful filename/extension for blobs;
        # default to .webm (the most common MediaRecorder output) rather
        # than rejecting outright.
        ext = ".webm"

    # --- Persist the upload to a temp file on disk for whisper to read ---
    temp_filename = f"{uuid.uuid4().hex}{ext}"
    temp_path = settings.UPLOAD_DIR / temp_filename

    try:
        contents = await audio.read()
        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded audio file is empty.",
            )
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file is too large (max 50MB).",
            )

        with open(temp_path, "wb") as f:
            f.write(contents)

        # --- Speech-to-text ---
        try:
            transcript, duration_seconds = transcribe_audio(str(temp_path))
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Could not transcribe audio: {exc}",
            )

        if not transcript.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No speech could be detected in the recording. "
                "Please try again and speak clearly into the microphone.",
            )

        # --- Run full analysis pipeline ---
        filler_count, filler_words = detect_fillers(transcript)
        grammar_errors, grammar_issues = analyze_grammar(transcript)
        word_count, unique_words, richness, advanced_word_count = analyze_vocabulary(
            transcript
        )
        sentiment_score, sentiment_label = analyze_sentiment(transcript)
        wpm = calculate_wpm(word_count, duration_seconds)

        breakdown = compute_overall_score(
            grammar_errors=grammar_errors,
            richness=richness,
            advanced_word_count=advanced_word_count,
            wpm=wpm,
            filler_count=filler_count,
            word_count=word_count,
            sentiment_compound=sentiment_score,
        )

        return AnalysisResult(
            transcript=transcript,
            duration_seconds=round(duration_seconds, 2),
            word_count=word_count,
            wpm=wpm,
            filler_count=filler_count,
            filler_words=filler_words,
            grammar_errors=grammar_errors,
            grammar_issues=grammar_issues,
            vocabulary_unique_words=unique_words,
            vocabulary_richness=richness,
            advanced_word_count=advanced_word_count,
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label,
            grammar_score=breakdown.grammar_score,
            vocabulary_score=breakdown.vocabulary_score,
            wpm_score=breakdown.wpm_score,
            filler_score=breakdown.filler_score,
            sentiment_score_component=breakdown.sentiment_score_component,
            overall_score=breakdown.overall_score,
        )
    finally:
        # Always clean up the temp audio file, even on failure.
        if temp_path.exists():
            try:
                os.remove(temp_path)
            except OSError:
                pass
