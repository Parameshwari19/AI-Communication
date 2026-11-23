/**
 * History page.
 *
 * Lists every report the user has saved, most recent first, with the
 * ability to jump into a report's detail view or delete it.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { deleteReport, listReports } from "../api/endpoints";
import ReportRow from "../components/ReportRow";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertBanner from "../components/AlertBanner";

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    listReports(0, 200)
      .then((res) => {
        if (isMounted) setReports(res.data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || "Could not load your report history.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete this report.");
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <span className="page-eyebrow">All sessions</span>
            <h1 className="page-title">History</h1>
            <p className="page-subtitle">
              Every recorded session you've saved, with its full score
              breakdown one click away.
            </p>
          </div>
          <Link to="/record" className="btn btn-primary btn-lg">
            + New session
          </Link>
        </div>

        <AlertBanner type="error">{error}</AlertBanner>

        {loading ? (
          <LoadingSpinner label="Loading history..." large />
        ) : reports.length === 0 ? (
          <div className="card empty-state">
            <h3>No reports yet</h3>
            <p>Record a session and save it to start building your history.</p>
            <div style={{ marginTop: 20 }}>
              <Link to="/record" className="btn btn-primary">
                Start recording
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="history-toolbar">
              <span className="history-count">
                {reports.length} saved session{reports.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="recent-list">
              {reports.map((report) => (
                <ReportRow key={report.id} report={report} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
