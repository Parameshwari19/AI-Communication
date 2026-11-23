/**
 * MetricBar
 *
 * Horizontal progress bar representing one sub-score that feeds into the
 * overall weighted score (e.g. Grammar 30%, Vocabulary 25%...).
 */
export default function MetricBar({ label, value, weightPct, color = "var(--color-teal)", suffix = "" }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="metric-bar-row">
      <div className="metric-bar-head">
        <span className="metric-bar-label">
          {label} <span className="metric-bar-weight">({weightPct}% weight)</span>
        </span>
        <span className="metric-bar-value">{Math.round(clamped)}{suffix}</span>
      </div>
      <div className="metric-bar-track">
        <div
          className="metric-bar-fill"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    </div>
  );
}
