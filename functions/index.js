const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

const DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function allowedCorsOrigins() {
  const extra = process.env.IDMS_ALLOWED_ORIGINS
    ? process.env.IDMS_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return [...DEFAULT_CORS_ORIGINS, ...extra];
}

function corsOrigin(req) {
  const origin = req.get("Origin");
  const list = allowedCorsOrigins();
  if (origin && list.includes(origin)) return origin;
  return list.length ? list[0] : null;
}

function assertStrongPassword(pw) {
  if (typeof pw !== "string" || pw.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Z]/.test(pw) || !/\d/.test(pw)) {
    return "Password needs at least one uppercase letter and one number.";
  }
  return null;
}

exports.resetPasswordWithSecurityQA = functions
  .region("asia-southeast1")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 15,
    maxInstances: 1,
  })
  .https.onRequest(async (req, res) => {
    const allowOrigin = corsOrigin(req);
    if (allowOrigin) res.set("Access-Control-Allow-Origin", allowOrigin);
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { email, securityQuestion, securityAnswer, newPassword } = req.body || {};

      if (!email || !securityQuestion || !securityAnswer || !newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const pwdErr = assertStrongPassword(newPassword);
      if (pwdErr) {
        return res.status(400).json({ error: pwdErr });
      }

      const userRecord = await admin.auth().getUserByEmail(email);
      const userDoc = await db.collection("users").doc(userRecord.uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const userData = userDoc.data() || {};

      const savedQuestion = String(userData.securityQuestion || "").trim();
      const savedAnswer = String(userData.securityAnswer || "").trim().toLowerCase();

      const incomingQuestion = String(securityQuestion || "").trim();
      const incomingAnswer = String(securityAnswer || "").trim().toLowerCase();

      if (savedQuestion !== incomingQuestion) {
        return res.status(403).json({ error: "Security question is incorrect" });
      }

      if (!savedAnswer || savedAnswer !== incomingAnswer) {
        return res.status(403).json({ error: "Security answer is incorrect" });
      }

      await admin.auth().updateUser(userRecord.uid, {
        password: newPassword,
      });

      return res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (err) {
      console.error("resetPasswordWithSecurityQA error:", err);
      return res.status(500).json({
        error: err.message || "Internal server error",
      });
    }
  });