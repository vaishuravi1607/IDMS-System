import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./auth.css";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12C3.8 7.8 7.4 5 12 5s8.2 2.8 10 7c-1.8 4.2-5.4 7-10 7s-8.2-2.8-10-7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.2A10.8 10.8 0 0 1 12 5c4.6 0 8.2 2.8 10 7a12.6 12.6 0 0 1-4 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.1 6.1A12.7 12.7 0 0 0 2 12c1.8 4.2 5.4 7 10 7 1.2 0 2.4-.2 3.4-.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "users"),
        where("username", "==", username.trim()),
        limit(1)
      );

      const result = await getDocs(q);

      if (result.empty) {
        setError("Invalid username or password");
        return;
      }

      const userDoc = result.docs[0].data();
      await signInWithEmailAndPassword(auth, userDoc.email, password);

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg"></div>

      <div className="login-overlay">
        <div className="login-wrapper">
          <div className="login-card">
            <h1 className="idms-title">IDMS</h1>
            <p className="idms-subtitle">INTEGRATED DOCUMENT MANAGMENT SYSTEM</p>
            <p className="login-user-text">Login User</p>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="login-meta-row">
                <div className="error-box">
                  {error ? <span className="error-text">ⓘ {error}</span> : null}
                </div>

                <button
                  type="button"
                  className="text-link"
                  onClick={() => navigate("/reset-password")}
                >
                  Forgot Password
                </button>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Logging In..." : "Log In"}
              </button>

              <button
                type="button"
                className="signup-btn"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </form>

            <footer className="login-footer">
              © 2026 Unit Teknologi Maklumat, IPK Perak
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}