// Initializes Firebase Admin SDK for the MCP server. Unlike the browser
// client (js/multiplayer.js), this runs as a trusted local process using a
// service account key, so it bypasses database.rules.json entirely (Admin
// SDK access is not subject to Realtime Database security rules by design).
// Never expose this service account key or run this server anywhere
// untrusted -- see README "Optional: MCP Server" for setup.

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "node:fs";

let db = null;

export function getDb() {
  if (db) return db;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!serviceAccountPath || !databaseURL) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_DATABASE_URL. " +
      "Copy mcp-server/.env.example to mcp-server/.env and fill in both values " +
      "(see README 'Optional: MCP Server' for how to get them)."
    );
  }

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL,
    });
  }

  db = getDatabase();
  return db;
}
