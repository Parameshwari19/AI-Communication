"""
Speech-to-text transcription using faster-whisper.

The model is loaded lazily and cached as a module-level singleton so it
is only initialized once per process, regardless of how many requests
come in.
"""
from typing import Tuple

from faster_whisper import WhisperModel

from app.config import settings

_model: WhisperModel = None


def get_model() -> WhisperModel:
    """Lazily instantiate (and cache) the faster-whisper model."""
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )
    return _model


def transcribe_audio(file_path: str) -> Tuple[str, float]:
    """
    Transcribe an audio file on disk.

    Returns:
        transcript: the full transcribed text.
        duration_seconds: total duration of the audio, as reported by
            the model's decoder (used for WPM calculation).
    """
    model = get_model()

    segments, info = model.transcribe(
        file_path,
        beam_size=5,
        vad_filter=True,  # trims silence so duration better matches speech
        language="en",
    )

    text_parts = [segment.text.strip() for segment in segments]
    transcript = " ".join(part for part in text_parts if part).strip()

    duration_seconds = float(info.duration) if info and info.duration else 0.0

    return transcript, duration_seconds
