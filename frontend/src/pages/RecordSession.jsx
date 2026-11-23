/**
 * RecordSession page.
 *
 * Three-phase flow:
 *   1. "record"    - show the Recorder widget, waiting for input.
 *   2. "analyzing" - audio uploaded, waiting on the backend pipeline
 *                    (transcription + grammar/vocabulary/filler/sentiment).
 *   3. "results"   - show the full score breakdown + transcript, let the
 *                    user title and save the report (or discard and redo).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Recorder from "../components/Recorder";
import ScoreRing from "../components/ScoreRing";
import MetricBar from "../components/MetricBar";
import TranscriptViewer from "../components/TranscriptViewer";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertBanner from "../components/AlertBanner";
import { saveReport, transcribeAndAnalyze } from "../api/endpoints";

export default function RecordSession() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("record"); // record | analyzing | results
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleRecordingComplete = async (blob) => {
    setPhase("analyzing");
    setError("");
    try {
      const res = await transcribeAndAnalyze(blob);
      setResult(res.data);
      setPhase("results");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not analyze your recording. Please try again."
      );
      setPhase("record");
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...result, title: title.trim() || "Untitled Session" };
      const res = await saveReport(payload);
      navigate(`/reports/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save this report.");
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setResult(null);
    setTitle("");
    setPhase("record");
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <span className="page-eyebrow">Practice session</span>
            <h1 className="page-title">Record &amp; analyze</h1>
            <p className="page-subtitle">
              Hit record, speak for at least 20-30 seconds, then stop to get
              your grammar, vocabulary, pace, and filler-word breakdown.
            </p>
          </div>
        </div>

        <AlertBanner type="error">{error}</AlertBanner>

        {phase === "record" && (
          <div className="card">
            <Recorder onRecordingComplete={handleRecordingComplete} />
          </div>
        )}

        {phase === "analyzing" && (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <LoadingSpinner label="Transcribing and analyzing your speech..." large />
            </div>
            <p style={{ marginTop: 16 }}>
              This can take a few seconds depending on the length of your
              recording.
            </p>
          </div>
        )}

        {phase === "results" && result && (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="results-grid">
                <div className="results-score-panel">
                  <ScoreRing score={result.overall_score} size={180} label="Overall score" />

                  <div className="field" style={{ width: "100%", textAlign: "left" }}>
                    <label htmlFor="title">Session title (optional)</label>
                    <input
                      id="title"
                      className="input"
                      placeholder="e.g. Mock interview practice"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save report"}
                  </button>
                  <button
                    className="btn btn-ghost btn-block"
                    onClick={handleDiscard}
                    disabled={saving}
                  >
                    Discard &amp; record again
                  </button>
                </div>

                <div>
                  <MetricBar
                    label="Grammar"
                    value={result.grammar_score}
                    weightPct={30}
                    color="var(--color-teal)"
                  />
                  <MetricBar
                    label="Vocabulary"
                    value={result.vocabulary_score}
                    weightPct={25}
                    color="var(--color-coral)"
                  />
                  <MetricBar
                    label="Speaking speed"
                    value={result.wpm_score}
                    weightPct={20}
                    color="var(--color-amber)"
                  />
                  <MetricBar
                    label="Filler words"
                    value={result.filler_score}
                    weightPct={15}
                    color="var(--color-green)"
                  />
                  <MetricBar
                    label="Sentiment"
                    value={result.sentiment_score_component}
                    weightPct={10}
                    color="#9b8cff"
                  />

                  <hr className="divider" />

                  <div className="detail-meta-grid" style={{ marginTop: 0 }}>
                    <div className="detail-meta-item">
                      <div className="detail-meta-value">{result.wpm}</div>
                      <div className="detail-meta-label">Words / min</div>
                    </div>
                    <div className="detail-meta-item">
                      <div className="detail-meta-value">{result.word_count}</div>
                      <div className="detail-meta-label">Word count</div>
                    </div>
                    <div className="detail-meta-item">
                      <div className="detail-meta-value">{result.filler_count}</div>
                      <div className="detail-meta-label">Filler words</div>
                    </div>
                    <div className="detail-meta-item">
                      <div className="detail-meta-value">{result.grammar_errors}</div>
                      <div className="detail-meta-label">Grammar issues</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 14 }}>
                Transcript
              </h3>
              <TranscriptViewer
                transcript={result.transcript}
                fillerWords={result.filler_words}
                grammarIssues={result.grammar_issues}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
