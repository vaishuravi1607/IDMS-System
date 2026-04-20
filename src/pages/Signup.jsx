import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
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

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (
      !cleanUsername ||
      !cleanEmail ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Please complete all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    let createdUser = null;

    try {
      setLoading(true);

      const existingQuery = query(
        collection(db, "users"),
        where("username", "==", cleanUsername),
        limit(1)
      );

      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        setError("Username already exists");
        return;
      }

      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      createdUser = credential.user;
      await createdUser.getIdToken(true);

      await setDoc(doc(db, "users", createdUser.uid), {
        username: cleanUsername,
        email: cleanEmail,
        createdAt: serverTimestamp(),
      });

      setSuccess("Account created successfully");
      await signOut(auth);

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error("Signup error:", err);

      try {
        if (createdUser) {
          await deleteUser(createdUser);
        }
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }

      setError(err.message || "Failed to create account");
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
            <p className="login-user-text">Sign Up User</p>

            <form onSubmit={handleSignup} className="login-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              <div className="form-group">
                <label>Re-Password</label>
                <div className="password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="login-meta-row">
                <div className="error-box">
                  {error ? <span className="error-text">ⓘ {error}</span> : null}
                  {success ? <span className="success-text">✓ {success}</span> : null}
                </div>

                <button
                  type="button"
                  className="text-link"
                  onClick={() => navigate("/login")}
                >
                  Go Back To Login
                </button>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
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