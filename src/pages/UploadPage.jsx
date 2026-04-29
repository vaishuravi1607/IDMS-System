import { useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Layout from "../components/Layout";
import { db } from "../firebase";

const DEPARTMENT_OPTIONS = ["ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];

const TYPE_OPTIONS = [
  { value: "MEMO", label: "Memo", color: "blue" },
  { value: "SURAT", label: "Surat", color: "peach" },
  { value: "UTUSAN", label: "Utusan", color: "gray" },
];

export default function UploadPage() {
  const [refNo, setRefNo] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [direction] = useState("incoming");
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
      <div className="upv3-page">
        <div className="upv3-container">

          {/* ── Banner Card (separate) ─────────── */}
          <div className="upv3-banner-card">
            <div className="upv3-banner-left">
              <div className="upv3-banner-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="upv3-banner-text">
                <h1 className="upv3-banner-title">Upload Page</h1>
                <p className="upv3-banner-subtitle">drag and drop or select to upload file</p>
              </div>
            </div>

            {/* Decorative illustration */}
            <div className="upv3-banner-illustration" aria-hidden="true">
              <svg viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Folder back */}
                <path d="M30 28 L30 72 Q30 78 36 78 L96 78 Q102 78 102 72 L102 36 Q102 30 96 30 L62 30 L56 24 L36 24 Q30 24 30 28 Z" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.5"/>
                {/* Document sheet */}
                <rect x="50" y="20" width="48" height="60" rx="3" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5"/>
                <line x1="58" y1="32" x2="90" y2="32" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
                <line x1="58" y1="40" x2="86" y2="40" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
                <line x1="58" y1="48" x2="90" y2="48" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
                <line x1="58" y1="56" x2="80" y2="56" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
                {/* Folder front */}
                <path d="M30 38 L102 38 L110 72 Q111 78 105 78 L33 78 Q27 78 28 72 L30 38 Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5"/>
                {/* Sparkle */}
                <path d="M22 18 L24 22 L28 24 L24 26 L22 30 L20 26 L16 24 L20 22 Z" fill="#22c55e"/>
              </svg>
            </div>
          </div>

          {/* ── Form Card (separate) ───────────── */}
          <div className="upv3-card">
            <form onSubmit={handleSubmit} className="upv3-form">

              {/* Reference No. */}
              <div className="upv3-row">
                <div className="upv3-row-icon upv3-icon-blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="upv3-row-label">Ref. No.</div>
                <div className="upv3-row-colon">:</div>
                <div className="upv3-row-field">
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="upv3-input"
                    placeholder="Enter Reference Number"
                    disabled={loading}
                  />
                </div>
                <div className="upv3-row-asterisk">*</div>
              </div>

              {/* Title */}
              <div className="upv3-row">
                <div className="upv3-row-icon upv3-icon-green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7V4h16v3"/>
                    <path d="M9 20h6"/>
                    <path d="M12 4v16"/>
                  </svg>
                </div>
                <div className="upv3-row-label">Title</div>
                <div className="upv3-row-colon">:</div>
                <div className="upv3-row-field">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="upv3-input"
                    placeholder="Enter Document Title"
                    disabled={loading}
                  />
                </div>
                <div className="upv3-row-asterisk">*</div>
              </div>

              {/* Type */}
              <div className="upv3-row">
                <div className="upv3-row-icon upv3-icon-purple">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="upv3-row-label">Type</div>
                <div className="upv3-row-colon">:</div>
                <div className="upv3-row-field">
                  <div className="upv3-type-buttons">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`upv3-type-btn upv3-type-${opt.color}${type === opt.value ? " active" : ""}`}
                        onClick={() => setType(opt.value)}
                        disabled={loading}
                      >
                        {opt.color === "blue" && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        )}
                        {opt.color === "peach" && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        )}
                        {opt.color === "gray" && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="upv3-row-asterisk">*</div>
              </div>

              {/* File */}
              <div className="upv3-row">
                <div className="upv3-row-icon upv3-icon-peach">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                  </svg>
                </div>
                <div className="upv3-row-label">File</div>
                <div className="upv3-row-colon">:</div>
                <div className="upv3-row-field">
                  <div
                    className={`upv3-dropzone${dragging ? " upv3-dropzone-drag" : ""}`}
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
                    <div className="upv3-dropzone-cloud">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                        <polyline points="16 16 12 12 8 16"/>
                        <line x1="12" y1="12" x2="12" y2="21"/>
                      </svg>
                    </div>
                    {pdfFile ? (
                      <div className="upv3-file-info">
                        <div className="upv3-file-meta">
                          <p className="upv3-file-name">{pdfFile.name}</p>
                          <p className="upv3-file-size">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          className="upv3-file-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="upv3-dropzone-text">
                        <p className="upv3-dropzone-main">
                          Drag &amp; drop your file here or <span className="upv3-dropzone-link">browse</span>
                        </p>
                        <p className="upv3-dropzone-hint">PDF only — Max 10MB</p>
                      </div>
                    )}
                  </div>
                  {uploadProgress === "uploading" && (
                    <p className="upv3-upload-status">Uploading to Google Drive...</p>
                  )}
                </div>
                <div className="upv3-row-asterisk">*</div>
              </div>

              {/* Department */}
              <div className="upv3-row upv3-row-dept">
                <div className="upv3-row-icon upv3-icon-pink">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="upv3-row-label">Department</div>
                <div className="upv3-row-colon">:</div>
                <div className="upv3-row-field">
                  <div className="upv3-dept-grid">
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <label
                        key={dept}
                        className={`upv3-dept-card${departments.includes(dept) ? " active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="upv3-dept-checkbox"
                          checked={departments.includes(dept)}
                          onChange={() => toggleDepartment(dept)}
                          disabled={loading}
                        />
                        <span>{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="upv3-row-asterisk">*</div>
              </div>

              {/* Messages */}
              {error && <p className="upv3-error">{error}</p>}
              {success && <p className="upv3-success">{success}</p>}

              {/* Info note line */}
              <div className="upv3-info-note">
                <div className="upv3-info-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <span>Ensure all documents are scanned clearly and contain valid reference details.</span>
              </div>

              {/* Full-width Submit Button */}
              <button
                type="submit"
                className="upv3-submit-btn"
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>{loading ? "Uploading..." : "Upload Document"}</span>
                {!loading && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}