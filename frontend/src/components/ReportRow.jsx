/**
 * ReportRow
 *
 * Compact summary row for a single saved report, used in both the
 * dashboard's "recent sessions" list and the full History page.
 */
import { Link } from "react-router-dom";

function scoreColor(score) {
  if (score >= 80) return "var(--color-green)";
  if (score >= 60) return "var(--color-amber)";
  return "var(--color-coral)";
}

export default function ReportRow({ report, onDelete }) {
  const color = scoreColor(report.overall_score);

  return (
    <div className="report-row">
      <div
        className="report-row-score"
        style={{ background: `${color}22`, color }}
      >
        {Math.round(report.overall_score)}
      </div>

      <div className="report-row-main">
        <div className="report-row-title">{report.title || "Untitled Session"}</div>
        <div className="report-row-meta">
          {new Date(report.created_at).toLocaleString()} · {report.wpm} WPM ·{" "}
          {report.filler_count} fillers · {report.grammar_errors} grammar issues
        </div>
      </div>

      <div className="report-row-actions">
        <Link to={`/reports/${report.id}`} className="btn btn-ghost">
          View
        </Link>
        {onDelete && (
          <button className="btn btn-danger" onClick={() => onDelete(report.id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
