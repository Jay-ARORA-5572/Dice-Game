import path from "node:path";

/**
 * Returns the platform-specific path to Claude Desktop's config file.
 * Uses path.win32/path.posix explicitly (rather than the ambient path.join)
 * so this is correct for the *target* platform argument, not just whichever
 * OS this code happens to be running on -- important both for real
 * cross-platform correctness and for testing all three branches from a
 * single host OS.
 */
export function getClaudeDesktopConfigPath({ platform, homedir, appData }) {
  if (platform === "darwin") {
    return path.posix.join(homedir, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  if (platform === "win32") {
    const base = appData || path.win32.join(homedir, "AppData", "Roaming");
    return path.win32.join(base, "Claude", "claude_desktop_config.json");
  }
  // linux and other unix-likes
  return path.posix.join(homedir, ".config", "Claude", "claude_desktop_config.json");
}

/**
 * Parses a simple KEY=value .env file's contents into an object.
 * Ignores blank lines and lines starting with #. Strips matching
 * surrounding quotes from values.
 */
export function parseEnvFile(content) {
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

/**
 * Merges a "dicee" MCP server entry into an existing Claude Desktop config
 * object, preserving any other MCP servers already configured there.
 */
export function mergeMcpServerConfig(existingConfig, { indexPath, serviceAccountPath, databaseUrl }) {
  const config = { ...existingConfig };
  config.mcpServers = { ...(config.mcpServers || {}) };

  const alreadyExists = Boolean(config.mcpServers.dicee);

  config.mcpServers.dicee = {
    command: "node",
    args: [indexPath],
    env: {
      FIREBASE_SERVICE_ACCOUNT_PATH: serviceAccountPath,
      FIREBASE_DATABASE_URL: databaseUrl,
    },
  };

  return { config, alreadyExists };
}
