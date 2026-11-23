"""
Scoring service.

Converts raw linguistic metrics into normalized 0-100 sub-scores, then
combines them into a single weighted overall communication score using
the following weighting scheme:

    Grammar     30%
    Vocabulary  25%
    WPM         20%
    Fillers     15%
    Sentiment   10%
"""
from dataclasses import dataclass

WEIGHTS = {
    "grammar": 0.30,
    "vocabulary": 0.25,
    "wpm": 0.20,
    "fillers": 0.15,
    "sentiment": 0.10,
}

IDEAL_WPM_MIN = 120
IDEAL_WPM_MAX = 160


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def score_grammar(grammar_errors: int, word_count: int) -> float:
    """Fewer grammar errors relative to speech length = higher score.
    Each grammar error per 100 words deducts 8 points."""
    if word_count == 0:
        return 0.0
    errors_per_100_words = (grammar_errors / word_count) * 100
    return round(_clamp(100 - errors_per_100_words * 8), 2)


def score_vocabulary(richness: float, advanced_word_count: int, word_count: int) -> float:
    """Blend of lexical diversity (type-token ratio) and use of longer,
    more sophisticated vocabulary."""
    if word_count == 0:
        return 0.0

    richness_score = _clamp(richness * 150)  # TTR of ~0.66 -> 99 points
    advanced_ratio = advanced_word_count / word_count
    advanced_score = _clamp(advanced_ratio * 300)  # ~33% advanced words -> 99

    blended = 0.6 * richness_score + 0.4 * advanced_score
    return round(_clamp(blended), 2)


def score_wpm(wpm: float) -> float:
    """Speaking speed score. 120-160 WPM is considered the ideal
    conversational/presentation range; scores fall off outside it."""
    if wpm <= 0:
        return 0.0
    if IDEAL_WPM_MIN <= wpm <= IDEAL_WPM_MAX:
        return 100.0
    if wpm < IDEAL_WPM_MIN:
        deficit = IDEAL_WPM_MIN - wpm
        return round(_clamp(100 - deficit * 1.5), 2)
    excess = wpm - IDEAL_WPM_MAX
    return round(_clamp(100 - excess * 1.2), 2)


def score_fillers(filler_count: int, word_count: int) -> float:
    """Fewer filler words relative to total speech = higher score.
    Each 1% filler ratio deducts 4 points."""
    if word_count == 0:
        return 100.0 if filler_count == 0 else 0.0
    filler_ratio_pct = (filler_count / word_count) * 100
    return round(_clamp(100 - filler_ratio_pct * 4), 2)


def score_sentiment(compound_score: float) -> float:
    """Map VADER compound score (-1..1) onto a 0-100 scale."""
    return round(_clamp((compound_score + 1) / 2 * 100), 2)


@dataclass
class ScoreBreakdown:
    grammar_score: float
    vocabulary_score: float
    wpm_score: float
    filler_score: float
    sentiment_score_component: float
    overall_score: float


def compute_overall_score(
    grammar_errors: int,
    richness: float,
    advanced_word_count: int,
    wpm: float,
    filler_count: int,
    word_count: int,
    sentiment_compound: float,
) -> ScoreBreakdown:
    """Compute every sub-score plus the final weighted overall score."""

    grammar_score = score_grammar(grammar_errors, word_count)
    vocabulary_score = score_vocabulary(richness, advanced_word_count, word_count)
    wpm_score = score_wpm(wpm)
    filler_score = score_fillers(filler_count, word_count)
    sentiment_component = score_sentiment(sentiment_compound)

    overall = (
        grammar_score * WEIGHTS["grammar"]
        + vocabulary_score * WEIGHTS["vocabulary"]
        + wpm_score * WEIGHTS["wpm"]
        + filler_score * WEIGHTS["fillers"]
        + sentiment_component * WEIGHTS["sentiment"]
    )

    return ScoreBreakdown(
        grammar_score=grammar_score,
        vocabulary_score=vocabulary_score,
        wpm_score=wpm_score,
        filler_score=filler_score,
        sentiment_score_component=sentiment_component,
        overall_score=round(_clamp(overall), 2),
    )
