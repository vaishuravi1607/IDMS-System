import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
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
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c4.6 0 8.2 2.8 10 7a12.6 12.6 0 0 1-4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.1 6.1A12.7 12.7 0 0 0 2 12c1.8 4.2 5.4 7 10 7 1.2 0 2.4-.2 3.4-.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const validateField = (name, value) => {
  if (name === "username") {
    if (!value.trim()) return "Username or email is required";
    if (!isEmail(value) && value.trim().length < 3) return "Minimum 3 characters";
  }
  if (name === "password") {
    if (!value) return "Password is required";
    if (value.length < 6) return "Minimum 6 characters";
  }
  return "";
};

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loginError, setLoginError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setGoogleError("");

    const usernameErr = validateField("username", username);
    const passwordErr = validateField("password", password);
    setErrors({ username: usernameErr, password: passwordErr });
    setTouched({ username: true, password: true });

    if (usernameErr || passwordErr) return;

    try {
      setLoading(true);

      let emailToUse = username.trim();

      if (!isEmail(emailToUse)) {
        const q = query(
          collection(db, "users"),
          where("username", "==", emailToUse),
          limit(1)
        );
        const result = await getDocs(q);
        if (result.empty) {
          setLoginError("Invalid username or password.");
          return;
        }
        emailToUse = result.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
      navigate("/dashboard");
    } catch {
      setLoginError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError("");
    setGoogleError("");
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          username: user.displayName || user.email.split("@")[0],
          email: user.email,
          createdAt: serverTimestamp(),
        });
      }

      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return;
      }
      if (err.code === "auth/popup-blocked") {
        setGoogleError("Pop-up was blocked by the browser. Please allow pop-ups and try again.");
      } else if (err.code === "auth/network-request-failed") {
        setGoogleError("Network error. Check your connection and try again.");
      } else {
        setGoogleError("Google sign-in failed. Please try again.");
      }
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

            <form onSubmit={handleLogin} className="login-form" noValidate>

              <div className="form-group">
                <label>Username or Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (touched.username) {
                      setErrors((prev) => ({ ...prev, username: validateField("username", e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur("username", username)}
                />
                {touched.username && errors.username && (
                  <span className="field-error">{errors.username}</span>
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
                      if (touched.password) {
                        setErrors((prev) => ({ ...prev, password: validateField("password", e.target.value) }));
                      }
                    }}
                    onBlur={() => handleBlur("password", password)}
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

              <div className="login-meta-row">
                <span></span>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </button>
              </div>

              {loginError && (
                <p className="login-error-msg">&#9432; {loginError}</p>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Logging In..." : "Log In"}
              </button>

              <div className="login-divider-or">
                <span>or</span>
              </div>

              <button
                type="button"
                className="google-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <GoogleIcon />
                Sign in with Google
              </button>

              {googleError && (
                <p className="login-error-msg google-error-msg">&#9432; {googleError}</p>
              )}

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
