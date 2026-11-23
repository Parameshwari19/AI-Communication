/**
 * Authentication context.
 *
 * Holds the current user + token, exposes login/register/logout actions,
 * and restores the session from localStorage on page load (validating
 * the token against the backend so a stale/expired token doesn't leave
 * the UI in a broken "logged in" state).
 */
import { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginUser, registerUser } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session
  const [authError, setAuthError] = useState("");

  // On first mount, attempt to restore a previous session.
  useEffect(() => {
    const token = localStorage.getItem("acc_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        // Token invalid/expired -- clear it silently.
        localStorage.removeItem("acc_token");
        localStorage.removeItem("acc_user");
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (token, userData) => {
    localStorage.setItem("acc_token", token);
    localStorage.setItem("acc_user", JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (fullName, email, password) => {
    setAuthError("");
    try {
      const res = await registerUser({
        full_name: fullName,
        email,
        password,
      });
      persistSession(res.data.access_token, res.data.user);
      return true;
    } catch (err) {
      setAuthError(
        err.response?.data?.detail || "Registration failed. Please try again."
      );
      return false;
    }
  };

  const login = async (email, password) => {
    setAuthError("");
    try {
      const res = await loginUser({ email, password });
      persistSession(res.data.access_token, res.data.user);
      return true;
    } catch (err) {
      setAuthError(
        err.response?.data?.detail || "Login failed. Please check your credentials."
      );
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("acc_token");
    localStorage.removeItem("acc_user");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    authError,
    setAuthError,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
