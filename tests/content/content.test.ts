import { describe, expect, it } from "vitest";
import { concepts } from "../../src/content/curriculum.ts";
import { puzzles } from "../../src/content/index.ts";
import { validateContent } from "../../src/content/validate.ts";
import type { PuzzleDef } from "../../src/content/types.ts";
import {
  initialState,
  isSolved,
  parseKeys,
  run,
  step,
  type Snapshot,
} from "../../src/engine/index.ts";
import { simulate } from "../../src/robot/index.ts";

const regularPuzzles = puzzles.filter((puzzle) => puzzle.role !== "test-out");
const gridMoveKeys = ["h", "j", "k", "l", "x"] as const;

function hasShorterGridMoveSolution(puzzle: PuzzleDef): boolean {
  const optimalLength = parseKeys(puzzle.optimal).length;
  const hash = (state: Snapshot) =>
    [
      state.lines.join("\n"),
      state.cursor.line,
      state.cursor.col,
      state.mode,
      state.pending.join(""),
    ].join("\u0001");
  const initial = initialState(puzzle.start, puzzle.cursor);
  let frontier = [initial];
  const seen = new Set([hash(initial)]);

  for (let depth = 0; depth < optimalLength - 1; depth++) {
    const next: Snapshot[] = [];
    for (const state of frontier) {
      for (const token of gridMoveKeys) {
        const candidate = step(state, token).state;
        if (isSolved(candidate, puzzle.target)) return true;
        const key = hash(candidate);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push(candidate);
      }
    }
    frontier = next;
  }
  return false;
}

describe("production content", () => {
  it("contains three regular Puzzles per Concept and five Test-Outs", () => {
    expect(puzzles).toHaveLength(98);
    expect(regularPuzzles).toHaveLength(93);
    expect(puzzles.filter((puzzle) => puzzle.role === "test-out")).toHaveLength(
      5,
    );
  });

  it("orders every Concept as Introductory, Integration, then Advanced", () => {
    for (const concept of concepts) {
      expect(
        regularPuzzles
          .filter((puzzle) => puzzle.concept === concept.name)
          .map((puzzle) => puzzle.role),
      ).toEqual(["introductory", "integration", "advanced"]);
    }
  });

  it("makes most Advanced Puzzles multiline", () => {
    const advanced = regularPuzzles.filter(
      (puzzle) => puzzle.role === "advanced",
    );
    expect(
      advanced.filter(
        (puzzle) => puzzle.start.length > 1 || puzzle.target.length > 1,
      ).length,
    ).toBeGreaterThan(advanced.length / 2);
  });

  it("passes structural, progression, and Scene validation", () => {
    expect(validateContent(puzzles)).toEqual([]);
  });
});

describe("Grid moves progression", () => {
  const gridMoves = regularPuzzles.filter(
    (puzzle) => puzzle.concept === "Grid moves",
  );

  it("increases line count and meets each role's key minimum", () => {
    expect(gridMoves.map((puzzle) => puzzle.role)).toEqual([
      "introductory",
      "integration",
      "advanced",
    ]);
    expect(gridMoves.map((puzzle) => puzzle.start.length)).toEqual([1, 2, 3]);
    expect(gridMoves.map((puzzle) => parseKeys(puzzle.optimal).length)).toEqual(
      [3, 7, 11],
    );
  });

  it("uses only Grid moves commands and has no shorter Toolkit solution", () => {
    for (const puzzle of gridMoves) {
      const result = run(
        initialState(puzzle.start, puzzle.cursor),
        parseKeys(puzzle.optimal),
      );
      expect(isSolved(result.state, puzzle.target)).toBe(true);
      expect(
        result.trace.every((command) =>
          gridMoveKeys.includes(command as (typeof gridMoveKeys)[number]),
        ),
      ).toBe(true);
      expect(hasShorterGridMoveSolution(puzzle)).toBe(false);
    }
  });

  it("runs repaired programs and maps Advanced actions to Robot language Ticks", () => {
    for (const puzzle of gridMoves) {
      expect(simulate(puzzle.scene, puzzle.start).success).toBe(false);
      expect(simulate(puzzle.scene, puzzle.target).success).toBe(true);
    }

    const advanced = gridMoves.find((puzzle) => puzzle.role === "advanced")!;
    const events = simulate(advanced.scene, advanced.target).frames.map(
      (frame) => frame.event,
    );
    expect(events).toEqual([
      "Program linked",
      "moves",
      "moves",
      "turns right",
      "moves",
      "moves",
    ]);
    expect(events.length - 1).toBeGreaterThanOrEqual(4);
  });
});

describe("curriculum validation", () => {
  it("rejects a Concept whose roles are out of order", () => {
    const reordered = [...puzzles];
    [reordered[0], reordered[1]] = [reordered[1]!, reordered[0]!];

    expect(validateContent(reordered)).toContainEqual({
      puzzleId: "grid-moves",
      message:
        "Regular Puzzles must be ordered introductory, integration, advanced",
    });
  });

  it("rejects duplicate and trivially renamed repairs", () => {
    const source = regularPuzzles[0]!;
    const duplicate: PuzzleDef = {
      ...source,
      id: "renamed-repair",
      title: "Renamed repair",
      start: source.start,
      target: source.target,
    };

    expect(validateContent([...puzzles, duplicate])).toContainEqual({
      puzzleId: duplicate.id,
      message: `Repair is too similar to ${source.id}`,
    });
  });

  it("rejects Integration traces without an earlier Concept", () => {
    const integrationIndex = puzzles.findIndex(
      (puzzle) =>
        puzzle.role === "integration" && puzzle.concept === "Word hops",
    );
    const integration = puzzles[integrationIndex]!;
    const invalid = {
      ...integration,
      start: ["move(1) junk"],
      cursor: { line: 0, col: 0 },
      target: ["junk"],
      optimal: "w",
    };
    const changed = [...puzzles];
    changed[integrationIndex] = invalid;

    expect(validateContent(changed)).toContainEqual({
      puzzleId: integration.id,
      message:
        "Integration trace must use the current Concept and an earlier Concept",
    });
  });
});
