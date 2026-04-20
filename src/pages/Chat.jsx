import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import Layout from "../components/Layout";
import { auth, db } from "../firebase";

function createChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

export default function Chat() {
  const currentUid = auth.currentUser?.uid;

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");

  useEffect(() => {
    if (!currentUid) return;
    getDoc(doc(db, "users", currentUid)).then((snap) => {
      if (snap.exists()) setCurrentUsername(snap.data().username || "");
    });
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) return;

    const q = query(collection(db, "users"));

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.id !== currentUid);

      setUsers(all);

      if (!selectedUser && all.length > 0) {
        setSelectedUser(all[0]);
      }
    });

    return () => unsub();
  }, [currentUid, selectedUser]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      (u.username || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  useEffect(() => {
    if (!currentUid || !selectedUser?.id) {
      setMessages([]);
      return;
    }

    const chatId = createChatId(currentUid, selectedUser.id);

    const chatRef = doc(db, "chats", chatId);
    updateDoc(chatRef, { [`unreadCounts.${currentUid}`]: 0 }).catch(() => {});

    const msgQ = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(msgQ, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [currentUid, selectedUser]);

  const ensureChat = async () => {
    const chatId = createChatId(currentUid, selectedUser.id);
    const chatRef = doc(db, "chats", chatId);

    const existing = await getDoc(chatRef);

    if (!existing.exists()) {
      await setDoc(chatRef, {
        participants: [currentUid, selectedUser.id],
        participantUsernames: [currentUsername, selectedUser.username],
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    return chatId;
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() || !selectedUser) return;

    const chatId = await ensureChat();

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: currentUid,
      senderUsername: currentUsername,
      text: text.trim(),
      type: "text",
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      [`unreadCounts.${selectedUser.id}`]: increment(1),
    });

    setText("");
  };

  return (
    <Layout title="Chat">
      <div className="chat-layout">
        <div className="chat-sidebar">
          <input
            className="search-input"
            placeholder="search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="user-list">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                className={
                  selectedUser?.id === u.id
                    ? "user-item active"
                    : "user-item"
                }
                onClick={() => setSelectedUser(u)}
              >
                {u.username}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-header">
            {selectedUser ? selectedUser.username : "No user selected"}
          </div>

          <div className="message-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.senderId === currentUid
                    ? "message-bubble mine"
                    : "message-bubble theirs"
                }
              >
                {msg.text}
              </div>
            ))}
          </div>

          {selectedUser && (
            <form className="chat-input-row" onSubmit={sendMessage}>
              <input
                placeholder="Type a message"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <button className="primary-btn" type="submit">
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}