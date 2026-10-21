import { describe, expect, it } from "vitest";
import { budgetFor, starsFor } from "../../src/game/scoring.ts";
import type { PuzzleDef } from "../../src/content/types.ts";

const puzzle = {
  id: "test-puzzle",
  title: "Test",
  robotName: "TEST-1",
  concept: "Insert",
  role: "introductory",
  start: ["move()"],
  cursor: { line: 0, col: 5 },
  target: ["move(1)"],
  optimal: "i1<Esc>",
  helper: "Use insert.",
  hints: ["Use i.", "Type one."],
  scene: {
    tiles: ["..P"],
    robotStart: { x: 0, y: 0, facing: "E" },
    objective: { text: "Move", conditions: [{ robotAt: { x: 2, y: 0 } }] },
  },
} satisfies PuzzleDef;

describe("scoring", () => {
  it("derives all thresholds from parsed Optimal length", () => {
    expect(budgetFor(puzzle)).toEqual({ three: 3, two: 4, pass: 7 });
  });

  it("caps a hinted solve at two Stars", () => {
    expect(starsFor(3, budgetFor(puzzle), true)).toBe(2);
  });
});
