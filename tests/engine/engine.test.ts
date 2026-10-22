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

  it("deletes a final word with dw", () => {
    const initial = initialState(["junk"]);
    const result = run(initial, "dw");

    expect(result.state.lines).toEqual([""]);
    expect(result.state.cursor).toEqual({ line: 0, col: 0, desiredCol: 0 });
    expect(result.state.registers['"']).toEqual({
      text: "junk",
      linewise: false,
    });
    expect(initial.lines).toEqual(["junk"]);
  });

  it("changes a word without consuming following whitespace", () => {
    const result = run(initialState(["one two"]), "cwX<Esc>");

    expect(result.state.lines).toEqual(["X two"]);
    expect(result.state.cursor).toEqual({ line: 0, col: 0, desiredCol: 0 });
    expect(result.state.registers['"']).toEqual({
      text: "one",
      linewise: false,
    });

    const counted = run(initialState(["one two three"]), "c2wX<Esc>");
    expect(counted.state.lines).toEqual(["X three"]);
    expect(counted.state.registers['"']).toEqual({
      text: "one two",
      linewise: false,
    });

    const multiline = run(initialState(["one", "two", "three"]), "c2wX<Esc>");
    expect(multiline.state.lines).toEqual(["X", "three"]);
    expect(multiline.state.registers['"']).toEqual({
      text: "one\ntwo",
      linewise: false,
    });

    const fromWhitespace = run(
      initialState(["one two"], { line: 0, col: 3 }),
      "cwX<Esc>",
    );
    expect(fromWhitespace.state.lines).toEqual(["oneXtwo"]);
    expect(fromWhitespace.state.registers['"']).toEqual({
      text: " ",
      linewise: false,
    });

    const beforeTrailingWhitespace = run(
      initialState(["one ", "two"]),
      "cwX<Esc>",
    );
    expect(beforeTrailingWhitespace.state.lines).toEqual(["X ", "two"]);
    expect(beforeTrailingWhitespace.state.registers['"']).toEqual({
      text: "one",
      linewise: false,
    });

    for (const keys of ["c2wX<Esc>", "2cwX<Esc>"]) {
      const countedAcrossBlankLines = run(initialState(["one", "", "t"]), keys);
      expect(countedAcrossBlankLines.state.lines).toEqual(["X"]);
      expect(countedAcrossBlankLines.state.registers['"']).toEqual({
        text: "one\n\nt",
        linewise: false,
      });
    }
  });

  it("deletes an inclusive backward bracket match", () => {
    const result = run(initialState(["a(b)c"], { line: 0, col: 3 }), "d%");

    expect(result.state.lines).toEqual(["ac"]);
    expect(result.state.cursor).toEqual({ line: 0, col: 1, desiredCol: 1 });
    expect(result.state.registers['"']).toEqual({
      text: "(b)",
      linewise: false,
    });
  });

  it("resolves operator spans across line boundaries", () => {
    const forwardExclusive = run(initialState(["one", "two"]), "dw");
    expect(forwardExclusive.state.lines).toEqual(["", "two"]);
    expect(forwardExclusive.state.registers['"']).toEqual({
      text: "one",
      linewise: false,
    });

    const beforeIndentedWord = run(
      initialState(["one", "  two", "three"]),
      "dw",
    );
    expect(beforeIndentedWord.state.lines).toEqual(["", "  two", "three"]);
    expect(beforeIndentedWord.state.registers['"']).toEqual({
      text: "one",
      linewise: false,
    });

    const acrossBlankLines = run(initialState(["one", "", "two"]), "dw");
    expect(acrossBlankLines.state.lines).toEqual(["", "", "two"]);
    expect(acrossBlankLines.state.registers['"']).toEqual({
      text: "one",
      linewise: false,
    });

    const beforeFinalCharacter = run(initialState(["one", "", "t"]), "dw");
    expect(beforeFinalCharacter.state.lines).toEqual(["", "", "t"]);
    expect(beforeFinalCharacter.state.registers['"']).toEqual({
      text: "one",
      linewise: false,
    });

    for (const keys of ["d2w", "2dw"]) {
      const countedAcrossBlankLines = run(initialState(["one", "", "t"]), keys);
      expect(countedAcrossBlankLines.state.lines).toEqual(["t"]);
      expect(countedAcrossBlankLines.state.registers['"']).toEqual({
        text: "one\n\n",
        linewise: false,
      });
    }

    const backwardExclusive = run(
      initialState(["one", "two"], { line: 1, col: 0 }),
      "db",
    );
    expect(backwardExclusive.state.lines).toEqual(["two"]);
    expect(backwardExclusive.state.registers['"']).toEqual({
      text: "one\n",
      linewise: false,
    });

    const forwardInclusive = run(
      initialState(["abc", "def", "ghi"], { line: 0, col: 1 }),
      "d2$",
    );
    expect(forwardInclusive.state.lines).toEqual(["a", "ghi"]);
    expect(forwardInclusive.state.registers['"']).toEqual({
      text: "bc\ndef",
      linewise: false,
    });

    const backwardInclusive = run(
      initialState(["a(", "b", ")c"], { line: 2, col: 0 }),
      "d%",
    );
    expect(backwardInclusive.state.lines).toEqual(["ac"]);
    expect(backwardInclusive.state.registers['"']).toEqual({
      text: "(\nb\n)",
      linewise: false,
    });
  });

  it("parses dgg as a linewise operator motion", () => {
    const result = run(
      initialState(["aaa", "bbb", "ccc"], { line: 2, col: 1 }),
      "dgg",
    );

    expect(result.state.lines).toEqual([""]);
    expect(result.state.cursor).toEqual({ line: 0, col: 0, desiredCol: 0 });
    expect(result.state.registers['"']).toEqual({
      text: "aaa\nbbb\nccc\n",
      linewise: true,
    });
  });

  it("moves counted dollar motions to the final character of the target line", () => {
    const result = run(initialState(["abc", "def"]), "2$");

    expect(result.state.cursor).toEqual({ line: 1, col: 2, desiredCol: 2 });
  });

  it("distinguishes explicit 1G from bare G", () => {
    const initial = initialState(["abcdef", "x", "uvwxyz"], {
      line: 0,
      col: 2,
    });
    const withDesiredColumn = run(initial, "j").state;

    expect(run(withDesiredColumn, "1G").state.cursor).toEqual({
      line: 0,
      col: 2,
      desiredCol: 2,
    });
    expect(run(withDesiredColumn, "G").state.cursor).toEqual({
      line: 2,
      col: 2,
      desiredCol: 2,
    });
  });

  it("preserves and clamps the desired column for gg and G", () => {
    const initial = initialState(["abcdef", "x", "uvwxyz"], {
      line: 0,
      col: 4,
    });
    const withDesiredColumn = run(initial, "j").state;

    expect(withDesiredColumn.cursor).toEqual({
      line: 1,
      col: 0,
      desiredCol: 4,
    });
    expect(run(withDesiredColumn, "G").state.cursor).toEqual({
      line: 2,
      col: 4,
      desiredCol: 4,
    });
    expect(run(withDesiredColumn, "gg").state.cursor).toEqual({
      line: 0,
      col: 4,
      desiredCol: 4,
    });
  });

  it("applies counts to D, C, and S", () => {
    const deleted = run(
      initialState(["abc", "def", "ghi"], { line: 0, col: 1 }),
      "2D",
    );
    expect(deleted.state.lines).toEqual(["a", "ghi"]);
    expect(deleted.state.registers['"']).toEqual({
      text: "bc\ndef",
      linewise: false,
    });

    const changed = run(
      initialState(["abc", "def", "ghi"], { line: 0, col: 1 }),
      "2CX<Esc>",
    );
    expect(changed.state.lines).toEqual(["aX", "ghi"]);
    expect(changed.state.registers['"']).toEqual({
      text: "bc\ndef",
      linewise: false,
    });

    const substituted = run(initialState(["aa", "bb", "cc"]), "2SX<Esc>");
    expect(substituted.state.lines).toEqual(["X", "cc"]);
    expect(substituted.state.registers['"']).toEqual({
      text: "aa\nbb\n",
      linewise: true,
    });
  });

  it("treats J count as the total participating line count", () => {
    expect(run(initialState(["a", "b", "c"]), "2J").state.lines).toEqual([
      "a b",
      "c",
    ]);
    expect(run(initialState(["a", "b", "c"]), "J").state.lines).toEqual([
      "a b",
      "c",
    ]);
  });

  it("composes leading and post-operator counts", () => {
    const initial = initialState(["one two three four five six seven"]);
    const result = run(initial, "2d3w");

    expect(result.state.lines).toEqual(["seven"]);
    expect(result.state.registers['"']).toEqual({
      text: "one two three four five six ",
      linewise: false,
    });
  });

  it("preserves explicit counts for operator G motions", () => {
    const initial = initialState(["aaa", "bbb", "ccc"], {
      line: 1,
      col: 1,
    });

    expect(run(initial, "dG").state.lines).toEqual(["aaa"]);
    expect(run(initial, "d1G").state.lines).toEqual(["ccc"]);
    expect(run(initial, "1dG").state.lines).toEqual(["ccc"]);
  });

  it("keeps completed states serializable without mutating snapshots", () => {
    const initial = initialState(["one two three"]);
    const before = JSON.stringify(initial);
    const result = run(initial, "2dw");

    expect(JSON.stringify(initial)).toBe(before);
    expect(JSON.parse(JSON.stringify(result.state))).toEqual(result.state);
  });
});
