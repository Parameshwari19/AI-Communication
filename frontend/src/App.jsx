/**
 * App
 *
 * Top-level route definitions. The Navbar renders on every route (it
 * hides its nav links/user menu itself when no one is logged in).
 * Protected routes redirect unauthenticated users to /login.
 */
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RecordSession from "./pages/RecordSession";
import History from "./pages/History";
import ReportDetail from "./pages/ReportDetail";
import NotFound from "./pages/NotFound";

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/record"
          element={
            <ProtectedRoute>
              <RecordSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <ReportDetail />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
