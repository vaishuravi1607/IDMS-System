import { useEffect, useMemo, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { auth, db } from "../firebase";

const FILTERS = ["All", "ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20L16.65 16.65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Library() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
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

  const filtered = useMemo(() => {
    return documents.filter((item) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch = !keyword
        ? true
        : String(item.refNo || "").toLowerCase().includes(keyword) ||
          String(item.title || "").toLowerCase().includes(keyword) ||
          String(item.type || "").toLowerCase().includes(keyword) ||
          String(item.department || "").toLowerCase().includes(keyword) ||
          String(item.status || "").toLowerCase().includes(keyword);

      const matchesDepartment =
        filter === "All" ? true : item.departments?.includes(filter);

      const itemStatus = String(item.status || "pending").toLowerCase();
      const matchesStatus =
        statusFilter === "all" ? true : itemStatus === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [documents, search, filter, statusFilter]);

  const markViewed = async (docItem) => {
    if (!auth.currentUser?.uid || !docItem?.id) return;

    try {
      const updatePayload = {
        viewedBy: arrayUnion(auth.currentUser.uid),
        viewed: true,
      };

      if (String(docItem.status || "").toLowerCase() === "pending" || !docItem.status) {
        updatePayload.status = "viewed";
      }

      await updateDoc(doc(db, "documents", docItem.id), updatePayload);
    } catch (err) {
      console.error("Failed to mark viewed:", err);
    }
  };

  const markProcessed = async (id) => {
    if (!id) return;

    try {
      await updateDoc(doc(db, "documents", id), {
        status: "processed",
      });
    } catch (err) {
      console.error("Failed to mark processed:", err);
    }
  };

  const getStatusClass = (status) => {
    const value = String(status || "pending").toLowerCase();

    if (value === "processed") return "processed";
    if (value === "viewed") return "viewed";
    return "pending";
  };

  const getStatusText = (status) => {
    const value = String(status || "pending").toLowerCase();

    if (value === "processed") return "processed";
    if (value === "viewed") return "viewed";
    return "pending";
  };

  const getPageSubtitle = () => {
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
      <div className="library-modern-screen">
        <div className="page-section-header">
          <h1 className="page-section-title">Library</h1>
          <p className="page-section-subtitle">{getPageSubtitle()}</p>
        </div>

        <div className="library-modern-toolbar">
          <div className="library-modern-search">
            <input
              className="library-modern-search-input"
              placeholder="Search documents"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="library-modern-search-icon">
              <SearchIcon />
            </span>
          </div>
        </div>

        <div className="library-modern-filters">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "library-filter-btn active" : "library-filter-btn"}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="library-modern-table-card">
          <div className="library-table-scroll">
            <table className="library-modern-table">
              <thead>
                <tr>
                  <th>REFERENCE NO</th>
                  <th>TITLE</th>
                  <th>TYPE</th>
                  <th>DEPARTMENT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="library-empty-cell">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  filtered.map((docItem) => {
                    const viewed = docItem.viewedBy?.includes(auth.currentUser?.uid);
                    const statusText = getStatusText(docItem.status);
                    const statusClass = getStatusClass(docItem.status);

                    return (
                      <tr key={docItem.id}>
                        <td>{docItem.refNo || "-"}</td>
                        <td>{docItem.title || "-"}</td>
                        <td>{docItem.type || "-"}</td>
                        <td>{docItem.departments?.join(", ") || docItem.department || "-"}</td>
                        <td>
                          {docItem.createdAt?.toDate
                            ? docItem.createdAt.toDate().toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <span className={`library-status-badge ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>
                        <td>
                          <div className="library-action-row">
                            {docItem.fileUrl ? (
                              <>
                                <a
                                  className="library-action-link primary"
                                  href={docItem.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => markViewed(docItem)}
                                >
                                  {viewed ? "Viewed ✓" : "View"}
                                </a>

                                <a
                                  className="library-action-link"
                                  href={docItem.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Download
                                </a>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="library-action-link primary no-style-btn"
                                onClick={() => markViewed(docItem)}
                              >
                                {viewed ? "Viewed ✓" : "View"}
                              </button>
                            )}

                            {statusText !== "processed" && (
                              <button
                                type="button"
                                className="library-action-link no-style-btn"
                                onClick={() => markProcessed(docItem.id)}
                              >
                                Mark as Done
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}