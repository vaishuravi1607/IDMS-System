import { useEffect, useMemo, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import Layout from "../components/Layout";
import { auth, db } from "../firebase";

const DEPARTMENT_FILTERS = ["All", "ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];
const LIBRARY_EDIT_TYPES = ["MEMO", "SURAT", "UTUSAN", "EMAIL"];
const LIBRARY_EDIT_DEPTS = ["ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "memo", label: "Memo" },
  { value: "surat", label: "Surat" },
  { value: "utusan", label: "Utusan" },
  { value: "email", label: "Email" },
];

const DEPT_OPTIONS = [
  { value: "All", label: "All Departments" },
  { value: "ADMIN TSM", label: "ADMIN TSM" },
  { value: "IT", label: "IT" },
  { value: "SAIFER", label: "SAIFER" },
  { value: "KOMUNIKASI", label: "KOMUNIKASI" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "az", label: "Title A-Z" },
  { value: "za", label: "Title Z-A" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3V7M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12C4.5 7.5 8 5 12 5C16 5 19.5 7.5 22 12C19.5 16.5 16 19 12 19C8 19 4.5 16.5 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 11L12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6" stroke="currentColor" strokeWidth="2" />
      <path d="M19 6L18.3 18.5C18.24 19.37 17.52 20 16.65 20H7.35C6.48 20 5.76 19.37 5.7 18.5L5 6" stroke="currentColor" strokeWidth="2" />
      <path d="M10 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PencilDocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21H10L21 10L14 3L3 14V21H4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M15 6L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortArrowsIcon({ active, direction }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="library-v2-sort-icon">
      <path
        d="M6 2L3 5H9L6 2Z"
        fill={active && direction === "asc" ? "#2f80ed" : "#b5bdc9"}
      />
      <path
        d="M6 10L3 7H9L6 10Z"
        fill={active && direction === "desc" ? "#2f80ed" : "#b5bdc9"}
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeaderDocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3H14L19 8V21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z"
        stroke="#2f80ed"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 3V8H19" stroke="#2f80ed" strokeWidth="2" />
      <path d="M9 13H15" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 17H13" stroke="#2f80ed" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MiniFileIcon({ type }) {
  const typeLower = String(type || "").toLowerCase();
  let color = "#2f80ed";
  if (typeLower === "utusan") color = "#10b981";
  else if (typeLower === "surat") color = "#8b5cf6";
  else if (typeLower === "email") color = "#f59e0b";

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3H14L19 8V21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 3V8H19" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function LibraryIllustration() {
  return (
    <svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" className="library-v2-illustration-svg">
      <path d="M30 90 Q25 75 35 65 Q45 75 40 90 Z" fill="#a7d9b8" opacity="0.7" />
      <path d="M40 95 Q38 82 48 76 Q55 88 50 98 Z" fill="#8fcda4" opacity="0.6" />
      <circle cx="55" cy="45" r="3" fill="#60a5fa" opacity="0.5" />
      <circle cx="215" cy="110" r="2.5" fill="#fbbf24" opacity="0.7" />
      <circle cx="205" cy="35" r="2" fill="#34d399" opacity="0.6" />
      <rect x="100" y="30" width="70" height="85" rx="4" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" transform="rotate(-8 135 72)" />
      <rect x="115" y="25" width="70" height="85" rx="4" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
      <line x1="122" y1="40" x2="178" y2="40" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="122" y1="50" x2="178" y2="50" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="122" y1="60" x2="170" y2="60" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="122" y1="70" x2="178" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="122" y1="80" x2="160" y2="80" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="122" y1="90" x2="175" y2="90" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M150 75 L190 75 L195 82 L225 82 Q228 82 228 85 L228 120 Q228 124 225 124 L150 124 Q146 124 146 120 L146 79 Q146 75 150 75 Z"
        fill="#3b82f6"
      />
      <path
        d="M150 78 L190 78 L193 84 L225 84 Q226 84 226 85 L226 90 L146 90 L146 81 Q146 78 150 78 Z"
        fill="#60a5fa"
      />
    </svg>
  );
}

function normalizeTypeKey(type) {
  return String(type || "").toLowerCase().trim();
}

function docDepartmentNames(docItem) {
  if (Array.isArray(docItem.departments) && docItem.departments.length > 0) {
    return docItem.departments.map((s) => String(s || "").trim()).filter(Boolean);
  }
  if (typeof docItem.department === "string" && docItem.department.trim()) {
    return docItem.department.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function EmailViewModal({ item, onClose }) {
  return (
    <div
      className="lib-email-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="lib-email-card" onClick={(e) => e.stopPropagation()}>
        <div className="lib-email-header">
          <h3 className="lib-email-subject">{item.title || "(No subject)"}</h3>
          <button type="button" className="lib-email-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="lib-email-meta">
          <div className="lib-email-meta-row">
            <span className="lib-email-meta-label">From</span>
            <span className="lib-email-meta-value">{item.sender || "-"}</span>
          </div>
          <div className="lib-email-meta-row">
            <span className="lib-email-meta-label">Date</span>
            <span className="lib-email-meta-value">{formatDate(item.createdAt)}</span>
          </div>
          <div className="lib-email-meta-row">
            <span className="lib-email-meta-label">Ref</span>
            <span className="lib-email-meta-value">{item.refNo || "-"}</span>
          </div>
        </div>

        <div className="lib-email-body">
          {item.emailBody || item.emailSnippet || "No email content stored."}
        </div>

        {item.fileUrl && (
          <div className="lib-email-attachment">
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="lib-email-attachment-link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              View Attachment
            </a>
          </div>
        )}

        <div className="lib-email-footer">
          <button type="button" className="lib-email-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts?.toDate) return "-";
  const d = ts.toDate();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function EditDocModal({ item, onClose, onToast }) {
  const [busy, setBusy] = useState(false);
  const [refNo, setRefNo] = useState(item.refNo || "");
  const [title, setTitle] = useState(item.title || "");
  const [type, setType] = useState(String(item.type || "MEMO").toUpperCase());
  const [direction, setDirection] = useState(
    String(item.direction || "incoming").toLowerCase() === "outgoing"
      ? "outgoing"
      : "incoming"
  );
  const [departments, setDepartments] = useState(() => {
    if (Array.isArray(item.departments) && item.departments.length > 0) {
      return item.departments;
    }
    if (typeof item.department === "string" && item.department.trim()) {
      return item.department.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });

  const toggleDept = (d) =>
    setDepartments((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const save = async () => {
    const r = refNo.trim();
    const t = title.trim();
    if (!r || !t) {
      onToast?.("Reference number and title are required.", "error");
      return;
    }
    if (departments.length === 0) {
      onToast?.("Please select at least one department.", "error");
      return;
    }

    try {
      setBusy(true);
      await updateDoc(doc(db, "documents", item.id), {
        refNo: r,
        title: t,
        type: type.trim(),
        direction,
        departments,
        department: departments.join(", "),
      });
      onToast?.("Document updated.", "success");
      onClose();
    } catch (err) {
      console.error(err);
      onToast?.("Failed to save changes. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lib-edit-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lib-edit-card" onClick={(e) => e.stopPropagation()}>
        <h3>Edit document</h3>

        <div className="lib-edit-field">
          <label htmlFor="lib-edit-ref">Reference no.</label>
          <input id="lib-edit-ref" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
        </div>

        <div className="lib-edit-field">
          <label htmlFor="lib-edit-title">Title</label>
          <input id="lib-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="lib-edit-field">
          <label htmlFor="lib-edit-type">Type</label>
          <select id="lib-edit-type" value={type} onChange={(e) => setType(e.target.value)}>
            {LIBRARY_EDIT_TYPES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="lib-edit-field">
          <span id="lib-edit-dir-label">Direction</span>
          <div className="lib-edit-toggle-row" role="group" aria-labelledby="lib-edit-dir-label">
            <button
              type="button"
              className={`lib-edit-toggle-btn${direction === "incoming" ? " active" : ""}`}
              onClick={() => setDirection("incoming")}
            >
              Incoming
            </button>
            <button
              type="button"
              className={`lib-edit-toggle-btn${direction === "outgoing" ? " active" : ""}`}
              onClick={() => setDirection("outgoing")}
            >
              Outgoing
            </button>
          </div>
        </div>

        <div className="lib-edit-field">
          <span>Departments</span>
          <div className="lib-edit-dept-grid">
            {LIBRARY_EDIT_DEPTS.map((dept) => (
              <label key={dept} className="lib-edit-dept-label">
                <input
                  type="checkbox"
                  checked={departments.includes(dept)}
                  onChange={() => toggleDept(dept)}
                />
                {dept}
              </label>
            ))}
          </div>
        </div>

        <div className="lib-edit-actions">
          <button type="button" className="lib-edit-btn cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="lib-edit-btn save" onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Library() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editTarget, setEditTarget] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [emailModal, setEmailModal] = useState(null);

  const [searchParams] = useSearchParams();
  const statusFilter = String(searchParams.get("status") || "all").toLowerCase();

  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setDocuments(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, deptFilter, statusFilter, sortBy, sortColumn, sortDirection, pageSize, dateFrom, dateTo]);

  const statusFilteredDocs = useMemo(() => {
    if (statusFilter === "all") return documents;
    return documents.filter((item) => {
      const itemStatus = String(item.status || "pending").toLowerCase();
      return itemStatus === statusFilter;
    });
  }, [documents, statusFilter]);

  const deptCounts = useMemo(() => {
    const counts = { All: statusFilteredDocs.length };
    DEPARTMENT_FILTERS.slice(1).forEach((dept) => {
      counts[dept] = statusFilteredDocs.filter((d) => d.departments?.includes(dept)).length;
    });
    return counts;
  }, [statusFilteredDocs]);

  // Unread (pending) counts per department — always based on the full document
  // set, so users can see at a glance how many docs still need attention even
  // when a status filter is applied.
  const unreadCounts = useMemo(() => {
    const pendingDocs = documents.filter(
      (d) => String(d.status || "pending").toLowerCase() === "pending"
    );
    const counts = { All: pendingDocs.length };
    DEPARTMENT_FILTERS.slice(1).forEach((dept) => {
      counts[dept] = pendingDocs.filter((d) => d.departments?.includes(dept)).length;
    });
    return counts;
  }, [documents]);

  const processedDocs = useMemo(() => {
    let result = [...statusFilteredDocs];

    const parseFilterDateMs = (s, endOfDay) => {
      if (!s?.trim?.()) return null;
      const parts = String(s).split("-");
      if (parts.length !== 3) return null;
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return null;
      return new Date(
        y,
        m,
        day,
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0
      ).getTime();
    };

    const fromMsBound = parseFilterDateMs(dateFrom, false);
    const toMsBound = parseFilterDateMs(dateTo, true);
    if (fromMsBound !== null || toMsBound !== null) {
      result = result.filter((item) => {
        const ct = item.createdAt?.toDate?.();
        if (!ct) return false;
        const t = ct.getTime();
        if (fromMsBound !== null && t < fromMsBound) return false;
        if (toMsBound !== null && t > toMsBound) return false;
        return true;
      });
    }

    const keyword = search.trim().toLowerCase();
    if (keyword) {
      result = result.filter(
        (item) =>
          String(item.refNo || "").toLowerCase().includes(keyword) ||
          String(item.title || "").toLowerCase().includes(keyword) ||
          String(item.type || "").toLowerCase().includes(keyword) ||
          String(item.departments?.join(", ") || item.department || "")
            .toLowerCase()
            .includes(keyword) ||
          String(item.status || "").toLowerCase().includes(keyword)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter(
        (item) => normalizeTypeKey(item.type) === typeFilter
      );
    }

    if (deptFilter !== "All") {
      result = result.filter((item) => item.departments?.includes(deptFilter));
    }

    if (sortColumn) {
      const getKey = (item) => {
        if (sortColumn === "title") return String(item.title || "").toLowerCase();
        if (sortColumn === "type") return normalizeTypeKey(item.type);
        if (sortColumn === "department") {
          return String(item.departments?.join(",") || "").toLowerCase();
        }
        if (sortColumn === "status") return String(item.status || "pending").toLowerCase();
        if (sortColumn === "date") return item.createdAt?.toDate?.() || new Date(0);
        return "";
      };

      result.sort((a, b) => {
        const ak = getKey(a);
        const bk = getKey(b);
        if (ak < bk) return sortDirection === "asc" ? -1 : 1;
        if (ak > bk) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      if (sortBy === "latest") {
        result.sort((a, b) => {
          const ad = a.createdAt?.toDate?.() || new Date(0);
          const bd = b.createdAt?.toDate?.() || new Date(0);
          return bd - ad;
        });
      } else if (sortBy === "oldest") {
        result.sort((a, b) => {
          const ad = a.createdAt?.toDate?.() || new Date(0);
          const bd = b.createdAt?.toDate?.() || new Date(0);
          return ad - bd;
        });
      } else if (sortBy === "az") {
        result.sort((a, b) =>
          String(a.title || "").localeCompare(String(b.title || ""))
        );
      } else if (sortBy === "za") {
        result.sort((a, b) =>
          String(b.title || "").localeCompare(String(a.title || ""))
        );
      }
    }

    return result;
  }, [statusFilteredDocs, search, typeFilter, deptFilter, sortColumn, sortDirection, sortBy, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(processedDocs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, processedDocs.length);
  const paginatedDocs = processedDocs.slice(startIdx, endIdx);

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const markViewed = async (docItem) => {
    if (!auth.currentUser?.uid || !docItem?.id) return;

    try {
      const payload = {
        viewedBy: arrayUnion(auth.currentUser.uid),
        viewed: true,
      };

      if (
        String(docItem.status || "").toLowerCase() === "pending" ||
        !docItem.status
      ) {
        payload.status = "viewed";
      }

      await updateDoc(doc(db, "documents", docItem.id), payload);
    } catch (err) {
      console.error("Failed to mark viewed:", err);
      toast("Failed to mark as viewed. Please try again.", "error");
    }
  };

  const markProcessed = async (id) => {
    if (!id) return;

    try {
      await updateDoc(doc(db, "documents", id), {
        status: "processed",
        processedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to mark processed:", err);
      toast("Failed to mark as done. Please try again.", "error");
    }
  };

  const deleteDocument = async (id) => {
    if (!id) return;

    try {
      await deleteDoc(doc(db, "documents", id));
    } catch (err) {
      console.error("Failed to delete:", err);
      toast("Failed to delete document. Please try again.", "error");
    }
  };

  const handleSortColumn = (col) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const getStatusText = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "processed") return "Processed";
    if (s === "viewed") return "Viewed";
    return "Pending";
  };

  const getStatusClass = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "processed") return "processed";
    if (s === "viewed") return "viewed";
    return "pending";
  };

  const syncEmails = async () => {
    setSyncing(true);
    try {
      const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: "fetchEmails" }),
      });

      if (!response.ok) throw new Error(`Server error (HTTP ${response.status})`);

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      const emails = result.emails || [];
      if (emails.length === 0) {
        toast("No new emails.", "info");
        return;
      }

      // Use Gmail message ID as Firestore doc ID to prevent duplicates on re-sync.
      // Status is intentionally excluded so merge preserves existing status on re-sync.
      // New docs have no status field; the UI defaults missing status to "pending".
      await Promise.all(
        emails.map((email) =>
          setDoc(
            doc(db, "documents", email.emailId),
            {
              type: "EMAIL",
              title: email.subject || "(No subject)",
              refNo: "EMAIL-" + email.emailId.slice(0, 8).toUpperCase(),
              sender: email.sender,
              fileUrl: email.viewUrl || "",
              fileId: email.fileId || "",
              emailSnippet: email.snippet || "",
              emailBody: email.snippet || "",
              department: "",
              departments: email.departments || [],
              createdAt: Timestamp.fromDate(new Date(email.date)),
            },
            { merge: true }
          )
        )
      );

      toast(`Synced ${emails.length} email(s).`, "success");
    } catch (err) {
      console.error(err);
      toast("Sync failed: " + err.message, "error");
    } finally {
      setSyncing(false);
    }
  };

  const getSubtitle = () => {
    if (statusFilter === "pending") {
      return "Showing all pending documents that still need attention.";
    }
    if (statusFilter === "viewed") {
      return "Showing documents that have already been opened or reviewed.";
    }
    if (statusFilter === "processed") {
      return "Showing completed documents that have already been handled.";
    }
    return "Search, filter, view and manage uploaded documents.";
  };

  return (
    <Layout>
      <div className="library-v2-screen">
        <div className="library-v2-header">
          <div className="library-v2-header-content">
            <div className="library-v2-header-icon-wrap">
              <HeaderDocIcon />
            </div>
            <div>
              <h1 className="library-v2-title">Library</h1>
              <p className="library-v2-subtitle">{getSubtitle()}</p>
            </div>
          </div>

          <div className="library-v2-illustration">
            <LibraryIllustration />
          </div>
        </div>

        <div className="library-v2-toolbar">
          <div className="library-v2-toolbar-row">
            <div className="library-v2-search-wrap">
              <input
                className="library-v2-search-input"
                placeholder="Search documents by title, reference no, type, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="library-v2-search-icon">
                <SearchIcon />
              </span>
            </div>

            <div className="library-v2-dropdowns">
              <select
                className="library-v2-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                className="library-v2-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                {DEPT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="library-v2-date-field">
                <label htmlFor="lib-filter-from">From</label>
                <input
                  id="lib-filter-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="library-v2-date-field">
                <label htmlFor="lib-filter-to">To</label>
                <input
                  id="lib-filter-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <select
                className="library-v2-select library-v2-select-sort"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setSortColumn(null);
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="library-v2-sync-btn"
                onClick={syncEmails}
                disabled={syncing}
                title="Sync unread emails from Gmail"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M4 12C4 7.58 7.58 4 12 4C14.93 4 17.5 5.55 19 7.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 12C20 16.42 16.42 20 12 20C9.07 20 6.5 18.45 5 16.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M19 4L19 8L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 20L5 16L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {syncing ? "Syncing..." : "Sync Emails"}
              </button>
            </div>
          </div>
        </div>

        <div className="library-v2-pills">
          {DEPARTMENT_FILTERS.map((dept) => {
            const unread = unreadCounts[dept] || 0;
            return (
              <button
                key={dept}
                type="button"
                className={`library-v2-pill ${deptFilter === dept ? "active" : ""}`}
                onClick={() => setDeptFilter(dept)}
              >
                <span className="library-v2-pill-label">
                  {dept} ({deptCounts[dept] || 0})
                </span>
                {unread > 0 && (
                  <span
                    className="library-v2-pill-badge"
                    title={`${unread} pending`}
                    aria-label={`${unread} unread pending`}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="library-v2-table-card">
          <div className="library-v2-table-scroll">
            <table className="library-v2-table">
              <thead>
                <tr>
                  <th>REFERENCE NO</th>
                  <th
                    className="library-v2-sortable"
                    onClick={() => handleSortColumn("title")}
                  >
                    <span>TITLE</span>
                    <SortArrowsIcon
                      active={sortColumn === "title"}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    className="library-v2-sortable"
                    onClick={() => handleSortColumn("type")}
                  >
                    <span>TYPE</span>
                    <SortArrowsIcon
                      active={sortColumn === "type"}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    className="library-v2-sortable library-v2-dept-col"
                    onClick={() => handleSortColumn("department")}
                  >
                    <span>DEPARTMENT</span>
                    <SortArrowsIcon
                      active={sortColumn === "department"}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    className="library-v2-sortable"
                    onClick={() => handleSortColumn("date")}
                  >
                    <span>DATE</span>
                    <SortArrowsIcon
                      active={sortColumn === "date"}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    className="library-v2-sortable"
                    onClick={() => handleSortColumn("status")}
                  >
                    <span>STATUS</span>
                    <SortArrowsIcon
                      active={sortColumn === "status"}
                      direction={sortDirection}
                    />
                  </th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {paginatedDocs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="library-v2-empty-cell">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  paginatedDocs.map((docItem) => {
                    const viewed = docItem.viewedBy?.includes(auth.currentUser?.uid);
                    const statusText = getStatusText(docItem.status);
                    const statusClass = getStatusClass(docItem.status);
                    const typeLower = normalizeTypeKey(docItem.type);
                    const deptNames = docDepartmentNames(docItem);

                    return (
                      <tr key={docItem.id}>
                        <td className="library-v2-ref">
                          {docItem.refNo || "-"}
                        </td>

                        <td className="library-v2-title-cell">
                          <div className="library-v2-title-text">
                            {(docItem.title || "-").toUpperCase()}
                          </div>
                          <div className="library-v2-title-sub">
                            <MiniFileIcon type={docItem.type} />
                            <span>{capitalize(docItem.type || "")}</span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`library-v2-type-badge type-${typeLower || "default"}`}
                          >
                            {(docItem.type || "-").toUpperCase()}
                          </span>
                        </td>

                        <td className="library-v2-dept-cell">
                          {deptNames.length > 0 ? (
                            <div className="library-v2-dept-pills">
                              {deptNames.map((name, i) => (
                                <span
                                  key={`${docItem.id}-${name}-${i}`}
                                  className="library-v2-dept-pill"
                                  title={name}
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="library-v2-dept-empty">—</span>
                          )}
                        </td>

                        <td>
                          <div className="library-v2-date">
                            <CalendarIcon />
                            <span>{formatDate(docItem.createdAt)}</span>
                          </div>
                        </td>

                        <td>
                          <span className={`library-v2-status-badge ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>

                        <td>
                          <div className="library-v2-action-row">
                            {typeLower === "email" ? (
                              <button
                                type="button"
                                className={`library-v2-view-btn ${viewed ? "viewed" : ""}`}
                                onClick={() => {
                                  markViewed(docItem);
                                  setEmailModal(docItem);
                                }}
                              >
                                <EyeIcon />
                                {viewed ? "Viewed ✓" : "View"}
                              </button>
                            ) : docItem.fileUrl ? (
                              <a
                                className={`library-v2-view-btn ${viewed ? "viewed" : ""}`}
                                href={docItem.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => markViewed(docItem)}
                              >
                                <EyeIcon />
                                {viewed ? "Viewed ✓" : "View"}
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="library-v2-view-btn"
                                onClick={() => markViewed(docItem)}
                              >
                                <EyeIcon />
                                View
                              </button>
                            )}

                            {docItem.fileUrl && (
                              <a
                                className="library-v2-icon-btn"
                                href={
                                  docItem.fileId
                                    ? `https://drive.google.com/uc?export=download&id=${docItem.fileId}`
                                    : docItem.fileUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Download"
                              >
                                <DownloadIcon />
                              </a>
                            )}

                            <button
                              type="button"
                              className="library-v2-icon-btn edit"
                              onClick={() => setEditTarget(docItem)}
                              aria-label="Edit document"
                              title="Edit"
                            >
                              <PencilDocIcon />
                            </button>

                            {statusText !== "Processed" && (
                              <button
                                type="button"
                                className="library-v2-icon-btn"
                                onClick={() => markProcessed(docItem.id)}
                                title="Mark as Done"
                                aria-label="Mark as Done"
                              >
                                <CheckIcon />
                              </button>
                            )}

                            <button
                              type="button"
                              className="library-v2-icon-btn library-v2-delete-btn"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this document?"
                                  )
                                ) {
                                  deleteDocument(docItem.id);
                                }
                              }}
                              aria-label="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {processedDocs.length > 0 && (
            <div className="library-v2-pagination">
              <div className="library-v2-pagination-info">
                Showing {startIdx + 1} to {endIdx} of {processedDocs.length} documents
              </div>

              <div className="library-v2-pagination-controls">
                <button
                  type="button"
                  className="library-v2-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon />
                </button>

                {getPageNumbers().map((pg, idx) =>
                  pg === "..." ? (
                    <span key={`dots-${idx}`} className="library-v2-page-dots">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pg}
                      type="button"
                      className={`library-v2-page-btn ${currentPage === pg ? "active" : ""}`}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="library-v2-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="Next page"
                >
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="library-v2-page-size-wrap">
                <select
                  className="library-v2-page-size-select"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {editTarget && (
        <EditDocModal
          item={editTarget}
          onClose={() => setEditTarget(null)}
          onToast={toast}
        />
      )}

      {emailModal && (
        <EmailViewModal
          item={emailModal}
          onClose={() => setEmailModal(null)}
        />
      )}
    </Layout>
  );
}