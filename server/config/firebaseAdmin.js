import admin from "firebase-admin";
import fs from "fs";

function normalizeServiceAccount(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Service account payload is missing or invalid.");
  }

  const serviceAccount = { ...raw };

  if (typeof serviceAccount.private_key === "string") {
    // Common env issue: private key arrives with escaped newlines or wrapped in quotes.
    serviceAccount.private_key = serviceAccount.private_key
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/\\n/g, "\n");
  }

  if (
    !serviceAccount.private_key ||
    !serviceAccount.private_key.includes("-----BEGIN PRIVATE KEY-----") ||
    !serviceAccount.private_key.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "Invalid service account private_key format. Ensure you are using Firebase service-account JSON and preserve PEM markers with newline escapes (\\n)."
    );
  }

  if (!serviceAccount.client_email || !serviceAccount.project_id) {
    throw new Error(
      "Service account is missing required fields (client_email/project_id)."
    );
  }

  return serviceAccount;
}

/**
 * Render-friendly Firebase Admin initialization (singleton).
 *
 * Preferred: set env var FIREBASE_SERVICE_ACCOUNT_JSON to the full service
 * account JSON as a one-line string. This avoids committing secrets.
 *
 * Fallback: set FIREBASE_SERVICE_ACCOUNT_PATH to an absolute file path
 * (useful for local development with the JSON file on disk).
 */
export function getFirebaseAdmin() {
  if (admin.apps?.length) return admin;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

  if (json) {
    let serviceAccount;
    try {
      serviceAccount = normalizeServiceAccount(JSON.parse(json));
    } catch (err) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON is invalid: ${err.message}. Ensure this is the full Firebase service-account JSON (not google-services.json).`
      );
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return admin;
  }

  if (filePath) {
    let serviceAccount;
    try {
      serviceAccount = normalizeServiceAccount(
        JSON.parse(fs.readFileSync(filePath, "utf8"))
      );
    } catch (err) {
      throw new Error(
        `Failed to load Firebase service account from FIREBASE_SERVICE_ACCOUNT_PATH "${filePath}": ${err.message}`
      );
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return admin;
  }

  throw new Error(
    "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (recommended) or FIREBASE_SERVICE_ACCOUNT_PATH."
  );
}
