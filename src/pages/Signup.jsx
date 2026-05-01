import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
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

const validateField = (name, value, extra = {}) => {
  switch (name) {
    case "username":
      if (!value.trim()) return "Username is required";
      if (value.trim().length < 3) return "Minimum 3 characters";
      if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) return "Only letters, numbers and underscores";
      return "";
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
      return "";
    case "password":
      if (!value) return "Password is required";
      if (!isPasswordStrong(value)) return PASSWORD_REQUIREMENT_TEXT;
      return "";
    case "confirmPassword":
      if (!value) return "Please confirm your password";
      if (value !== extra.password) return "Passwords do not match";
      return "";
    default:
      return "";
  }
};

const firebaseErrorMessage = (code) => {
  switch (code) {
    case "auth/email-already-in-use": return "This email is already registered.";
    case "auth/invalid-email":        return "Please enter a valid email address.";
    case "auth/weak-password":        return PASSWORD_REQUIREMENT_TEXT;
    case "auth/network-request-failed": return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":    return "Too many attempts. Please try again later.";
    case "permission-denied":
      return "Could not verify username or save your profile (Firestore rules). If this persists after deploy, contact your administrator.";
    default:                          return "Failed to create account. Please try again.";
  }
};

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, { password }),
    }));
  };

  const revalidate = (name, value) => {
    if (!touched[name]) return;
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, { password }),
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    const allTouched = { username: true, email: true, password: true, confirmPassword: true };
    setTouched(allTouched);

    const newErrors = {
      username:        validateField("username", username),
      email:           validateField("email", email),
      password:        validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword, { password }),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    let createdUser = null;

    try {
      setLoading(true);

      const usernameKey = cleanUsername.toLowerCase();
      const usernameClaim = await getDoc(doc(db, "usernames", usernameKey));

      if (usernameClaim.exists()) {
        setErrors((prev) => ({ ...prev, username: "Username already taken" }));
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      createdUser = credential.user;
      await createdUser.getIdToken(true);

      const batch = writeBatch(db);
      batch.set(doc(db, "users", createdUser.uid), {
        username: cleanUsername,
        email: cleanEmail,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "usernames", usernameKey), {
        uid: createdUser.uid,
      });
      await batch.commit();

      setSuccess("Account created! Redirecting to login...");
      await signOut(auth);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      try {
        if (createdUser) await deleteUser(createdUser);
      } catch {
        // cleanup best-effort
      }
      setFormError(firebaseErrorMessage(err.code));
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

            <p className="signup-heading">Create an Account</p>

            <form onSubmit={handleSignup} className="login-form" noValidate>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); revalidate("username", e.target.value); }}
                  onBlur={() => handleBlur("username", username)}
                />
                {touched.username && errors.username && (
                  <span className="field-error">{errors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); revalidate("email", e.target.value); }}
                  onBlur={() => handleBlur("email", email)}
                />
                {touched.email && errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      revalidate("password", e.target.value);
                      if (touched.confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateField("confirmPassword", confirmPassword, { password: e.target.value }),
                        }));
                      }
                    }}
                    onBlur={() => handleBlur("password", password)}
                  />
                  <button type="button" className="eye-button" onClick={() => setShowPassword((v) => !v)}>
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
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); revalidate("confirmPassword", e.target.value); }}
                    onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                  />
                  <button type="button" className="eye-button" onClick={() => setShowConfirmPassword((v) => !v)}>
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>

              {formError && <p className="login-error-msg">{formError}</p>}
              {success && <p className="signup-success-msg">&#10003; {success}</p>}

              <button type="submit" className="login-btn" disabled={loading || !!success}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <button type="button" className="signup-btn" onClick={() => navigate("/login")}>
                Back to Login
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
