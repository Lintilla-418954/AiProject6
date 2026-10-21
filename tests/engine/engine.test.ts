import { describe, expect, it } from "vitest";
import {
  initialState,
  isSolved,
  parseKeys,
  run,
  step,
} from "../../src/engine/index.ts";

describe("key notation", () => {
  it("counts notation tokens as single keys", () => {
    expect(parseKeys("i3<Esc><C-a>")).toEqual(["i", "3", "<Esc>", "<C-a>"]);
  });
});

describe("engine", () => {
  it("repairs a grid-move Puzzle immutably", () => {
    const initial = initialState(["movee(2)"], { line: 0, col: 0 });
    const result = run(initial, "llllx");
    expect(result.state.lines).toEqual(["move(2)"]);
    expect(initial.lines).toEqual(["movee(2)"]);
  });

  it("inserts and exits in Normal mode", () => {
    const result = run(
      initialState(["move()"], { line: 0, col: 5 }),
      "i3<Esc>",
    );
    expect(isSolved(result.state, ["move(3)"])).toBe(true);
  });

  it("keeps pending operators serializable", () => {
    const result = step(initialState(["junk move(1)"]), "d");
    expect(result.state.pending).toEqual(["d"]);
    expect(JSON.parse(JSON.stringify(result.state)).pending).toEqual(["d"]);
  });
});
