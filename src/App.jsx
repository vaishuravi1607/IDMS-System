import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import Library from "./pages/Library";
import Chat from "./pages/Chat";

// Redirects already-logged-in users away from auth pages
function PublicRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const timeout = setTimeout(() => setUser(null), 8000);
    const unsub = onAuthStateChanged(auth, (u) => {
      clearTimeout(timeout);
      setUser(u || null);
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  if (user === undefined) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12, fontFamily: "sans-serif", color: "#374151" }}>
      <h1 style={{ fontSize: 64, margin: 0, color: "#2f80ed" }}>404</h1>
      <p style={{ fontSize: 18, margin: 0 }}>Page not found</p>
      <a href="/dashboard" style={{ marginTop: 8, color: "#2f80ed", textDecoration: "none", fontSize: 14 }}>Go to Dashboard</a>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
