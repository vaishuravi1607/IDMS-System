import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import Layout from "../components/Layout";
import { auth, db } from "../firebase";

const LIBRARY_DOCS_LIMIT = 100;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function createChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function toMs(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.toDate === "function") return v.toDate().getTime();
  return 0;
}

function formatTime(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLastSeen(ms) {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 60000) return "just now";

  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  return new Date(ms).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
  });
}

function getInitial(name) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

/* ─── Emoji List ───────────────────────────────────────────────────────────── */

const EMOJI_LIST = [
  "😀","😂","😍","🥰","😊","😎","🤩","😜","🤔","😢","😡","🥳",
  "👍","👎","👏","🙏","🤝","✌️","💪","🫶","❤️","🧡","💛","💚",
  "💙","💜","🔥","⭐","✅","❌","⚠️","📌","📎","📄","📁","📊",
  "💼","🖥️","📱","☕","🎉","🏆","🚀","💡","🔒","😴","🤣","😇",
];

/* ─── Icons ───────────────────────────────────────────────────────────────── */

const Icon = {
  Search: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),

  Attach: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),

  Emoji: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),

  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),

  More: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </svg>
  ),

  Close: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),

  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),

  Check: () => (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
      <polyline points="1,5 4,8 9,2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="7,5 10,8 15,2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  User: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  Doc: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),

  Edit: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),

  Block: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),

  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

/* ─── Emoji Picker ─────────────────────────────────────────────────────────── */

function EmojiPicker({ onSelect }) {
  return (
    <div className="wa-emoji-panel">
      {EMOJI_LIST.map((e) => (
        <button key={e} className="wa-emoji-item" onClick={() => onSelect(e)} type="button">
          {e}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function Chat() {
  const currentUid = auth.currentUser?.uid;

  const [currentUsername, setCurrentUsername] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMeta, setChatMeta] = useState({});
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [showNewConv, setShowNewConv] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [newConvSearch, setNewConvSearch] = useState("");
  const [showLibPicker, setShowLibPicker] = useState(false);
  const [libraryDocs, setLibraryDocs] = useState([]);
  const [libSearch, setLibSearch] = useState("");

  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [sendError, setSendError] = useState("");
  const [newConvError, setNewConvError] = useState("");
  const [tickNowMs, setTickNowMs] = useState(() => Date.now());

  const typingFlushRef = useRef(null);
  const typingLastSentRef = useRef(0);

  const resolveSenderUsername = async () => {
    let name = (currentUsername || "").trim();
    if (!name && currentUid) {
      const meSnap = await getDoc(doc(db, "users", currentUid));
      if (meSnap.exists()) {
        name = String(meSnap.data().username || "").trim();
        if (name) setCurrentUsername(name);
      }
    }
    if (!name) {
      name =
        auth.currentUser?.displayName?.trim() ||
        auth.currentUser?.email?.split("@")[0]?.trim() ||
        "";
    }
    return name;
  };

  const messagesEndRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => {
    if (typingFlushRef.current) clearTimeout(typingFlushRef.current);
  }, []);

  useEffect(() => {
    if (!currentUid) return;
    getDoc(doc(db, "users", currentUid)).then((snap) => {
      if (snap.exists()) setCurrentUsername(snap.data().username || "");
    });
  }, [currentUid]);

  // Real-time user list — picks up presence changes (online/lastSeen) instantly
  useEffect(() => {
    if (!currentUid) return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setAllUsers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.id !== currentUid)
      );
    });
    return () => unsub();
  }, [currentUid]);

  // Mark self online while Chat is open, offline when leaving
  useEffect(() => {
    if (!currentUid) return;
    const userRef = doc(db, "users", currentUid);

    updateDoc(userRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {});

    const markOffline = () =>
      updateDoc(userRef, { online: false, lastSeen: Timestamp.now() }).catch(() => {});

    window.addEventListener("beforeunload", markOffline);
    return () => {
      markOffline();
      window.removeEventListener("beforeunload", markOffline);
    };
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => toMs(b.lastMessageAt) - toMs(a.lastMessageAt));
      setConversations(list);
    });
    return () => unsub();
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid || !selectedChatId) return;

    updateDoc(doc(db, "chats", selectedChatId), {
      [`unreadCounts.${currentUid}`]: 0,
    }).catch(() => {});

    const unsubMeta = onSnapshot(doc(db, "chats", selectedChatId), (snap) => {
      if (snap.exists()) setChatMeta(snap.data());
    });

    const msgQ = query(
      collection(db, "chats", selectedChatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(msgQ, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub();
      unsubMeta();
    };
  }, [currentUid, selectedChatId]);

  useEffect(() => {
    if (!showLibPicker) return;
    const q = query(
      collection(db, "documents"),
      orderBy("createdAt", "desc"),
      limit(LIBRARY_DOCS_LIMIT)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLibraryDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [showLibPicker]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(e.target) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(e.target)
      ) {
        setShowEmoji(false);
      }

      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isBlocked = !!chatMeta?.blocked?.[currentUid];
  const clearedAt = chatMeta?.clearedBy?.[currentUid];

  useEffect(() => {
    if (!selectedChatId || !selectedUser?.id || isBlocked) return undefined;
    const id = setInterval(() => setTickNowMs(Date.now()), 450);
    return () => clearInterval(id);
  }, [selectedChatId, selectedUser?.id, isBlocked]);

  const selectedUserId = selectedUser?.id ?? null;
  const selectedUserData = useMemo(
    () => allUsers.find((u) => u.id === selectedUserId),
    [allUsers, selectedUserId]
  );
  const isSelectedOnline = selectedUserData?.online || false;
  const selectedLastSeen = selectedUserData?.lastSeen || null;

  const flushTypingPresence = async () => {
    if (!selectedChatId || !currentUid || isBlocked) return;
    const now = Date.now();
    if (now - typingLastSentRef.current < 1100) return;
    typingLastSentRef.current = now;
    await updateDoc(doc(db, "chats", selectedChatId), {
      [`typing.${currentUid}`]: now,
    }).catch(() => {});
  };

  const scheduleTypingUpdate = () => {
    if (!selectedChatId || !currentUid || isBlocked) return;
    if (typingFlushRef.current) clearTimeout(typingFlushRef.current);
    typingFlushRef.current = setTimeout(() => {
      typingFlushRef.current = null;
      flushTypingPresence();
    }, 450);
  };

  const otherTypingTimestamp = selectedUser?.id
    ? chatMeta?.typing?.[selectedUser.id]
    : null;
  const otherTypingMs =
    otherTypingTimestamp != null ? Number(otherTypingTimestamp) : 0;
  const showOtherTyping =
    !!selectedUser?.id &&
    !isBlocked &&
    !!otherTypingMs &&
    tickNowMs - otherTypingMs < 5000;

  const confirmDeleteMsg = (msg) => {
    if (!selectedChatId || !msg?.id || msg.senderId !== currentUid) return;
    setConfirmDialog({
      title: "Delete this message?",
      message: "It will appear as deleted for everyone in this chat.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "chats", selectedChatId, "messages", msg.id), {
            deleted: true,
            deletedAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("Delete message failed:", e);
        }
        setConfirmDialog(null);
      },
    });
  };

  const selectConversation = (conv) => {
    const otherIdx = conv.participants?.findIndex((p) => p !== currentUid) ?? -1;
    const otherId = otherIdx >= 0 ? conv.participants[otherIdx] : null;
    const otherName =
      otherIdx >= 0
        ? conv.participantUsernames?.[otherIdx] || otherId || "Unknown"
        : "Unknown";

    setMessages([]);
    setChatMeta({});
    setSelectedChatId(conv.id);
    setSelectedUser({ id: otherId, username: otherName });
    setShowChatSearch(false);
    setChatSearch("");
    setShowMenu(false);
    setEditMode(false);
    setEditingMsgId(null);
  };

  const getOrCreateChat = async (otherUser) => {
    const chatId = createChatId(currentUid, otherUser.id);
    const chatRef = doc(db, "chats", chatId);
    const existing = await getDoc(chatRef);

    if (!existing.exists()) {
      const senderName = await resolveSenderUsername();
      const otherName =
        String(otherUser.username || "").trim() ||
        otherUser.email?.split("@")[0]?.trim() ||
        "";

      await setDoc(chatRef, {
        participants: [currentUid, otherUser.id],
        participantUsernames: [senderName || "Unknown", otherName || "Unknown"],
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCounts: { [currentUid]: 0, [otherUser.id]: 0 },
      });
    }

    return chatId;
  };

  const startNewConversation = async (user) => {
    setNewConvError("");
    try {
      const chatId = await getOrCreateChat(user);
      setSelectedChatId(chatId);
      setSelectedUser(user);
      setShowNewConv(false);
      setNewConvSearch("");
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setNewConvError(
        "Couldn't start this conversation. Check your connection and try again."
      );
    }
  };

  const ensureChat = () => getOrCreateChat(selectedUser);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !selectedUser || isBlocked) return;

    const msgText = text.trim();
    setText("");
    setSendError("");

    try {
      const chatId = selectedChatId || (await ensureChat());
      const senderUsername = await resolveSenderUsername();

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUid,
        senderUsername,
        text: msgText,
        type: "text",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: msgText,
        lastMessageAt: serverTimestamp(),
        [`unreadCounts.${selectedUser.id}`]: increment(1),
        [`typing.${currentUid}`]: deleteField(),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setText(msgText);
      setSendError("Failed to send. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendLibraryDoc = async (libDoc) => {
    if (!selectedUser) return;

    setSendError("");
    const refLabel = libDoc.refNo || libDoc.id;
    const docDept = Array.isArray(libDoc.departments)
      ? libDoc.departments.join(", ")
      : (libDoc.department || "");

    try {
      const chatId = selectedChatId || (await ensureChat());
      const senderUsername = await resolveSenderUsername();

      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUid,
        senderUsername,
        type: "library_doc",
        text: "",
        docId: libDoc.id,
        docRef: refLabel,
        docTitle: libDoc.title || "",
        docType: libDoc.type || "",
        docDepartment: docDept,
        fileUrl: libDoc.fileUrl || libDoc.url || "",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: `📄 ${refLabel}`,
        lastMessageAt: serverTimestamp(),
        [`unreadCounts.${selectedUser.id}`]: increment(1),
        [`typing.${currentUid}`]: deleteField(),
      });

      setShowLibPicker(false);
      setLibSearch("");
    } catch (err) {
      console.error("Failed to send document:", err);
      setSendError("Failed to attach document. Please try again.");
    }
  };

  const startEditMsg = (msg) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text || "");
  };

  const saveEditMsg = async () => {
    if (!editingMsgId || !editingText.trim()) return;
    const newText = editingText.trim();

    try {
      await updateDoc(
        doc(db, "chats", selectedChatId, "messages", editingMsgId),
        {
          text: newText,
          edited: true,
          editedAt: serverTimestamp(),
        }
      );

      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.id === editingMsgId) {
        await updateDoc(doc(db, "chats", selectedChatId), {
          lastMessage: newText,
        });
      }
    } catch (err) {
      console.error("Edit failed", err);
    }

    setEditingMsgId(null);
    setEditingText("");
  };

  const cancelEditMsg = () => {
    setEditingMsgId(null);
    setEditingText("");
  };

  const handleToggleBlock = () => {
    setShowMenu(false);
    setConfirmDialog({
      title: isBlocked ? "Unblock user?" : "Block user?",
      message: isBlocked
        ? `${selectedUser.username} will be able to message you again.`
        : `${selectedUser.username} won't be able to send you messages. You can unblock later.`,
      confirmLabel: isBlocked ? "Unblock" : "Block",
      danger: !isBlocked,
      onConfirm: async () => {
        await updateDoc(doc(db, "chats", selectedChatId), {
          [`blocked.${currentUid}`]: !isBlocked,
        });
        setConfirmDialog(null);
      },
    });
  };

  const handleClearChat = () => {
    setShowMenu(false);
    setConfirmDialog({
      title: "Clear this chat?",
      message:
        "All messages in this conversation will be hidden from your view. The other person will still see them.",
      confirmLabel: "Clear chat",
      danger: true,
      onConfirm: async () => {
        await updateDoc(doc(db, "chats", selectedChatId), {
          [`clearedBy.${currentUid}`]: serverTimestamp(),
        });
        setConfirmDialog(null);
      },
    });
  };

  const handleToggleEditMode = () => {
    setShowMenu(false);
    setEditMode((p) => !p);
    setEditingMsgId(null);
  };

  const filteredConversations = useMemo(() => {
    let list = conversations;

    if (activeTab === "unread") {
      list = list.filter((c) => (c.unreadCounts?.[currentUid] || 0) > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const otherIdx = c.participants?.findIndex((p) => p !== currentUid) ?? -1;
        const otherName =
          otherIdx >= 0 ? c.participantUsernames?.[otherIdx] || "" : "";

        return (
          otherName.toLowerCase().includes(q) ||
          (c.lastMessage || "").toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [conversations, activeTab, search, currentUid]);

  const filteredAllUsers = useMemo(() => {
    if (!newConvSearch.trim()) return allUsers;
    const q = newConvSearch.toLowerCase();
    return allUsers.filter((u) =>
      (u.username || "").toLowerCase().includes(q)
    );
  }, [allUsers, newConvSearch]);

  const filteredLibraryDocs = useMemo(() => {
    if (!libSearch.trim()) return libraryDocs;
    const q = libSearch.toLowerCase();

    return libraryDocs.filter((d) => {
      const depts = Array.isArray(d.departments)
        ? d.departments.join(" ")
        : (d.department || "");
      return (
        (d.title || "").toLowerCase().includes(q) ||
        (d.refNo || "").toLowerCase().includes(q) ||
        depts.toLowerCase().includes(q)
      );
    });
  }, [libraryDocs, libSearch]);

  const groupedMessages = useMemo(() => {
    let list = messages;
    const clearedMs = toMs(clearedAt);

    if (clearedMs) {
      list = list.filter((m) => toMs(m.createdAt) > clearedMs);
    }

    if (showChatSearch && chatSearch.trim()) {
      const q = chatSearch.toLowerCase();
      list = list.filter(
        (m) =>
          (m.text || "").toLowerCase().includes(q) ||
          (m.docTitle || "").toLowerCase().includes(q) ||
          (m.docRef || "").toLowerCase().includes(q)
      );
    }

    const groups = [];
    let currentDate = null;

    list.forEach((msg) => {
      const ms = toMs(msg.createdAt);
      const dateStr = ms ? new Date(ms).toDateString() : null;

      if (dateStr && dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({
          type: "date",
          label: formatDate(ms),
          key: `date_${dateStr}`,
        });
      }

      groups.push({ type: "msg", msg });
    });

    return groups;
  }, [messages, clearedAt, showChatSearch, chatSearch]);

  const renderMessage = (msg) => {
    const isMine = msg.senderId === currentUid;
    const ms = toMs(msg.createdAt);
    const isEditingThis = editingMsgId === msg.id;
    const canEdit = isMine && msg.type === "text" && editMode && !msg.deleted;

    if (msg.deleted) {
      return (
        <div key={msg.id} className={`wa-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
          <div
            className={`wa-bubble ${isMine ? "wa-bubble-mine" : "wa-bubble-theirs"} wa-bubble-file`}
          >
            <span className="wa-bubble-deleted">This message was deleted</span>
            <div className="wa-bubble-meta">
              <span className="wa-bubble-time">{formatTime(ms)}</span>
            </div>
          </div>
        </div>
      );
    }

    if (msg.type === "library_doc") {
      return (
        <div key={msg.id} className={`wa-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
          <div className={`wa-bubble ${isMine ? "wa-bubble-mine" : "wa-bubble-theirs"} wa-bubble-file`}>
            {isMine && (
              <button
                type="button"
                className="wa-bubble-delete-btn"
                title="Delete"
                onClick={() => confirmDeleteMsg(msg)}
              >
                Delete
              </button>
            )}
            <div className="wa-file-content">
              <div className={`wa-file-icon-wrap ${isMine ? "mine" : ""}`}>
                <Icon.Doc />
              </div>

              <div className="wa-file-info">
                <div className="wa-file-name">{msg.docRef}</div>
                <div className="wa-lib-title">{msg.docTitle || "Library Document"}</div>
                <div className="wa-file-size">
                  {(msg.docType || "DOC").toUpperCase()}
                  {msg.docDepartment ? ` • ${msg.docDepartment}` : ""}
                </div>
              </div>
            </div>

            <div className="wa-bubble-meta">
              <a
                className={`wa-file-open-link ${isMine ? "mine" : ""}`}
                href={msg.fileUrl || `/library?doc=${msg.docId}`}
                target={msg.fileUrl ? "_blank" : "_self"}
                rel="noreferrer"
              >
                Open
              </a>
              <span className="wa-bubble-time">{formatTime(ms)}</span>
              {isMine && (
                <span className="wa-tick">
                  <Icon.Check />
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
        <div key={msg.id} className={`wa-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
        <div className={`wa-bubble ${isMine ? "wa-bubble-mine" : "wa-bubble-theirs"} ${canEdit ? "editable" : ""}`}>
          {isMine && (
            <button
              type="button"
              className="wa-bubble-delete-btn"
              title="Delete"
              onClick={() => confirmDeleteMsg(msg)}
            >
              Delete
            </button>
          )}
          {isEditingThis ? (
            <div className="wa-msg-edit-wrap">
              <textarea
                className="wa-msg-edit-input"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveEditMsg();
                  }
                  if (e.key === "Escape") cancelEditMsg();
                }}
                autoFocus
                rows={2}
              />
              <div className="wa-msg-edit-actions">
                <button className="wa-msg-edit-cancel" onClick={cancelEditMsg} type="button">
                  Cancel
                </button>
                <button className="wa-msg-edit-save" onClick={saveEditMsg} type="button">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="wa-bubble-text">{msg.text}</span>

              {canEdit && (
                <button
                  className="wa-bubble-edit-btn"
                  onClick={() => startEditMsg(msg)}
                  type="button"
                  title="Edit"
                >
                  <Icon.Edit size={12} />
                </button>
              )}

              <div className="wa-bubble-meta">
                {msg.edited && <span className="wa-edited-tag">edited</span>}
                <span className="wa-bubble-time">{formatTime(ms)}</span>
                {isMine && (
                  <span className="wa-tick">
                    <Icon.Check />
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderConvItem = (conv) => {
    const otherIdx = conv.participants?.findIndex((p) => p !== currentUid) ?? -1;
    const otherId = otherIdx >= 0 ? conv.participants[otherIdx] : null;
    const otherName =
      otherIdx >= 0
        ? conv.participantUsernames?.[otherIdx] || conv.participants?.[otherIdx] || "Unknown"
        : "Unknown";

    const otherUserData = allUsers.find((u) => u.id === otherId);
    const isOnline = otherUserData?.online || false;

    const unread = conv.unreadCounts?.[currentUid] || 0;
    const lastMs = toMs(conv.lastMessageAt);
    const isSelected = selectedChatId === conv.id;

    return (
      <button
        key={conv.id}
        className={`wa-conv-item ${isSelected ? "active" : ""}`}
        onClick={() => selectConversation(conv)}
        type="button"
      >
        <div className="wa-conv-avatar">
          {getInitial(otherName)}
          {isOnline && <span className="wa-online-dot" />}
        </div>

        <div className="wa-conv-body">
          <div className="wa-conv-top">
            <span className="wa-conv-name">{otherName}</span>
            <span className={`wa-conv-time ${unread > 0 ? "unread" : ""}`}>
              {formatLastSeen(lastMs)}
            </span>
          </div>

          <div className="wa-conv-bottom">
            <span className="wa-conv-last">
              {conv.lastMessage || "Tap to start chatting"}
            </span>
            {unread > 0 && (
              <span className="wa-unread-badge">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <Layout title="Chat">
      <div className="wa-shell">
        {/* LEFT SIDEBAR */}
        <div className="wa-sidebar">
          <div className="wa-sidebar-header">
            <h2 className="wa-sidebar-title">Messages</h2>
          </div>

          <div className="wa-search-wrap">
            <span className="wa-search-icon">
              <Icon.Search size={16} />
            </span>
            <input
              className="wa-search-input"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="wa-tabs">
            <button
              className={`wa-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
              type="button"
            >
              All
            </button>
            <button
              className={`wa-tab ${activeTab === "unread" ? "active" : ""}`}
              onClick={() => setActiveTab("unread")}
              type="button"
            >
              Unread
            </button>
          </div>

          <div className="wa-conv-list">
            {filteredConversations.length === 0 ? (
              <div className="wa-empty-convs">
                <div className="wa-empty-convs-icon">
                  <Icon.User />
                </div>
                <p>No conversations yet</p>
                <p>Start a new conversation below</p>
              </div>
            ) : (
              filteredConversations.map(renderConvItem)
            )}
          </div>

          <div className="wa-sidebar-footer">
            <button
              className="wa-new-conv-btn"
              onClick={() => {
                setNewConvError("");
                setShowNewConv(true);
              }}
              type="button"
            >
              <Icon.Plus />
              New Conversation
            </button>
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        {selectedUser ? (
          <div className="wa-chat-area">
            <div className="wa-chat-header">
              <div className="wa-chat-user-info">
                <div className="wa-chat-avatar-lg">{getInitial(selectedUser.username)}</div>
                <div>
                  <div className="wa-chat-name">{selectedUser.username}</div>
                  <div className="wa-chat-status">
                    {isBlocked ? (
                      <>
                        <span className="wa-status-dot blocked" />
                        Blocked
                      </>
                    ) : isSelectedOnline ? (
                      <>
                        <span className="wa-status-dot online" />
                        Online
                      </>
                    ) : selectedLastSeen ? (
                      <>
                        <span className="wa-status-dot offline" />
                        Last seen {formatLastSeen(toMs(selectedLastSeen))}
                      </>
                    ) : null}
                    {showOtherTyping && (
                      <div className="wa-typing-hint">
                        {selectedUser.username} is typing…
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="wa-chat-header-actions">
                <button
                  className={`wa-hdr-btn ${showChatSearch ? "active" : ""}`}
                  type="button"
                  title="Search in chat"
                  onClick={() => {
                    setShowChatSearch((p) => !p);
                    setChatSearch("");
                  }}
                >
                  <Icon.Search />
                </button>

                <div className="wa-menu-wrap" ref={menuRef}>
                  <button
                    className={`wa-hdr-btn ${showMenu ? "active" : ""}`}
                    type="button"
                    title="More options"
                    onClick={() => setShowMenu((p) => !p)}
                  >
                    <Icon.More />
                  </button>

                  {showMenu && (
                    <div className="wa-chat-menu">
                      <button className="wa-chat-menu-item" onClick={handleToggleEditMode} type="button">
                        <Icon.Edit size={15} />
                        <span>{editMode ? "Stop Editing" : "Edit Messages"}</span>
                      </button>

                      <button className="wa-chat-menu-item" onClick={handleClearChat} type="button">
                        <Icon.Trash />
                        <span>Clear Chat</span>
                      </button>

                      <button className="wa-chat-menu-item danger" onClick={handleToggleBlock} type="button">
                        <Icon.Block />
                        <span>{isBlocked ? "Unblock" : "Block"} User</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showChatSearch && (
              <div className="wa-chat-search-bar">
                <span className="wa-chat-search-icon">
                  <Icon.Search size={16} />
                </span>
                <input
                  autoFocus
                  placeholder="Search in this conversation..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                />
                <button
                  className="wa-chat-search-close"
                  onClick={() => {
                    setShowChatSearch(false);
                    setChatSearch("");
                  }}
                  type="button"
                >
                  <Icon.Close />
                </button>
              </div>
            )}

            {editMode && (
              <div className="wa-edit-banner">
                <span>✏️ Edit mode — click the pencil icon on your messages to edit</span>
                <button onClick={() => setEditMode(false)} type="button">
                  Done
                </button>
              </div>
            )}

            <div className="wa-messages-area">
              <div className="wa-watermark" aria-hidden="true">
                <img
                  src="/images/chat_logo.png"
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {groupedMessages.length === 0 && showChatSearch && chatSearch ? (
                <div className="wa-no-results">No messages match "{chatSearch}"</div>
              ) : (
                groupedMessages.map((item) =>
                  item.type === "date" ? (
                    <div key={item.key} className="wa-date-sep">
                      <span>{item.label}</span>
                    </div>
                  ) : (
                    renderMessage(item.msg)
                  )
                )
              )}

              <div ref={messagesEndRef} />
            </div>

            {isBlocked ? (
              <div className="wa-blocked-banner">
                <span>You have blocked {selectedUser.username}</span>
                <button onClick={handleToggleBlock} type="button">
                  Unblock
                </button>
              </div>
            ) : (
              <div className="wa-input-area">
                {sendError && (
                  <div className="wa-send-error">ⓘ {sendError}</div>
                )}
                {showEmoji && (
                  <div className="wa-emoji-panel-wrap" ref={emojiPanelRef}>
                    <EmojiPicker
                      onSelect={(emoji) => {
                        setText((prev) => prev + emoji);
                        setShowEmoji(false);
                        scheduleTypingUpdate();
                        inputRef.current?.focus();
                      }}
                    />
                  </div>
                )}

                <button
                  className="wa-input-icon-btn"
                  onClick={() => setShowLibPicker(true)}
                  type="button"
                  title="Attach from Library"
                >
                  <Icon.Attach />
                </button>

                <input
                  ref={inputRef}
                  className="wa-text-input"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    scheduleTypingUpdate();
                  }}
                  onKeyDown={handleKeyDown}
                />

                <button
                  ref={emojiBtnRef}
                  className="wa-input-icon-btn"
                  onClick={() => setShowEmoji((p) => !p)}
                  type="button"
                  title="Emoji"
                >
                  <Icon.Emoji />
                </button>

                <button
                  className={`wa-send-btn ${text.trim() ? "active" : ""}`}
                  onClick={sendMessage}
                  type="button"
                  disabled={!text.trim()}
                >
                  <Icon.Send />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="wa-no-chat">
            <div className="wa-no-chat-inner">
              <img
                src="/images/chat_logo.png"
                alt="PDRM"
                className="wa-no-chat-logo"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <h3>IDMS Messenger</h3>
              <p>
                Select a conversation or tap <strong>New Conversation</strong> to start
              </p>
            </div>
          </div>
        )}
      </div>

      {/* NEW CONVERSATION MODAL */}
      {showNewConv && (
        <div
          className="wa-modal-overlay"
          onClick={() => {
            setNewConvError("");
            setShowNewConv(false);
          }}
        >
          <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wa-modal-header">
              <h3>New Conversation</h3>
              <button
                className="wa-modal-close-btn"
                onClick={() => {
                  setNewConvError("");
                  setShowNewConv(false);
                }}
                type="button"
              >
                <Icon.Close />
              </button>
            </div>

            <div className="wa-modal-search-wrap">
              <span>
                <Icon.Search size={16} />
              </span>
              <input
                placeholder="Search users..."
                value={newConvSearch}
                onChange={(e) => setNewConvSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="wa-modal-subtitle">
              {filteredAllUsers.length} user{filteredAllUsers.length !== 1 ? "s" : ""} available
            </div>

            {newConvError ? (
              <div className="wa-modal-error" role="alert">
                ⓘ {newConvError}
              </div>
            ) : null}

            <div className="wa-modal-list">
              {filteredAllUsers.length === 0 ? (
                <div className="wa-modal-empty">No users found</div>
              ) : (
                filteredAllUsers.map((u) => (
                  <button
                    key={u.id}
                    className="wa-modal-user-item"
                    onClick={() => startNewConversation(u)}
                    type="button"
                  >
                    <div className="wa-modal-user-avatar">{getInitial(u.username)}</div>
                    <div className="wa-modal-user-info">
                      <div className="wa-modal-user-name">{u.username}</div>
                      {u.email && <div className="wa-modal-user-email">{u.email}</div>}
                    </div>
                    <div className="wa-modal-user-arrow">→</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIBRARY PICKER MODAL */}
      {showLibPicker && (
        <div className="wa-modal-overlay" onClick={() => setShowLibPicker(false)}>
          <div className="wa-modal wa-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="wa-modal-header">
              <h3>Attach from Library</h3>
              <button
                className="wa-modal-close-btn"
                onClick={() => setShowLibPicker(false)}
                type="button"
              >
                <Icon.Close />
              </button>
            </div>

            <div className="wa-modal-search-wrap">
              <span>
                <Icon.Search size={16} />
              </span>
              <input
                placeholder="Search by title, ref no. or department..."
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="wa-modal-subtitle">
              {filteredLibraryDocs.length} document{filteredLibraryDocs.length !== 1 ? "s" : ""} in Library
            </div>

            <div className="wa-modal-list">
              {filteredLibraryDocs.length === 0 ? (
                <div className="wa-modal-empty">
                  {libraryDocs.length === 0 ? "No documents in Library yet" : "No matches"}
                </div>
              ) : (
                filteredLibraryDocs.map((d) => {
                  const deptLabel = Array.isArray(d.departments)
                    ? d.departments.join(", ")
                    : (d.department || "");
                  return (
                  <button
                    key={d.id}
                    className="wa-lib-item"
                    onClick={() => sendLibraryDoc(d)}
                    type="button"
                  >
                    <div className="wa-lib-icon-wrap">
                      <Icon.Doc />
                    </div>

                    <div className="wa-lib-info">
                      <div className="wa-lib-ref">{d.refNo || d.id}</div>
                      <div className="wa-lib-title">{d.title || "Untitled"}</div>
                      <div className="wa-lib-meta">
                        {(d.type || "doc").toUpperCase()}
                        {deptLabel ? ` • ${deptLabel}` : ""}
                      </div>
                    </div>

                    <div className="wa-lib-send">
                      <Icon.Send />
                    </div>
                  </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog && (
        <div className="wa-modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="wa-confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="wa-confirm-title">{confirmDialog.title}</h3>
            <p className="wa-confirm-text">{confirmDialog.message}</p>
            <div className="wa-confirm-actions">
              <button className="wa-confirm-cancel" onClick={() => setConfirmDialog(null)} type="button">
                Cancel
              </button>
              <button
                className={`wa-confirm-ok ${confirmDialog.danger ? "danger" : ""}`}
                onClick={confirmDialog.onConfirm}
                type="button"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}