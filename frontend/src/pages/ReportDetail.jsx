/**
 * ReportDetail page.
 *
 * Fetches a single saved report and renders the full score breakdown,
 * metrics, and annotated transcript -- the same visual treatment as the
 * results screen right after recording, but for a persisted report.
 *
 * Note: filler_words and grammar_issues are stored server-side as JSON
 * strings (see ReportOut schema), so they're parsed here before being
 * handed to the presentational components.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ScoreRing from "../components/ScoreRing";
import MetricBar from "../components/MetricBar";
import TranscriptViewer from "../components/TranscriptViewer";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertBanner from "../components/AlertBanner";
import { deleteReport, getReport } from "../api/endpoints";

function safeParse(jsonString, fallback) {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getReport(id)
      .then((res) => {
        if (isMounted) setReport(res.data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || "Could not load this report.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteReport(id);
      navigate("/history", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete this report.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <LoadingSpinner label="Loading report..." large />
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="page">
        <div className="container">
          <AlertBanner type="error">{error}</AlertBanner>
          <Link to="/history" className="btn btn-ghost">
            ← Back to history
          </Link>
        </div>
      </div>
    );
  }

  const fillerWords = safeParse(report.filler_words, {});
  const grammarIssues = safeParse(report.grammar_issues, []);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <span className="page-eyebrow">
              {new Date(report.created_at).toLocaleString()}
            </span>
            <h1 className="page-title">{report.title || "Untitled Session"}</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/history" className="btn btn-ghost">
              ← Back to history
            </Link>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete report"}
            </button>
          </div>
        </div>

        <AlertBanner type="error">{error}</AlertBanner>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="results-grid">
            <div className="results-score-panel">
              <ScoreRing score={report.overall_score} size={180} label="Overall score" />
              <div className="badge badge-teal" style={{ textTransform: "capitalize" }}>
                {report.sentiment_label} tone
              </div>
            </div>

            <div>
              <MetricBar
                label="Grammar"
                value={report.grammar_score}
                weightPct={30}
                color="var(--color-teal)"
              />
              <MetricBar
                label="Vocabulary"
                value={report.vocabulary_score}
                weightPct={25}
                color="var(--color-coral)"
              />
              <MetricBar
                label="Speaking speed"
                value={report.wpm_score}
                weightPct={20}
                color="var(--color-amber)"
              />
              <MetricBar
                label="Filler words"
                value={report.filler_score}
                weightPct={15}
                color="var(--color-green)"
              />
              <MetricBar
                label="Sentiment"
                value={report.sentiment_score_component}
                weightPct={10}
                color="#9b8cff"
              />

              <hr className="divider" />

              <div className="detail-meta-grid" style={{ marginTop: 0 }}>
                <div className="detail-meta-item">
                  <div className="detail-meta-value">{report.wpm}</div>
                  <div className="detail-meta-label">Words / min</div>
                </div>
                <div className="detail-meta-item">
                  <div className="detail-meta-value">{report.word_count}</div>
                  <div className="detail-meta-label">Word count</div>
                </div>
                <div className="detail-meta-item">
                  <div className="detail-meta-value">{report.filler_count}</div>
                  <div className="detail-meta-label">Filler words</div>
                </div>
                <div className="detail-meta-item">
                  <div className="detail-meta-value">{report.grammar_errors}</div>
                  <div className="detail-meta-label">Grammar issues</div>
                </div>
              </div>

              {Object.keys(fillerWords).length > 0 && (
                <div className="filler-chip-list">
                  {Object.entries(fillerWords).map(([word, count]) => (
                    <span key={word} className="badge badge-amber">
                      "{word}" × {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 14 }}>
            Transcript
          </h3>
          <TranscriptViewer
            transcript={report.transcript}
            fillerWords={fillerWords}
            grammarIssues={grammarIssues}
          />
        </div>
      </div>
    </div>
  );
}
