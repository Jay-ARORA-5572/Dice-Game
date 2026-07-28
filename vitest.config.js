import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The MCP server (mcp-server/) is a separate Node subproject with its
    // own package.json and its own test runner (node --test, see
    // mcp-server/package.json) -- exclude it here so `npm test` at the repo
    // root only runs the browser app's Vitest suite in tests/.
    exclude: ["**/node_modules/**", "mcp-server/**"],
  },
});
