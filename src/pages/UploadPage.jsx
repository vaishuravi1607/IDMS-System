import { useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Layout from "../components/Layout";
import { db } from "../firebase";

const departmentOptions = ["ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];

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

  const fileInputRef = useRef(null);

  const detectTypeFromName = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes("memo")) return "MEMO";
    if (name.includes("surat")) return "SURAT";
    if (name.includes("utusan")) return "UTUSAN";
    if (name.includes("email")) return "EMAIL";
    return null;
  };

  const toggleDepartment = (department) => {
    setDepartments((prev) =>
      prev.includes(department)
        ? prev.filter((item) => item !== department)
        : [...prev, department]
    );
  };

  const resetForm = () => {
    setRefNo("");
    setTitle("");
    setType("");
    setPdfFile(null);
    setUploadProgress("");
    setDepartments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!refNo.trim() || !title.trim() || !type.trim()) {
      setError("Please complete Ref. No., Title and Type.");
      return;
    }

    if (departments.length === 0) {
      setError("Please select at least one department.");
      return;
    }

    if (!pdfFile) {
      setError("Please select a PDF file.");
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

      setSuccess("Document uploaded successfully.");
      resetForm();
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
      <div className="upload-page-screen">
        <div className="upload-page-title-row">
          <h1 className="upload-page-title">Upload Data</h1>
        </div>

        <div className="upload-page-divider"></div>

        <div className="upload-card">
          <form onSubmit={handleSubmit} className="upload-form-exact">

            <div className="upload-form-row">
              <label className="upload-form-label">Ref. No.</label>
              <span className="upload-form-colon">:</span>
              <div className="upload-form-field">
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  className="upload-blue-input"
                />
              </div>
            </div>

            <div className="upload-form-row">
              <label className="upload-form-label">Title</label>
              <span className="upload-form-colon">:</span>
              <div className="upload-form-field">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="upload-blue-input"
                />
              </div>
            </div>

            <div className="upload-form-row">
              <label className="upload-form-label">Direction</label>
              <span className="upload-form-colon">:</span>
              <div className="upload-form-field">
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="upload-blue-input"
                >
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </select>
              </div>
            </div>

            <div className="upload-form-row">
              <label className="upload-form-label">Type</label>
              <span className="upload-form-colon">:</span>
              <div className="upload-form-field">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="upload-blue-input"
                >
                  <option value="">Select type</option>
                  <option value="MEMO">MEMO</option>
                  <option value="SURAT">SURAT</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="UTUSAN">UTUSAN</option>
                </select>
              </div>
            </div>

            <div className="upload-form-row">
              <label className="upload-form-label">File</label>
              <span className="upload-form-colon">:</span>
              <div className="upload-form-field">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPdfFile(file);
                    setError("");
                    if (file) {
                      const detected = detectTypeFromName(file.name);
                      if (detected) setType(detected);
                    }
                  }}
                  className="upload-blue-input"
                  disabled={loading}
                />
                {pdfFile && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#333" }}>
                    {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                {uploadProgress === "uploading" && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#1a56db" }}>
                    Uploading to Google Drive...
                  </p>
                )}
              </div>
            </div>

            <div className="upload-form-row upload-dept-row">
              <label className="upload-form-label">Department</label>
              <span className="upload-form-colon">:</span>
              <div className="upload-form-field">
                <div className="upload-department-grid">
                  {departmentOptions.map((department) => (
                    <label key={department} className="upload-checkbox-item">
                      <input
                        type="checkbox"
                        checked={departments.includes(department)}
                        onChange={() => toggleDepartment(department)}
                      />
                      <span>{department}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {(error || success) && (
              <div className="upload-message-row">
                {error && <p className="error-paragraph">{error}</p>}
                {success && <p className="success-paragraph">{success}</p>}
              </div>
            )}

            <div className="upload-submit-row">
              <button
                type="submit"
                className="upload-submit-btn"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}
