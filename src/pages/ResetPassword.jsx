import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebase";
import {
  PASSWORD_REQUIREMENT_TEXT,
  isPasswordStrong,
} from "../passwordPolicy";
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
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c4.6 0 8.2 2.8 10 7a12.6 12.6 0 0 1-4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.1 6.1A12.7 12.7 0 0 0 2 12c1.8 4.2 5.4 7 10 7 1.2 0 2.4-.2 3.4-.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const validateField = (name, value, password = "") => {
  if (name === "password") {
    if (!value) return "Password is required";
    if (!isPasswordStrong(value)) return PASSWORD_REQUIREMENT_TEXT;
  }
  if (name === "confirm") {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
  }
  return "";
};

const firebaseError = (code) => {
  switch (code) {
    case "auth/expired-action-code": return "This reset link has expired. Please request a new one.";
    case "auth/invalid-action-code": return "This reset link is invalid or has already been used.";
    case "auth/weak-password": return PASSWORD_REQUIREMENT_TEXT;
    case "auth/user-not-found": return "No account found for this link.";
    case "auth/user-disabled": return "This account has been disabled.";
    case "auth/network-request-failed": return "Network error. Check your connection and try again.";
    default: return "Something went wrong. Please try again.";
  }
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  const [status, setStatus] = useState("verifying");
  const [accountEmail, setAccountEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setStatus("invalid");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setAccountEmail(email);
        setStatus("valid");
      })
      .catch(() => {
        setStatus("invalid");
      });
  }, [oobCode, mode]);

  const handleBlur = (name) => {
    const value = name === "password" ? password : confirm;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, password) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const passwordErr = validateField("password", password);
    const confirmErr = validateField("confirm", confirm, password);
    setErrors({ password: passwordErr, confirm: confirmErr });
    setTouched({ password: true, confirm: true });
    if (passwordErr || confirmErr) return;

    try {
      setLoading(true);
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
    } catch (err) {
      setSubmitError(firebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (status === "verifying") {
      return <p className="auth-status-text">Verifying your reset link...</p>;
    }

    if (status === "invalid") {
      return (
        <div className="auth-status-block">
          <p className="auth-status-error">
            ⓘ This reset link is invalid or has expired.
          </p>
          <button
            type="button"
            className="login-btn"
            onClick={() => navigate("/forgot-password")}
          >
            Request a New Link
          </button>
        </div>
      );
    }

    if (status === "success") {
      return (
        <div className="auth-status-block">
          <p className="auth-status-success">
            ✓ Password updated successfully!
          </p>
          <button
            type="button"
            className="login-btn"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        {accountEmail && (
          <p className="reset-account-email">{accountEmail}</p>
        )}

        <div className="form-group">
          <label>New Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) {
                  setErrors((prev) => ({
                    ...prev,
                    password: validateField("password", e.target.value),
                    ...(touched.confirm
                      ? { confirm: validateField("confirm", confirm, e.target.value) }
                      : {}),
                  }));
                }
              }}
              onBlur={() => handleBlur("password")}
            />
            <button
              type="button"
              className="eye-button"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
          {touched.password && errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <div className="password-field">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (touched.confirm) {
                  setErrors((prev) => ({
                    ...prev,
                    confirm: validateField("confirm", e.target.value, password),
                  }));
                }
              }}
              onBlur={() => handleBlur("confirm")}
            />
            <button
              type="button"
              className="eye-button"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
          {touched.confirm && errors.confirm && (
            <span className="field-error">{errors.confirm}</span>
          )}
        </div>

        {submitError && (
          <p className="login-error-msg">&#9432; {submitError}</p>
        )}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Updating..." : "Set New Password"}
        </button>
      </form>
    );
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

            <p className="signup-heading">Reset Password</p>

            {renderContent()}

            <footer className="login-footer">
              © 2026 Unit Teknologi Maklumat, IPK Perak
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
