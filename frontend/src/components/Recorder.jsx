/**
 * Recorder
 *
 * Self-contained recording widget built on top of the useAudioRecorder
 * hook. Renders a mic button, a reactive waveform meter (driven by the
 * live audio level), and an elapsed-time readout. When the user stops
 * recording, `onRecordingComplete(blob, durationSeconds)` is invoked
 * with the captured audio so the parent page can send it for analysis.
 */
import { useMemo, useRef } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

const BAR_COUNT = 32;

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function Recorder({ onRecordingComplete, disabled }) {
  const { isRecording, elapsedSeconds, level, error, startRecording, stopRecording } =
    useAudioRecorder();

  // Stable per-bar random factors so the waveform looks organic rather
  // than perfectly uniform, generated once per mount.
  const barFactorsRef = useRef(
    Array.from({ length: BAR_COUNT }, () => 0.45 + Math.random() * 0.9)
  );

  const barHeights = useMemo(() => {
    return barFactorsRef.current.map((factor) => {
      const base = 6;
      const max = 78;
      const h = base + level * max * factor;
      return Math.min(max, Math.round(h));
    });
  }, [level]);

  const handleToggle = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result && result.blob && result.blob.size > 0) {
        onRecordingComplete(result.blob, result.duration);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="studio">
      <div className={`waveform ${isRecording ? "" : "idle"}`}>
        {barHeights.map((h, i) => (
          <span key={i} className="waveform-bar" style={{ height: `${h}px` }} />
        ))}
      </div>

      <div className="studio-timer">{formatTime(elapsedSeconds)}</div>
      <div className="studio-status">
        {isRecording ? "Recording — speak naturally" : "Ready when you are"}
      </div>

      <button
        type="button"
        className={`mic-button ${isRecording ? "recording" : ""}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          // Stop icon (square)
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        ) : (
          // Mic icon
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
              fill="currentColor"
            />
            <path
              d="M19 11a7 7 0 0 1-14 0M12 18v3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {error && (
        <div className="alert alert-error" style={{ marginTop: 24, maxWidth: 420 }}>
          {error}
        </div>
      )}

      <div className="studio-tips">
        <p>For the most accurate analysis:</p>
        <ul>
          <li>Speak for at least 20-30 seconds for a reliable WPM and score.</li>
          <li>Use a quiet room and keep the microphone close.</li>
          <li>Speak naturally — this analysis works best on conversational speech.</li>
        </ul>
      </div>
    </div>
  );
}
