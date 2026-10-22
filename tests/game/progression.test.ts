import { describe, expect, it } from "vitest";
import { chapters } from "../../src/content/chapters.ts";
import { puzzlesForChapter } from "../../src/content/index.ts";
import { freshSave, recordSolve } from "../../src/game/persistence.ts";
import { chapterUnlocked } from "../../src/game/progression.ts";

describe("progression", () => {
  it("requires the previous Chapter Test-Out Puzzle", () => {
    const firstChapter = chapters[0]!;
    const secondChapter = chapters[1]!;
    const regularPuzzles = puzzlesForChapter(firstChapter.id).filter(
      (puzzle) => puzzle.role !== "test-out",
    );
    const saveWithRegularPuzzles = regularPuzzles.reduce(
      (save, puzzle) => recordSolve(save, puzzle.id, 1, 3, false),
      freshSave(),
    );

    expect(chapterUnlocked(secondChapter.id, saveWithRegularPuzzles)).toBe(
      false,
    );

    const saveWithTestOut = {
      ...saveWithRegularPuzzles,
      passedTestOuts: [firstChapter.id],
    };
    expect(chapterUnlocked(secondChapter.id, saveWithTestOut)).toBe(true);
  });
});
