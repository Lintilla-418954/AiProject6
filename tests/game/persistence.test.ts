import { describe, expect, it } from "vitest";
import {
  freshSave,
  parseSave,
  recordSolve,
} from "../../src/game/persistence.ts";

describe("persistence", () => {
  it("rejects malformed saves", () => {
    expect(parseSave('{"version":2}')).toBeNull();
  });

  it("tracks best metrics independently", () => {
    let save = recordSolve(freshSave(), "p", 12, 3, true);
    save = recordSolve(save, "p", 8, 2, false);
    expect(save.puzzleResults.p).toMatchObject({
      bestKeystrokes: 8,
      bestStars: 3,
      solvedWithoutHint: true,
    });
  });
});
