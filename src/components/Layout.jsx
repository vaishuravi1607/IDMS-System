import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../pages/app.css";

/* ==============================
   COMMON ICONS
============================== */

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 18H7L3 21V6C3 4.9 3.9 4 5 4H19C20.1 4 21 4.9 21 6V16C21 17.1 20.1 18 19 18H8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 16V11C18 7.7 15.8 5 12.5 4.4V3.5C12.5 2.7 11.8 2 11 2C10.2 2 9.5 2.7 9.5 3.5V4.4C6.2 5 4 7.7 4 11V16L2 18V19H20V18L18 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 19C9 20.1 9.9 21 11 21C12.1 21 13 20.1 13 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ==============================
   NOTIFICATION TYPE ICONS
============================== */

function NotifNewDocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NotifProcessedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 12L11 15L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotifUrgentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L22 20H2L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function NotifDeadlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7V12L15 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyBellIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 16V11C18 7.7 15.8 5 12.5 4.4V3.5C12.5 2.7 11.8 2 11 2C10.2 2 9.5 2.7 9.5 3.5V4.4C6.2 5 4 7.7 4 11V16L2 18V19H20V18L18 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 19C9 20.1 9.9 21 11 21C12.1 21 13 20.1 13 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ==============================
   NAVIGATION ICONS
============================== */

function DashboardNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function UploadNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7 9L12 4L17 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LibraryNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4H9C10.1 4 11 4.9 11 6V20C11 18.9 10.1 18 9 18H4V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 4H15C13.9 4 13 4.9 13 6V20C13 18.9 13.9 18 15 18H20V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12C21 16.4 16.97 20 12 20C10.8 20 9.66 19.79 8.62 19.4L3 21L4.6 15.38C4.21 14.34 4 13.2 4 12C4 7.6 8.03 4 13 4C17.97 4 21 7.6 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="13" cy="12" r="1" fill="currentColor" />
      <circle cx="17" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

/* ==============================
   HELPERS
============================== */

function toMillis(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

function getTimeAgo(ms) {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return new Date(ms).toLocaleDateString();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(ms).toLocaleDateString();
}

function getInitials(user) {
  if (!user) return "U";
  const source = user.displayName || user.email || "";
  if (!source) return "U";

  const cleaned = source.includes("@") ? source.split("@")[0] : source;
  const parts = cleaned
    .split(/[\s._\-]+/)
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return source.charAt(0).toUpperCase();
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getDisplayName(user) {
  if (!user) return "User";
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split("@")[0];
  return "User";
}

function getFirstName(user) {
  if (!user) return "there";
  if (user.displayName) {
    const first = user.displayName.trim().split(/\s+/)[0];
    if (first) {
      return first.charAt(0).toUpperCase() + first.slice(1);
    }
  }
  if (user.email) {
    const local = user.email.split("@")[0];
    const clean = local.replace(/[._\-]+/g, " ").trim().split(/\s+/)[0];
    if (clean) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return local;
  }
  return "there";
}

function formatCount(n) {
  if (!n) return "";
  if (n > 99) return "99+";
  if (n > 9) return "9+";
  return String(n);
}

/* ==============================
   LAYOUT COMPONENT
============================== */

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [readIds, setReadIds] = useState(new Set());

  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const bellRef = useRef(null);
  const profileRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";

  const links = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: <DashboardNavIcon /> },
      { to: "/upload", label: "Upload Data", icon: <UploadNavIcon /> },
      { to: "/library", label: "Library", icon: <LibraryNavIcon /> },
      { to: "/chat", label: "Chat", icon: <ChatNavIcon /> },
    ],
    []
  );

  /* ---- Auth listener ---- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      try {
        const key = `idms_read_notifications_${u?.uid || "anon"}`;
        const raw = localStorage.getItem(key);
        setReadIds(new Set(raw ? JSON.parse(raw) : []));
      } catch {
        setReadIds(new Set());
      }
    });
    return () => unsub();
  }, []);

  /* ---- Chat unread count subscription ---- */
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      let totalUnread = 0;
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const unreadMap = data.unreadCounts || {};
        totalUnread += unreadMap[uid] || 0;
      });
      setChatUnreadCount(totalUnread);
    });

    return () => unsub();
  }, [user?.uid]);

  /* ---- Documents subscription for notifications ---- */
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "documents"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDocuments(list);
      },
      (err) => {
        console.error("Documents subscription failed:", err);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  /* ---- Outside click to close dropdowns ---- */
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---- Escape key closes overlays ---- */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;
      setBellOpen(false);
      setProfileOpen(false);
      setShowLogoutConfirm(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  /* ---- Build notifications from documents ---- */
  const notifications = useMemo(() => {
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const list = [];

    documents.forEach((doc) => {
      const createdMs = toMillis(doc.createdAt);
      const typeLabel = doc.type
        ? doc.type.charAt(0).toUpperCase() + doc.type.slice(1)
        : "Document";
      const ref = doc.refNo || doc.id;

      if (createdMs && now - createdMs <= THIRTY_DAYS) {
        list.push({
          id: `${doc.id}_new`,
          type: "new",
          title: `New ${typeLabel} received`,
          subtitle: doc.title ? `${ref} — ${doc.title}` : ref,
          time: createdMs,
          docId: doc.id,
        });
      }

      if (doc.status === "processed") {
        const processedMs = toMillis(doc.processedAt) || createdMs;
        if (processedMs) {
          list.push({
            id: `${doc.id}_processed`,
            type: "processed",
            title: `Document ${ref} marked as Processed`,
            subtitle: doc.title || "",
            time: processedMs,
            docId: doc.id,
          });
        }
      }

      if (
        (doc.priority === "urgent" || doc.priority === "high") &&
        createdMs &&
        now - createdMs <= THIRTY_DAYS
      ) {
        list.push({
          id: `${doc.id}_urgent`,
          type: "urgent",
          title: `Urgent: ${doc.title || ref}`,
          subtitle: ref,
          time: createdMs,
          docId: doc.id,
        });
      }

      const dueMs = toMillis(doc.dueDate || doc.deadline);
      if (
        dueMs &&
        dueMs > now &&
        dueMs - now <= THREE_DAYS &&
        doc.status !== "processed"
      ) {
        list.push({
          id: `${doc.id}_deadline`,
          type: "deadline",
          title: `Deadline approaching: ${doc.title || ref}`,
          subtitle: `Due ${new Date(dueMs).toLocaleDateString()}`,
          time: dueMs,
          docId: doc.id,
        });
      }
    });

    list.sort((a, b) => b.time - a.time);
    return list.slice(0, 15);
  }, [documents]);

  const unreadBellCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  /* ---- Read state helpers ---- */
  const persistReadIds = (newSet) => {
    try {
      const key = `idms_read_notifications_${user?.uid || "anon"}`;
      localStorage.setItem(key, JSON.stringify([...newSet]));
    } catch {
      /* ignore */
    }
  };

  const markNotifRead = (id) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistReadIds(next);
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      persistReadIds(next);
      return next;
    });
  };

  const handleNotifClick = (notif) => {
    markNotifRead(notif.id);
    setBellOpen(false);
    navigate("/library");
  };

  const renderNotifIcon = (type) => {
    switch (type) {
      case "processed":
        return <NotifProcessedIcon />;
      case "urgent":
        return <NotifUrgentIcon />;
      case "deadline":
        return <NotifDeadlineIcon />;
      case "new":
      default:
        return <NotifNewDocIcon />;
    }
  };

  /* ---- Logout ---- */
  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const displayName = getDisplayName(user);
  const firstName = getFirstName(user);
  const initials = getInitials(user);

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? "sidebar" : "sidebar closed"}>
        <div className="sidebar-brand">
          <img
            src="/images/logo.png"
            alt="PDRM"
            className="sidebar-brand-logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-link-icon">{link.icon}</span>
              <span className="nav-link-text">{link.label}</span>
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
              <div className="header-dropdown-wrap">
                <button
                  className="header-icon-btn"
                  type="button"
                  onClick={() => navigate("/chat")}
                  title="Messages"
                >
                  <MessageIcon />
                  {chatUnreadCount > 0 && (
                    <span className="header-badge">
                      {formatCount(chatUnreadCount)}
                    </span>
                  )}
                </button>
              </div>
            )}

            <div className="header-dropdown-wrap" ref={bellRef}>
              <button
                className={`header-icon-btn ${bellOpen ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setBellOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                title="Notifications"
              >
                <BellIcon />
                {unreadBellCount > 0 && (
                  <span className="header-badge">
                    {formatCount(unreadBellCount)}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="header-dropdown notifications-dropdown">
                  <div className="notifications-dropdown-header">
                    <div className="notifications-dropdown-title">
                      Notifications
                      {unreadBellCount > 0 && (
                        <span className="notifications-dropdown-count">
                          {unreadBellCount}
                        </span>
                      )}
                    </div>
                    {unreadBellCount > 0 && (
                      <button
                        type="button"
                        className="notifications-mark-all-btn"
                        onClick={markAllRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notifications-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="notifications-empty">
                        <div className="notifications-empty-icon">
                          <EmptyBellIcon />
                        </div>
                        <div className="notifications-empty-title">
                          You're all caught up
                        </div>
                        <div className="notifications-empty-sub">
                          No new notifications right now.
                        </div>
                      </div>
                    ) : (
                      <ul className="notifications-list">
                        {notifications.map((n) => {
                          const isUnread = !readIds.has(n.id);
                          return (
                            <li
                              key={n.id}
                              className={`notification-item ${
                                isUnread ? "unread" : ""
                              }`}
                              onClick={() => handleNotifClick(n)}
                            >
                              <div
                                className={`notification-icon notification-icon-${n.type}`}
                              >
                                {renderNotifIcon(n.type)}
                              </div>
                              <div className="notification-body">
                                <div className="notification-title">
                                  {n.title}
                                </div>
                                {n.subtitle && (
                                  <div className="notification-subtitle">
                                    {n.subtitle}
                                  </div>
                                )}
                                <div className="notification-time">
                                  {getTimeAgo(n.time)}
                                </div>
                              </div>
                              {isUnread && (
                                <span className="notification-unread-dot" />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="notifications-dropdown-footer">
                      <button
                        type="button"
                        className="notifications-view-all-btn"
                        onClick={() => {
                          setBellOpen(false);
                          navigate("/library");
                        }}
                      >
                        View all in Library
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ---- Simplified Profile Dropdown ---- */}
            <div className="header-dropdown-wrap" ref={profileRef}>
              <button
                className="header-profile-btn"
                type="button"
                onClick={() => {
                  setProfileOpen((prev) => !prev);
                  setBellOpen(false);
                }}
                title={displayName}
              >
                {initials}
              </button>

              {profileOpen && (
                <div className="header-dropdown profile-dropdown">
                  {/* Gradient top section */}
                  <div className="profile-dropdown-top">
                    <button
                      type="button"
                      className="profile-dropdown-close-btn"
                      onClick={() => setProfileOpen(false)}
                      title="Close"
                    >
                      <CloseIcon />
                    </button>

                    <div className="profile-dropdown-top-email">
                      {user?.email || "Signed in"}
                    </div>

                    <div className="profile-dropdown-top-avatar">
                      <span>{initials}</span>
                    </div>

                    <div className="profile-dropdown-top-greeting">
                      Hi, {firstName}!
                    </div>
                  </div>

                  {/* Sign Out action */}
                  <div className="profile-dropdown-actions">
                    <button
                      type="button"
                      className="profile-dropdown-signout-btn"
                      onClick={() => {
                        setProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                    >
                      <LogoutIcon />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="logout-btn"
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogoutIcon />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      {showLogoutConfirm && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="logout-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-modal-icon-wrap">
              <LogoutIcon />
            </div>
            <h3 className="logout-modal-title">Log Out?</h3>
            <p className="logout-modal-text">
              Are you sure you want to log out of your account?
            </p>
            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-modal-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="logout-modal-confirm"
                onClick={confirmLogout}
              >
                <LogoutIcon />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}