/**
 * LoadingSpinner
 *
 * Small reusable spinner with an optional label. Used anywhere the app
 * is waiting on an async operation (auth check, API calls, transcription).
 */
export default function LoadingSpinner({ label, large = false }) {
  return (
    <div className="loading-row">
      <span className={`spinner ${large ? "spinner-lg" : ""}`} />
      {label && <span>{label}</span>}
    </div>
  );
}
