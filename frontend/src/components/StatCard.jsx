/**
 * StatCard
 *
 * Small icon + value + label card used in the dashboard stat row.
 */
export default function StatCard({ icon, value, label, accent = "teal" }) {
  return (
    <div className="card card-tight stat-card">
      <div
        className="stat-icon"
        style={{
          background: `var(--color-${accent}-soft)`,
          color: `var(--color-${accent})`,
        }}
      >
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
