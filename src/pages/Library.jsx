import { useEffect, useMemo, useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import Layout from "../components/Layout";
import { auth, db } from "../firebase";

const FILTERS = ["All", "ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];

export default function Library() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return documents.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword
        ? true
        : item.refNo?.toLowerCase().includes(keyword) ||
          item.title?.toLowerCase().includes(keyword) ||
          item.type?.toLowerCase().includes(keyword) ||
          item.department?.toLowerCase().includes(keyword);

      const matchesFilter =
        filter === "All" ? true : item.departments?.includes(filter);

      return matchesSearch && matchesFilter;
    });
  }, [documents, search, filter]);

  const markViewed = async (id) => {
    if (!auth.currentUser?.uid) return;

    try {
      await updateDoc(doc(db, "documents", id), {
        viewedBy: arrayUnion(auth.currentUser.uid)
      });
    } catch (err) {
      console.error("Failed to mark viewed:", err);
    }
  };

  return (
    <Layout title="Library">
      <div className="library-topbar">
        <input
          className="search-input"
          placeholder="search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-row">
        {FILTERS.map((item) => (
          <button
            key={item}
            className={filter === item ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="doc-table">
          <thead>
            <tr>
              <th>REFERENCE NO</th>
              <th>TITLE</th>
              <th>TYPE</th>
              <th>DEPT</th>
              <th>DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((docItem) => {
              const viewed = docItem.viewedBy?.includes(auth.currentUser?.uid);

              return (
                <tr key={docItem.id}>
                  <td>{docItem.refNo}</td>
                  <td>{docItem.title}</td>
                  <td>{docItem.type}</td>
                  <td>{docItem.departments?.join(", ")}</td>
                  <td>
                    {docItem.createdAt?.toDate
                      ? docItem.createdAt.toDate().toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <div className="action-row">
                      {docItem.fileUrl ? (
                        <>
                          <a
                            className="table-link"
                            href={docItem.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => markViewed(docItem.id)}
                          >
                            {viewed ? "Viewed ✓" : "View"}
                          </a>

                          <a
                            className="table-link"
                            href={docItem.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download
                          </a>
                        </>
                      ) : (
                        <button
                          className="table-link no-style-btn"
                          onClick={() => markViewed(docItem.id)}
                        >
                          {viewed ? "Viewed ✓" : "View"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}