/**
 * ScoreRing
 *
 * Circular SVG gauge that visualizes a 0-100 score, color-coded by
 * performance tier (red/amber/green). Used on the dashboard, results
 * panel, and report detail page as the app's "signature" visual.
 */
export default function ScoreRing({ score = 0, size = 160, strokeWidth = 12, label = "Overall score" }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  let color = "var(--color-coral)";
  if (clamped >= 80) color = "var(--color-green)";
  else if (clamped >= 60) color = "var(--color-amber)";

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-soft)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="score-ring-value">
        <span
          className="score-ring-number"
          style={{ fontSize: size * 0.26, color }}
        >
          {Math.round(clamped)}
        </span>
        <span className="score-ring-label">{label}</span>
      </div>
    </div>
  );
}
