/**
 * Register page.
 *
 * Mirrors the Login page's split-screen layout. Creates an account and
 * logs the user in immediately (the backend returns a token on
 * registration), then redirects to the dashboard.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AlertBanner from "../components/AlertBanner";

export default function Register() {
  const { register, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const success = await register(fullName, email, password);
    setSubmitting(false);
    if (success) {
      navigate("/dashboard", { replace: true });
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
          <h1>Your personal speaking coach, on demand.</h1>
          <div className="auth-art-waveform">
            {[24, 48, 30, 60, 20, 52, 36, 64, 22, 44, 28, 56].map((h, i) => (
              <span key={i} style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <p>
            Create a free account to start recording practice sessions and
            build a history of measurable improvement in grammar,
            vocabulary, pacing, and clarity.
          </p>
        </div>

        <div className="auth-art-foot">© {new Date().getFullYear()} AI Communication Coach</div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2>Create your account</h2>
          <p className="sub">Takes less than a minute.</p>

          <AlertBanner type="error">{localError || authError}</AlertBanner>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                className="input"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{" "}
            <Link to="/login" onClick={() => setAuthError("")}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
