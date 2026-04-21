import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import "./auth.css";

const validateEmail = (value) => {
  if (!value.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
  return "";
};

const firebaseError = (code) => {
  switch (code) {
    case "auth/invalid-email": return "Invalid email address.";
    case "auth/network-request-failed": return "Network error. Check your connection and try again.";
    default: return "Something went wrong. Please try again.";
  }
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [touched, setTouched] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    setFieldError(err);
    setTouched(true);
    if (err) return;

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch (err) {
      setFieldError(firebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay">
        <div className="login-wrapper">
          <div className="login-card">
            <h1 className="idms-title">IDMS</h1>
            <p className="idms-subtitle">INTEGRATED DOCUMENT MANAGEMENT SYSTEM</p>
            <p className="idms-unit">POLIS DIRAJA MALAYSIA &middot; IPK PERAK</p>
            <div className="login-divider-gold"></div>

            <p className="signup-heading">Forgot Password</p>

            {success ? (
              <div className="auth-status-block">
                <p className="auth-status-success">
                  ✓ Reset link sent! Check your inbox and click the link to set a new password.
                </p>
                <button
                  type="button"
                  className="login-btn"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form" noValidate>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (touched) setFieldError(validateEmail(e.target.value));
                    }}
                    onBlur={handleBlur}
                  />
                  {touched && fieldError && (
                    <span className="field-error">{fieldError}</span>
                  )}
                </div>

                <div className="login-meta-row">
                  <div></div>
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
            )}

            <footer className="login-footer">
              © 2026 Unit Teknologi Maklumat, IPK Perak
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
