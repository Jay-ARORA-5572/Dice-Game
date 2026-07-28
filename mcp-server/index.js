#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createRoom,
  joinRoom,
  getRoomState,
  rollDice,
  playAgain,
  getLeaderboard,
} from "./lib/gameActions.js";

export function buildServer() {
  const server = new McpServer({
    name: "dicee-mcp-server",
    version: "1.0.0",
  });

function textResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function errorResult(error) {
  return {
    content: [{ type: "text", text: `Error: ${error.message}` }],
    isError: true,
  };
}

server.registerTool(
  "create_room",
  {
    title: "Create a Dicee room",
    description:
      "Creates a new online Dicee match room and returns a room code. " +
      "The room starts with only player1 (the host) seated -- call join_room " +
      "to seat player2 before rolling.",
    inputSchema: {
      hostName: z.string().describe("Display name for player1 (the host)."),
      diceCount: z.number().int().min(1).max(3).optional()
        .describe("Dice rolled per player each round (1-3). Defaults to 1."),
      matchTarget: z.number().int().min(1).max(10).optional()
        .describe("Round wins needed to win the match. Defaults to 3."),
    },
  },
  async ({ hostName, diceCount, matchTarget }) => {
    try {
      const result = await createRoom({ hostName, diceCount, matchTarget });
      return textResult(result);
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "join_room",
  {
    title: "Join a Dicee room",
    description: "Seats player2 in an existing room using its room code.",
    inputSchema: {
      roomCode: z.string().describe("The room code to join."),
      guestName: z.string().describe("Display name for player2 (the guest)."),
    },
  },
  async ({ roomCode, guestName }) => {
    try {
      const result = await joinRoom({ roomCode, guestName });
      return textResult(result);
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "roll_dice",
  {
    title: "Roll the dice",
    description:
      "Rolls dice for one player in a room (the room's configured dice count). " +
      "Once both player1 and player2 have rolled, the round is resolved " +
      "automatically -- score updated, and matchWinner set if the match target " +
      "is reached.",
    inputSchema: {
      roomCode: z.string().describe("The room code."),
      playerKey: z.enum(["player1", "player2"]).describe("Which seat is rolling."),
    },
  },
  async ({ roomCode, playerKey }) => {
    try {
      const result = await rollDice({ roomCode, playerKey });
      return textResult(result);
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "get_room_state",
  {
    title: "Check a Dicee room's state",
    description:
      "Returns the full current state of a room: players, whose turn it is, " +
      "current rolls, score, and match winner if the match is over.",
    inputSchema: {
      roomCode: z.string().describe("The room code to check."),
    },
  },
  async ({ roomCode }) => {
    try {
      const result = await getRoomState({ roomCode });
      return textResult(result);
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "play_again",
  {
    title: "Start a new match in the same room",
    description:
      "Resets the score and rolls in an existing room so the same two " +
      "players can start a new match without a new room code.",
    inputSchema: {
      roomCode: z.string().describe("The room code to reset."),
    },
  },
  async ({ roomCode }) => {
    try {
      const result = await playAgain({ roomCode });
      return textResult(result);
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "get_leaderboard",
  {
    title: "Check the Dicee leaderboard",
    description:
      "Returns the most recent completed matches across all Dicee rooms " +
      "(winner, final score, and date), most recent first.",
    inputSchema: {
      limit: z.number().int().min(1).max(50).optional()
        .describe("How many recent matches to return. Defaults to 10."),
    },
  },
  async ({ limit }) => {
    try {
      const result = await getLeaderboard({ limit });
      return textResult(result);
    } catch (e) {
      return errorResult(e);
    }
  }
);

  return server;
}

async function main() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dicee MCP server running on stdio.");
}

// Only run main() when executed directly (not when imported for testing).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error starting Dicee MCP server:", error);
    process.exit(1);
  });
}
