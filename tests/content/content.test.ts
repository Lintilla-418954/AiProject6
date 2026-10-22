import { describe, expect, it } from "vitest";
import { concepts } from "../../src/content/curriculum.ts";
import { puzzles } from "../../src/content/index.ts";
import { validateContent } from "../../src/content/validate.ts";
import type { PuzzleDef } from "../../src/content/types.ts";

const regularPuzzles = puzzles.filter((puzzle) => puzzle.role !== "test-out");

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
