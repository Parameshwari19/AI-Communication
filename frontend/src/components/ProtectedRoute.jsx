/**
 * ProtectedRoute
 *
 * Wraps a route element and redirects to /login if there is no
 * authenticated user. Shows a lightweight loading state while the
 * initial session restoration check is in flight, so we never flash
 * the login page for an instant before redirecting back in.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <LoadingSpinner label="Checking your session..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
