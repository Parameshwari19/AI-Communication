/**
 * NotFound page — shown for any unmatched route.
 */
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h2 style={{ marginTop: 12 }}>Page not found</h2>
      <p style={{ marginTop: 8, marginBottom: 24 }}>
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
