import { describe, it, expect } from "vitest";
import { nameToColor, nameToInitial } from "../js/avatar.js";

describe("nameToColor", () => {
  it("is deterministic for the same name", () => {
    expect(nameToColor("Jay")).toBe(nameToColor("Jay"));
  });

  it("returns an hsl() color string", () => {
    expect(nameToColor("Jay")).toMatch(/^hsl\(\d+, 65%, 50%\)$/);
  });

  it("falls back to a default for an empty name", () => {
    expect(nameToColor("")).toBe(nameToColor("Player"));
  });
});

describe("nameToInitial", () => {
  it("returns the uppercased first letter", () => {
    expect(nameToInitial("jay")).toBe("J");
  });

  it("trims whitespace before taking the initial", () => {
    expect(nameToInitial("  maya")).toBe("M");
  });

  it("returns a placeholder for an empty name", () => {
    expect(nameToInitial("")).toBe("?");
  });
});
