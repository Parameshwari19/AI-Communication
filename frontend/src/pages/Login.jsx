/**
 * Login page.
 *
 * Split-screen layout: brand/art panel on the left, login form on the
 * right. Redirects to /dashboard on success (or wherever the user was
 * trying to go before being bounced to /login).
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AlertBanner from "../components/AlertBanner";

export default function Login() {
  const { login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-art">
        <div className="auth-art-top">
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          AI Communication Coach
        </div>

        <div className="auth-art-mid">
          <h1>Speak with confidence, backed by data.</h1>
          <div className="auth-art-waveform">
            {[18, 40, 28, 56, 34, 64, 24, 48, 30, 52, 20, 60].map((h, i) => (
              <span key={i} style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <p>
            Record a quick practice session and get an instant breakdown of
            your grammar, vocabulary, pace, and filler words — then watch
            your communication score improve over time.
          </p>
        </div>

        <div className="auth-art-foot">© {new Date().getFullYear()} AI Communication Coach</div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2>Welcome back</h2>
          <p className="sub">Log in to continue tracking your progress.</p>

          <AlertBanner type="error">{authError}</AlertBanner>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?{" "}
            <Link
              to="/register"
              onClick={() => setAuthError("")}
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
