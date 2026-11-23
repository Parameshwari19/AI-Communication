"""
Linguistic analysis service.

Provides the building-block metrics used to compute the overall
communication score:
- Filler word detection
- Grammar checking (language_tool_python)
- Vocabulary richness analysis (spaCy)
- Sentiment analysis (NLTK VADER)
- Words-per-minute calculation
"""
import re
import subprocess
import sys
from typing import Dict, List, Tuple

import nltk
import spacy

# ---------------------------------------------------------------------------
# Filler words / phrases commonly used in spoken English.
# Longer phrases are listed before their single-word substrings so phrase
# matches are not double counted as part of shorter matches.
# ---------------------------------------------------------------------------
FILLER_WORDS = [
    "you know",
    "i mean",
    "sort of",
    "kind of",
    "i guess",
    "basically",
    "actually",
    "literally",
    "honestly",
    "um",
    "umm",
    "uh",
    "uhh",
    "er",
    "erm",
    "like",
    "so",
    "well",
    "right",
    "okay so",
]


# ---------------------------------------------------------------------------
# Lazy-loaded NLP resources. Each is initialized once per process.
# ---------------------------------------------------------------------------
_nlp = None
_lang_tool = None
_sia = None
_nltk_ready = False


def _ensure_nltk_data():
    """Download required NLTK corpora the first time they're needed."""
    global _nltk_ready
    if _nltk_ready:
        return
    for resource in ("vader_lexicon", "punkt", "punkt_tab"):
        try:
            nltk.data.find(f"sentiment/{resource}" if resource == "vader_lexicon" else f"tokenizers/{resource}")
        except LookupError:
            try:
                nltk.download(resource, quiet=True)
            except Exception:
                pass
    _nltk_ready = True


def get_spacy_model():
    """Load the spaCy English model, auto-downloading it if missing."""
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Model not installed yet -- attempt a one-time auto download.
            subprocess.run(
                [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
                check=False,
            )
            _nlp = spacy.load("en_core_web_sm")
    return _nlp


def get_language_tool():
    """Load the LanguageTool grammar checker instance."""
    global _lang_tool
    if _lang_tool is None:
        import language_tool_python

        from app.config import settings

        _lang_tool = language_tool_python.LanguageTool(settings.LANGUAGE_TOOL_LANG)
    return _lang_tool


def get_sentiment_analyzer():
    """Load the NLTK VADER sentiment analyzer."""
    global _sia
    if _sia is None:
        _ensure_nltk_data()
        from nltk.sentiment import SentimentIntensityAnalyzer

        _sia = SentimentIntensityAnalyzer()
    return _sia


# ---------------------------------------------------------------------------
# Filler word detection
# ---------------------------------------------------------------------------
def detect_fillers(transcript: str) -> Tuple[int, Dict[str, int]]:
    """Count occurrences of common filler words/phrases in the transcript.

    Returns the total filler count and a breakdown dict, e.g.
    {"um": 3, "like": 2, "you know": 1}.
    """
    text = f" {transcript.lower()} "
    counts: Dict[str, int] = {}
    consumed_spans = []

    # Sort by length (longest first) so phrases are matched before the
    # shorter words they contain (e.g. "you know" before "know").
    for filler in sorted(FILLER_WORDS, key=len, reverse=True):
        pattern = r"\b" + re.escape(filler) + r"\b"
        for match in re.finditer(pattern, text):
            span = (match.start(), match.end())
            # Skip if this span overlaps a previously counted (longer) match.
            if any(span[0] < e and span[1] > s for s, e in consumed_spans):
                continue
            consumed_spans.append(span)
            counts[filler] = counts.get(filler, 0) + 1

    total = sum(counts.values())
    return total, counts


# ---------------------------------------------------------------------------
# Grammar analysis
# ---------------------------------------------------------------------------
def analyze_grammar(transcript: str) -> Tuple[int, List[dict]]:
    """Run the transcript through LanguageTool and return error count plus
    a structured list of issues."""
    if not transcript.strip():
        return 0, []

    tool = get_language_tool()
    matches = tool.check(transcript)

    issues = []
    for m in matches:
        error_text = transcript[m.offset: m.offset + m.errorLength]
        issues.append(
            {
                "message": m.message,
                "error_text": error_text,
                "suggestion": m.replacements[0] if m.replacements else None,
                "offset": m.offset,
                "length": m.errorLength,
            }
        )
    return len(issues), issues


# ---------------------------------------------------------------------------
# Vocabulary analysis
# ---------------------------------------------------------------------------
def analyze_vocabulary(transcript: str) -> Tuple[int, int, float, int]:
    """Analyze vocabulary usage.

    Returns:
        word_count: total alphabetic word tokens.
        unique_words: count of distinct lowercase words.
        richness: type-token ratio (unique / total), a proxy for lexical
            diversity.
        advanced_word_count: number of distinct "advanced" words, defined
            here as words of 7+ characters that are not stopwords.
    """
    if not transcript.strip():
        return 0, 0, 0.0, 0

    nlp = get_spacy_model()
    doc = nlp(transcript)

    words = [token.text.lower() for token in doc if token.is_alpha]
    word_count = len(words)
    unique_set = set(words)
    unique_words = len(unique_set)
    richness = round(unique_words / word_count, 4) if word_count else 0.0

    advanced_words = [
        token.text.lower()
        for token in doc
        if token.is_alpha and not token.is_stop and len(token.text) >= 7
    ]
    advanced_word_count = len(set(advanced_words))

    return word_count, unique_words, richness, advanced_word_count


# ---------------------------------------------------------------------------
# Sentiment analysis
# ---------------------------------------------------------------------------
def analyze_sentiment(transcript: str) -> Tuple[float, str]:
    """Return VADER compound sentiment score (-1..1) and a label."""
    if not transcript.strip():
        return 0.0, "neutral"

    sia = get_sentiment_analyzer()
    scores = sia.polarity_scores(transcript)
    compound = round(scores["compound"], 4)

    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return compound, label


# ---------------------------------------------------------------------------
# Speaking speed
# ---------------------------------------------------------------------------
def calculate_wpm(word_count: int, duration_seconds: float) -> float:
    """Words spoken per minute. Guards against division by zero."""
    if duration_seconds <= 0:
        return 0.0
    minutes = duration_seconds / 60.0
    return round(word_count / minutes, 2) if minutes > 0 else 0.0
