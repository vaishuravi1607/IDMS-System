import { useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Layout from "../components/Layout";
import { db } from "../firebase";

const DEPARTMENT_OPTIONS = ["ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];
const TYPE_OPTIONS = ["MEMO", "SURAT", "UTUSAN"];

export default function UploadPage() {
  const [refNo, setRefNo] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("incoming");
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  const detectTypeFromName = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes("memo")) return "MEMO";
    if (name.includes("surat")) return "SURAT";
    if (name.includes("utusan")) return "UTUSAN";
    return null;
  };

  const toggleDepartment = (dept) =>
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );

  const handleFile = (file) => {
    if (!file) return;
    setPdfFile(file);
    setError("");
    const detected = detectTypeFromName(file.name);
    if (detected) setType(detected);
  };

  const resetForm = () => {
    setRefNo("");
    setTitle("");
    setType("");
    setPdfFile(null);
    setUploadProgress("");
    setDepartments([]);
    setError("");
    setSuccess("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!refNo.trim() || !title.trim() || !type) {
      setError("Please complete Ref. No., Title and Type.");
      return;
    }
    if (departments.length === 0) {
      setError("Please select at least one department.");
      return;
    }
    if (!pdfFile) {
      setError("Please attach a PDF file.");
      return;
    }
    if (pdfFile.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum is 10 MB.");
      return;
    }

    try {
      setLoading(true);
      setUploadProgress("uploading");

      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(pdfFile);
      });

      const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ base64Data, fileName: pdfFile.name, type: type.trim() }),
      });

      if (!response.ok) throw new Error(`Upload failed (HTTP ${response.status})`);

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      if (!result.viewUrl) throw new Error("No viewUrl returned from Drive.");

      setUploadProgress("done");

      await addDoc(collection(db, "documents"), {
        refNo: refNo.trim(),
        title: title.trim(),
        type: type.trim(),
        direction,
        fileUrl: result.viewUrl,
        fileId: result.fileId,
        department: departments.join(", "),
        departments,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      resetForm();
      setSuccess("Document uploaded successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload document.");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  };

  return (
    <Layout>
      <div className="upv2-page">
        <div className="upv2-container">

          <div className="upv2-page-header">
            <div className="upv2-page-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <h1 className="upv2-title">Upload Document</h1>
              <p className="upv2-subtitle">Add a new document to the IDMS library</p>
            </div>
          </div>

          <div className="upv2-card">
            <form onSubmit={handleSubmit} className="upv2-form">

            <div className="upv2-row-2col">
              <div className="upv2-field">
                <label className="upv2-label">Reference No.</label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="upv2-input"
                  placeholder="e.g. IPK/2025/001"
                  disabled={loading}
                />
              </div>
              <div className="upv2-field">
                <label className="upv2-label">Direction</label>
                <div className="upv2-toggle-group">
                  {["incoming", "outgoing"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`upv2-toggle-btn${direction === d ? " upv2-toggle-active" : ""}`}
                      onClick={() => setDirection(d)}
                      disabled={loading}
                    >
                      {d === "incoming" ? "Incoming" : "Outgoing"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="upv2-field">
              <label className="upv2-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="upv2-input"
                placeholder="Enter document title"
                disabled={loading}
              />
            </div>

            <div className="upv2-field">
              <label className="upv2-label">Document Type</label>
              <div className="upv2-type-group">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`upv2-type-btn${type === t ? " upv2-type-active" : ""}`}
                    onClick={() => setType(t)}
                    disabled={loading}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="upv2-field">
              <label className="upv2-label">
                Department
                <span className="upv2-label-note"> — select all that apply</span>
              </label>
              <div className="upv2-dept-group">
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    className={`upv2-dept-btn${departments.includes(dept) ? " upv2-dept-active" : ""}`}
                    onClick={() => toggleDepartment(dept)}
                    disabled={loading}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div className="upv2-field">
              <label className="upv2-label">PDF File</label>
              <div
                className={`upv2-dropzone${dragging ? " upv2-dropzone-drag" : ""}${pdfFile ? " upv2-dropzone-filled" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0] || null);
                }}
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
                {pdfFile ? (
                  <div className="upv2-file-info">
                    <div className="upv2-file-icon">PDF</div>
                    <div className="upv2-file-meta">
                      <p className="upv2-file-name">{pdfFile.name}</p>
                      <p className="upv2-file-size">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      className="upv2-file-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPdfFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="upv2-drop-placeholder">
                    <div className="upv2-drop-icon-wrap">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <p className="upv2-drop-text">
                      Drag & drop your PDF here, or <span className="upv2-drop-link">browse</span>
                    </p>
                    <p className="upv2-drop-hint">PDF only — max 10 MB</p>
                  </div>
                )}
              </div>
              {uploadProgress === "uploading" && (
                <p className="upv2-upload-status">Uploading to Google Drive...</p>
              )}
            </div>

            {error && <p className="upv2-error">{error}</p>}
            {success && <p className="upv2-success">{success}</p>}

            <div className="upv2-actions">
              <button
                type="button"
                className="upv2-clear-btn"
                onClick={resetForm}
                disabled={loading}
              >
                Clear
              </button>
              <button
                type="submit"
                className="upv2-submit-btn"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Document"}
              </button>
            </div>

          </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
