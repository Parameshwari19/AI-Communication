/**
 * Navbar
 *
 * Top navigation bar shown on every authenticated page. Includes the
 * brand mark (mini animated waveform), primary nav links, and a
 * logout control.
 */
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" style={{ textDecoration: "none" }}>
          <span className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          AI Communication Coach
        </NavLink>

        {isAuthenticated && (
          <>
            <nav className="nav-links">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/record"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Record
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                History
              </NavLink>
            </nav>

            <div className="nav-right">
              <span className="nav-user">
                Hi, <strong>{user?.full_name?.split(" ")[0]}</strong>
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
