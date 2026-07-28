#!/usr/bin/env node
// One-time setup: writes/merges the "dicee" MCP server entry into Claude
// Desktop's config file, so it's available automatically every time Claude
// Desktop runs -- no manual JSON editing required.
//
// This still can't do the parts that require your own accounts/machine:
//   1. Generating a Firebase service account key (your Firebase console)
//   2. Filling in mcp-server/.env with that key's path + your database URL
//   3. Restarting Claude Desktop afterward
// This script handles everything else.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getClaudeDesktopConfigPath,
  parseEnvFile,
  mergeMcpServerConfig,
} from "./lib/desktopConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function main() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    fail(
      "mcp-server/.env not found.\n" +
      "Copy .env.example to .env and fill in FIREBASE_SERVICE_ACCOUNT_PATH and " +
      "FIREBASE_DATABASE_URL first (see README \"Optional: MCP Server\", steps 1-4), " +
      "then run this script again."
    );
  }

  const env = parseEnvFile(fs.readFileSync(envPath, "utf8"));
  const missing = ["FIREBASE_SERVICE_ACCOUNT_PATH", "FIREBASE_DATABASE_URL"].filter((k) => !env[k]);
  if (missing.length > 0) {
    fail(`mcp-server/.env is missing: ${missing.join(", ")}. Fill these in, then run this script again.`);
  }

  let serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!path.isAbsolute(serviceAccountPath)) {
    serviceAccountPath = path.resolve(__dirname, serviceAccountPath);
  }
  if (!fs.existsSync(serviceAccountPath)) {
    fail(
      `Service account file not found at: ${serviceAccountPath}\n` +
      "Double check FIREBASE_SERVICE_ACCOUNT_PATH in mcp-server/.env points to your downloaded key file."
    );
  }

  if (!fs.existsSync(path.join(__dirname, "node_modules"))) {
    fail('Dependencies not installed yet. Run "npm install" in mcp-server/ first, then run this script again.');
  }

  const indexPath = path.join(__dirname, "index.js");
  const configPath = getClaudeDesktopConfigPath({
    platform: os.platform(),
    homedir: os.homedir(),
    appData: process.env.APPDATA,
  });

  let existingConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      fail(
        `Couldn't parse existing Claude Desktop config at:\n  ${configPath}\n` +
        `(${e.message})\n` +
        "Please fix or back up that file manually, then run this script again."
      );
    }
  } else {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }

  const { config, alreadyExists } = mergeMcpServerConfig(existingConfig, {
    indexPath,
    serviceAccountPath,
    databaseUrl: env.FIREBASE_DATABASE_URL,
  });

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");

  console.log(`\n✅ ${alreadyExists ? "Updated" : "Added"} the "dicee" MCP server in:\n   ${configPath}\n`);
  console.log("Next: quit and reopen Claude Desktop completely (not just close the window) to pick it up.");
  console.log('Then try: "Create a Dicee room called TestRoom for a player named Ada, then roll for player1"\n');
}

main();
