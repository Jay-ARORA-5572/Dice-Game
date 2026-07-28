import { test } from "node:test";
import assert from "node:assert";
import {
  getClaudeDesktopConfigPath,
  parseEnvFile,
  mergeMcpServerConfig,
} from "../lib/desktopConfig.js";

test("getClaudeDesktopConfigPath resolves the macOS path", () => {
  const p = getClaudeDesktopConfigPath({ platform: "darwin", homedir: "/Users/jay" });
  assert.strictEqual(p, "/Users/jay/Library/Application Support/Claude/claude_desktop_config.json");
});

test("getClaudeDesktopConfigPath resolves the Windows path using APPDATA", () => {
  const p = getClaudeDesktopConfigPath({
    platform: "win32",
    homedir: "C:\\Users\\jay",
    appData: "C:\\Users\\jay\\AppData\\Roaming",
  });
  assert.strictEqual(p, "C:\\Users\\jay\\AppData\\Roaming\\Claude\\claude_desktop_config.json");
});

test("getClaudeDesktopConfigPath falls back to homedir-based AppData on Windows if APPDATA is unset", () => {
  const p = getClaudeDesktopConfigPath({ platform: "win32", homedir: "C:\\Users\\jay", appData: undefined });
  assert.strictEqual(p, "C:\\Users\\jay\\AppData\\Roaming\\Claude\\claude_desktop_config.json");
});

test("getClaudeDesktopConfigPath resolves the Linux path", () => {
  const p = getClaudeDesktopConfigPath({ platform: "linux", homedir: "/home/jay" });
  assert.strictEqual(p, "/home/jay/.config/Claude/claude_desktop_config.json");
});

test("parseEnvFile parses simple KEY=value lines", () => {
  const env = parseEnvFile("FOO=bar\nBAZ=qux\n");
  assert.deepStrictEqual(env, { FOO: "bar", BAZ: "qux" });
});

test("parseEnvFile ignores blank lines and comments", () => {
  const env = parseEnvFile("# a comment\n\nFOO=bar\n  # another\nBAZ=qux");
  assert.deepStrictEqual(env, { FOO: "bar", BAZ: "qux" });
});

test("parseEnvFile strips matching surrounding quotes", () => {
  const env = parseEnvFile('FOO="bar baz"\nQUX=\'quux\'');
  assert.deepStrictEqual(env, { FOO: "bar baz", QUX: "quux" });
});

test("mergeMcpServerConfig adds a dicee entry to an empty config", () => {
  const { config, alreadyExists } = mergeMcpServerConfig(
    {},
    { indexPath: "/path/to/index.js", serviceAccountPath: "/path/to/key.json", databaseUrl: "https://db" }
  );
  assert.strictEqual(alreadyExists, false);
  assert.deepStrictEqual(config.mcpServers.dicee, {
    command: "node",
    args: ["/path/to/index.js"],
    env: {
      FIREBASE_SERVICE_ACCOUNT_PATH: "/path/to/key.json",
      FIREBASE_DATABASE_URL: "https://db",
    },
  });
});

test("mergeMcpServerConfig preserves other existing MCP servers", () => {
  const existing = { mcpServers: { otherTool: { command: "python", args: ["other.py"] } } };
  const { config } = mergeMcpServerConfig(existing, {
    indexPath: "/path/index.js",
    serviceAccountPath: "/path/key.json",
    databaseUrl: "https://db",
  });
  assert.deepStrictEqual(config.mcpServers.otherTool, { command: "python", args: ["other.py"] });
  assert.ok(config.mcpServers.dicee);
});

test("mergeMcpServerConfig reports alreadyExists true when overwriting a prior dicee entry", () => {
  const existing = { mcpServers: { dicee: { command: "node", args: ["old.js"] } } };
  const { config, alreadyExists } = mergeMcpServerConfig(existing, {
    indexPath: "/path/new.js",
    serviceAccountPath: "/path/key.json",
    databaseUrl: "https://db",
  });
  assert.strictEqual(alreadyExists, true);
  assert.strictEqual(config.mcpServers.dicee.args[0], "/path/new.js");
});
