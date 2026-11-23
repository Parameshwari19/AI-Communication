/**
 * TranscriptViewer
 *
 * Renders the full transcript text with inline highlights:
 * - amber highlight for detected filler words/phrases
 * - red wavy underline for grammar issues flagged by LanguageTool
 *
 * Grammar issues carry exact character offsets into the original
 * transcript (from language_tool_python), so they take priority over
 * filler-word matches when ranges overlap.
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function TranscriptViewer({ transcript, fillerWords = {}, grammarIssues = [] }) {
  if (!transcript) {
    return <p>No transcript available.</p>;
  }

  const marks = [];

  // 1. Grammar issues (offset-based, from LanguageTool)
  grammarIssues.forEach((issue) => {
    if (typeof issue.offset === "number" && typeof issue.length === "number") {
      marks.push({
        start: issue.offset,
        end: issue.offset + issue.length,
        type: "grammar",
        title: issue.suggestion
          ? `${issue.message} -> try "${issue.suggestion}"`
          : issue.message,
      });
    }
  });

  // 2. Filler word occurrences (regex-based, skipping anything that
  //    already overlaps a grammar mark)
  Object.keys(fillerWords).forEach((filler) => {
    const pattern = new RegExp(`\\b${escapeRegExp(filler)}\\b`, "gi");
    let match = pattern.exec(transcript);
    while (match !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = marks.some((m) => start < m.end && end > m.start);
      if (!overlaps) {
        marks.push({ start, end, type: "filler", title: `Filler word: "${match[0]}"` });
      }
      match = pattern.exec(transcript);
    }
  });

  marks.sort((a, b) => a.start - b.start);

  // Resolve any remaining overlaps by keeping the earliest-starting mark.
  const cleanMarks = [];
  let lastEnd = 0;
  marks.forEach((m) => {
    if (m.start >= lastEnd) {
      cleanMarks.push(m);
      lastEnd = m.end;
    }
  });

  // Build renderable segments by slicing the transcript around each mark.
  const segments = [];
  let cursor = 0;
  cleanMarks.forEach((m) => {
    if (m.start > cursor) {
      segments.push({ text: transcript.slice(cursor, m.start), mark: null });
    }
    segments.push({ text: transcript.slice(m.start, m.end), mark: m.type, title: m.title });
    cursor = m.end;
  });
  if (cursor < transcript.length) {
    segments.push({ text: transcript.slice(cursor), mark: null });
  }

  return (
    <div className="transcript-box">
      {segments.map((seg, i) =>
        seg.mark ? (
          <mark key={i} className={seg.mark} title={seg.title}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}
