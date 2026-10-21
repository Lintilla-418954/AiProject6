import type { PuzzleDef } from "../../src/content/types.ts";
import {
  initialState,
  isSolved,
  step,
  type Snapshot,
} from "../../src/engine/index.ts";

export interface SearchResult {
  solution: string[] | null;
  expanded: number;
  aborted: boolean;
}

const hash = (state: Snapshot) =>
  [
    state.lines.join("\n"),
    state.cursor.line,
    state.cursor.col,
    state.mode,
    state.pending.join(""),
    state.commandLine,
    JSON.stringify(state.registers),
  ].join("\u0001");

function alphabet(puzzle: PuzzleDef, state: Snapshot): string[] {
  if (state.mode === "insert")
    return [...new Set(puzzle.target.join("")), "<Esc>", "<BS>"];
  const base = [
    "h",
    "j",
    "k",
    "l",
    "w",
    "b",
    "e",
    "0",
    "^",
    "$",
    "x",
    "i",
    "a",
    "I",
    "A",
    "o",
    "O",
    "d",
    "c",
    "y",
    "p",
    "P",
    "J",
    "u",
    ".",
    "f",
    "t",
    "%",
    "r",
  ];
  return [
    ...new Set([...base, ...puzzle.start.join(""), ...puzzle.target.join("")]),
  ];
}

export function findShorter(
  puzzle: PuzzleDef,
  maxDepth: number,
  nodeLimit = 50_000,
): SearchResult {
  const start = initialState(puzzle.start, puzzle.cursor);
  const seen = new Set([hash(start)]);
  let frontier: { state: Snapshot; path: string[] }[] = [
    { state: start, path: [] },
  ];
  let expanded = 0;
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: typeof frontier = [];
    for (const item of frontier) {
      expanded++;
      for (const token of alphabet(puzzle, item.state)) {
        const result = step(item.state, token);
        const key = hash(result.state);
        if (seen.has(key)) continue;
        seen.add(key);
        const path = [...item.path, token];
        if (isSolved(result.state, puzzle.target))
          return { solution: path, expanded, aborted: false };
        next.push({ state: result.state, path });
        if (seen.size >= nodeLimit)
          return { solution: null, expanded, aborted: true };
      }
    }
    frontier = next;
  }
  return { solution: null, expanded, aborted: false };
}
