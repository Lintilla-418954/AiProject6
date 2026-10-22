import { describe, expect, it } from "vitest";
import {
  conceptByName,
  concepts,
  toolkitFor,
} from "../../src/content/curriculum.ts";
import { puzzles } from "../../src/content/index.ts";
import { dockingRingPuzzles } from "../../src/content/puzzles/docking-ring.ts";
import { validateContent } from "../../src/content/validate.ts";
import type { PuzzleDef } from "../../src/content/types.ts";
import {
  initialState,
  isSolved,
  parseKeys,
  run,
} from "../../src/engine/index.ts";
import { simulate } from "../../src/robot/index.ts";

const regularPuzzles = puzzles.filter((puzzle) => puzzle.role !== "test-out");
const roleMinimums = { introductory: 3, integration: 5, advanced: 7 };
const dockingRegular = dockingRingPuzzles.filter(
  (
    puzzle,
  ): puzzle is Extract<
    PuzzleDef,
    { role: "introductory" | "integration" | "advanced" }
  > => puzzle.role !== "test-out",
);
const dockingTestOut = puzzles.find(
  (puzzle): puzzle is Extract<PuzzleDef, { role: "test-out" }> =>
    puzzle.role === "test-out" && puzzle.id === "test-out-docking-ring",
)!;

const traceAliases: Readonly<Record<string, readonly string[]>> = {
  count: [],
  gg: ["gg"],
};

function traceBelongsToToolkit(
  trace: readonly string[],
  toolkit: readonly string[],
): boolean {
  const allowed = new Set(
    toolkit.flatMap((command) => traceAliases[command] ?? [command]),
  );
  return trace.every((command) => allowed.has(command));
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

describe("Docking Ring progression", () => {
  it("grows every Concept by line count and role key minimum", () => {
    for (let index = 0; index < dockingRegular.length; index += 3) {
      const conceptPuzzles = dockingRegular.slice(index, index + 3);
      expect(conceptPuzzles.map((puzzle) => puzzle.role)).toEqual([
        "introductory",
        "integration",
        "advanced",
      ]);
      const lineCounts = conceptPuzzles.map((puzzle) => puzzle.start.length);
      expect(lineCounts[0]).toBeLessThan(lineCounts[1]!);
      expect(lineCounts[1]).toBeLessThan(lineCounts[2]!);
      for (const puzzle of conceptPuzzles)
        expect(parseKeys(puzzle.optimal).length).toBeGreaterThanOrEqual(
          roleMinimums[puzzle.role],
        );
    }
  });

  it("uses the taught Toolkit and features the current Concept", () => {
    for (const puzzle of dockingRegular) {
      const concept = conceptByName.get(puzzle.concept)!;
      const result = run(
        initialState(puzzle.start, puzzle.cursor),
        parseKeys(puzzle.optimal),
      );
      expect(isSolved(result.state, puzzle.target)).toBe(true);
      expect(traceBelongsToToolkit(result.trace, toolkitFor(concept.id))).toBe(
        true,
      );
      expect(
        result.trace.some((command) => concept.commands.includes(command)),
      ).toBe(true);

      if (puzzle.role === "integration" && concept.order > 1) {
        const earlier = new Set(
          concepts
            .filter((candidate) => candidate.order < concept.order)
            .flatMap((candidate) => candidate.commands),
        );
        expect(result.trace.some((command) => earlier.has(command))).toBe(true);
      }

      const tokens = parseKeys(puzzle.optimal);
      for (let length = 0; length < tokens.length; length++)
        expect(
          isSolved(
            run(
              initialState(puzzle.start, puzzle.cursor),
              tokens.slice(0, length),
            ).state,
            puzzle.target,
          ),
        ).toBe(false);
    }
  });

  it("runs every repaired Program and emits complex Advanced actions", () => {
    for (const puzzle of dockingRegular) {
      const start = simulate(puzzle.scene, puzzle.start);
      const target = simulate(puzzle.scene, puzzle.target);
      expect(start.success).toBe(false);
      expect(target.success).toBe(true);
      expect(target.failure).toBeNull();
      expect(target.frames[0]?.event).toBe("Program linked");
      if (puzzle.role === "advanced")
        expect(target.frames.length - 1).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps line-end shortcuts from replacing bracket jumps", () => {
    const bracketPuzzles = dockingRegular.filter(
      (puzzle) => puzzle.concept === "Bracket jump",
    );
    for (const puzzle of bracketPuzzles) {
      const result = run(
        initialState(puzzle.start, puzzle.cursor),
        parseKeys(puzzle.optimal),
      );
      expect(result.trace).toContain("%");
      expect(
        isSolved(
          run(initialState(puzzle.start, puzzle.cursor), "$x").state,
          puzzle.target,
        ),
      ).toBe(false);
    }
  });
});

describe("Docking Ring Test-Out", () => {
  it("is harder than the average Advanced Puzzle and covers every Chapter Concept", () => {
    const tokens = parseKeys(dockingTestOut.optimal);
    const result = run(
      initialState(dockingTestOut.start, dockingTestOut.cursor),
      tokens,
    );
    const advanced = regularPuzzles.filter(
      (puzzle) => puzzle.role === "advanced",
    );
    const advancedAverage =
      advanced.reduce(
        (total, puzzle) => total + parseKeys(puzzle.optimal).length,
        0,
      ) / advanced.length;
    const chapterConcepts = concepts.filter(
      (concept) => concept.chapterId === dockingTestOut.chapter,
    );

    expect(tokens.length).toBeGreaterThanOrEqual(18);
    expect(tokens.length).toBeGreaterThan(advancedAverage);
    expect(isSolved(result.state, dockingTestOut.target)).toBe(true);
    expect(
      traceBelongsToToolkit(
        result.trace,
        toolkitFor(chapterConcepts.at(-1)!.id),
      ),
    ).toBe(true);
    for (const concept of chapterConcepts)
      expect(
        result.trace.some((command) => concept.commands.includes(command)),
      ).toBe(true);
    for (let length = 0; length < tokens.length; length++)
      expect(
        isSolved(
          run(
            initialState(dockingTestOut.start, dockingTestOut.cursor),
            tokens.slice(0, length),
          ).state,
          dockingTestOut.target,
        ),
      ).toBe(false);
  });

  it("runs a complex repaired Program without giving Test-Out guidance", () => {
    const start = simulate(dockingTestOut.scene, dockingTestOut.start);
    const target = simulate(dockingTestOut.scene, dockingTestOut.target);
    const optimalLength = parseKeys(dockingTestOut.optimal).length;

    expect(start.success).toBe(false);
    expect(target.success).toBe(true);
    expect(target.failure).toBeNull();
    expect(target.frames.length - 1).toBeGreaterThanOrEqual(7);
    expect(dockingTestOut.helper).toBe("");
    expect(dockingTestOut.hints).toEqual([]);
    expect(optimalLength).toBeLessThanOrEqual(dockingTestOut.budget.two);
    expect(dockingTestOut.budget.two).toBeLessThan(dockingTestOut.budget.pass);
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
