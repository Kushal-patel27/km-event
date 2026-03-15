import admin from "firebase-admin";
import fs from "fs";

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

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (json) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(json);
    } catch (err) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON: ${err.message}. Ensure the value is a properly formatted service account object.`
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
      serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));
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
