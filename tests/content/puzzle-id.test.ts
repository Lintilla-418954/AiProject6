import { describe, expect, it } from "vitest";
import { parsePuzzleId, puzzles } from "../../src/content/index.ts";

describe("parsePuzzleId", () => {
  it("accepts an authored puzzle ID", () => {
    expect(parsePuzzleId(puzzles[0]!.id)).toBe(puzzles[0]!.id);
  });

  it("rejects an unknown puzzle ID", () => {
    expect(parsePuzzleId("not-a-puzzle")).toBeNull();
  });
});
