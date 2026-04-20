import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import "./auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Reset link sent to your email");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Email not found or invalid");
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
            <p className="login-user-text">Forgot Password</p>

            <form onSubmit={handleReset} className="login-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="login-meta-row">
                <div className="error-box">
                  {error ? <span className="error-text">ⓘ {error}</span> : null}
                  {message ? <span className="success-text">✓ {message}</span> : null}
                </div>

                <button
                  type="button"
                  className="text-link"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </button>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Email"}
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