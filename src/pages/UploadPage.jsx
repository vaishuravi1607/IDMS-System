import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Layout from "../components/Layout";
import { db } from "../firebase";

const departmentOptions = ["ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];

export default function UploadPage() {
  const [refNo, setRefNo] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [direction] = useState("incoming"); // fixed (no need to change)
  const [fileUrl, setFileUrl] = useState("");
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
    setFileUrl("");
    setDepartments([]);
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

    try {
      setLoading(true);

      await addDoc(collection(db, "documents"), {
        refNo: refNo.trim(),
        title: title.trim(),
        type: type.trim(),
        direction,
        fileUrl: fileUrl.trim(),
        department: departments.join(", "),
        departments,
        createdAt: serverTimestamp(),
      });

      setSuccess("Document uploaded successfully.");
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Failed to upload document.");
    } finally {
      setLoading(false);
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

            {/* REF NO */}
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

            {/* TITLE */}
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

            {/* TYPE */}
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

            {/* FILE URL */}
            <div className="upload-form-row">
              <label className="upload-form-label">File</label>
              <span className="upload-form-colon">:</span>
              <div className="upload-form-field">
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="Paste file URL"
                  className="upload-blue-input"
                />
              </div>
            </div>

            {/* DEPARTMENTS */}
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

            {/* MESSAGE */}
            {(error || success) && (
              <div className="upload-message-row">
                {error && <p className="error-paragraph">{error}</p>}
                {success && <p className="success-paragraph">{success}</p>}
              </div>
            )}

            {/* SUBMIT */}
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