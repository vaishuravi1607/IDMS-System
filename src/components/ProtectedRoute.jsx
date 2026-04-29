import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    // Fallback: if auth listener doesn't fire within 8s (offline/slow), treat as unauthenticated
    const timeout = setTimeout(() => setUser(null), 8000);

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout);
      setUser(firebaseUser || null);
    });

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  if (user === undefined) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}