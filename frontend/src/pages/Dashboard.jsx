/**
 * Dashboard page.
 *
 * The user's home base: aggregate stats (average score, WPM, fillers,
 * grammar errors), a score trend line chart built from report history,
 * and a list of the most recent sessions.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { getDashboardStats, listReports } from "../api/endpoints";
import StatCard from "../components/StatCard";
import ReportRow from "../components/ReportRow";
import LoadingSpinner from "../components/LoadingSpinner";
import AlertBanner from "../components/AlertBanner";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          getDashboardStats(),
          listReports(0, 5),
        ]);
        if (isMounted) {
          setStats(statsRes.data);
          setRecentReports(reportsRes.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail || "Could not load your dashboard data."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <LoadingSpinner label="Loading your dashboard..." large />
        </div>
      </div>
    );
  }

  const hasReports = stats && stats.total_reports > 0;

  const chartData = {
    labels: stats?.dates.map((d) => d.split(" ")[0]) || [],
    datasets: [
      {
        label: "Overall score",
        data: stats?.score_trend || [],
        borderColor: "#2dd4bf",
        backgroundColor: "rgba(45, 212, 191, 0.12)",
        pointBackgroundColor: "#2dd4bf",
        pointBorderColor: "#10141b",
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a2129",
        borderColor: "#2a3340",
        borderWidth: 1,
        titleColor: "#f2f4f8",
        bodyColor: "#93a0b3",
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#5d6878", font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "#1f2630" },
        ticks: { color: "#5d6878", font: { size: 11 }, stepSize: 25 },
      },
    },
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <span className="page-eyebrow">Overview</span>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Track how your communication score, pace, and clarity evolve
              with every practice session.
            </p>
          </div>
          <Link to="/record" className="btn btn-primary btn-lg">
            + New session
          </Link>
        </div>

        <AlertBanner type="error">{error}</AlertBanner>

        {!hasReports ? (
          <div className="card empty-state">
            <h3>No sessions yet</h3>
            <p>Record your first practice session to see your stats here.</p>
            <div style={{ marginTop: 20 }}>
              <Link to="/record" className="btn btn-primary">
                Start your first recording
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-stats" style={{ marginBottom: 24 }}>
              <StatCard
                icon="★"
                value={stats.average_score}
                label="Average score"
                accent="teal"
              />
              <StatCard
                icon="⚡"
                value={stats.best_score}
                label="Best score"
                accent="green"
              />
              <StatCard
                icon="⏱"
                value={`${stats.average_wpm}`}
                label="Average words / min"
                accent="coral"
              />
              <StatCard
                icon="≈"
                value={stats.average_fillers}
                label="Average filler words"
                accent="amber"
              />
            </div>

            <div className="grid grid-2">
              <div className="card">
                <div className="chart-card-title">
                  <h3 className="card-title">Score trend</h3>
                  <span className="badge badge-teal">
                    {stats.total_reports} session{stats.total_reports !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="chart-wrap">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              <div className="card">
                <h3 className="card-title" style={{ marginBottom: 18 }}>
                  Recent sessions
                </h3>
                <div className="recent-list">
                  {recentReports.map((report) => (
                    <ReportRow key={report.id} report={report} />
                  ))}
                </div>
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <Link to="/history" className="btn btn-ghost btn-block">
                    View full history
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
