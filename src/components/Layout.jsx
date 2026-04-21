import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import "../pages/app.css";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ unreadCount = 0 }) {
  return (
    <div className="chat-icon-wrap">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M8 18H7L3 21V6C3 4.9 3.9 4 5 4H19C20.1 4 21 4.9 21 6V16C21 17.1 20.1 18 19 18H8Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {unreadCount > 0 && (
        <span className="chat-notify-badge">{unreadCount}</span>
      )}
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M10 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M18 8L22 12L18 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  const links = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/upload", label: "Upload Data" },
      { to: "/library", label: "Library" },
      { to: "/chat", label: "Chat" },
    ],
    []
  );

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUid)
    );

    const unsub = onSnapshot(q, (snap) => {
      let totalUnread = 0;

      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const unreadMap = data.unreadCounts || {};
        totalUnread += unreadMap[currentUid] || 0;
      });

      setUnreadCount(totalUnread);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? "sidebar" : "sidebar closed"}>
        <div className="sidebar-brand">IDMS</div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          © 2026 Unit Teknologi Maklumat, IPK Perak
        </div>
      </aside>

      <div className="main-panel">
        <header className="main-header">
          <div className="header-left">
            <button
              className="menu-btn"
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <MenuIcon />
            </button>

            <div className="header-title">
              Integrated Document Management System (IDMS)
            </div>
          </div>

          <div className="header-right">
            {!isChatPage && (
              <button
                className="header-icon-btn"
                type="button"
                onClick={() => navigate("/chat")}
              >
                <ChatIcon unreadCount={unreadCount} />
              </button>
            )}

            <button className="logout-btn" type="button" onClick={handleLogout}>
              <LogoutIcon />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}