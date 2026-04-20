const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.resetPasswordWithSecurityQA = functions
  .region("asia-southeast1")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 15,
    maxInstances: 1,
  })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
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

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
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