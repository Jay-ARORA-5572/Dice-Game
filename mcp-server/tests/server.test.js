import { test } from "node:test";
import assert from "node:assert";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../index.js";

test("registers all 6 expected tools with valid schemas", async () => {
  const server = buildServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });

  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();

  assert.deepStrictEqual(names, [
    "create_room",
    "get_leaderboard",
    "get_room_state",
    "join_room",
    "play_again",
    "roll_dice",
  ]);

  tools.forEach((tool) => {
    assert.ok(tool.description && tool.description.length > 0, `${tool.name} should have a description`);
  });

  await client.close();
});
