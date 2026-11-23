/**
 * useAudioRecorder
 *
 * Encapsulates all MediaRecorder API logic: requesting microphone access,
 * starting/stopping recording, tracking elapsed time, and exposing a
 * live volume "level" (0-1) via the Web Audio API so the UI can render
 * a reactive waveform/level meter while recording.
 */
import { useCallback, useRef, useState } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const stopLevelMetering = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const meterLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);

    // Compute a simple RMS-based volume level normalized to 0-1.
    let sumSquares = 0;
    for (let i = 0; i < data.length; i += 1) {
      const normalized = (data[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    setLevel(Math.min(1, rms * 4)); // amplify a bit for a livelier visual

    animationFrameRef.current = requestAnimationFrame(meterLoop);
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // --- Web Audio analyser for the live level meter ---
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      animationFrameRef.current = requestAnimationFrame(meterLoop);

      // --- MediaRecorder for the actual capture ---
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setElapsedSeconds(((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } catch (err) {
      setError(
        "Microphone access was denied or is unavailable. Please allow " +
          "microphone permissions and try again."
      );
    }
  }, [meterLoop]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const finalDuration = (Date.now() - startTimeRef.current) / 1000;

        // Tear everything down.
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stopLevelMetering();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setIsRecording(false);
        setLevel(0);

        resolve({ blob, duration: finalDuration });
      };

      recorder.stop();
    });
  }, []);

  const resetRecorder = useCallback(() => {
    setElapsedSeconds(0);
    setLevel(0);
    setError("");
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    elapsedSeconds,
    level,
    error,
    startRecording,
    stopRecording,
    resetRecorder,
  };
}
