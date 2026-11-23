/**
 * AlertBanner
 *
 * Reusable inline message banner. `type` controls the color treatment:
 * "error" | "success" | "info".
 */
export default function AlertBanner({ type = "info", children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`}>{children}</div>;
}
