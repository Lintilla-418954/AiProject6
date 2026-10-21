import type { Snapshot } from "./state.ts";

export interface TextRange {
  start: { line: number; col: number };
  end: { line: number; col: number };
  linewise?: boolean;
}

const charClass = (char: string | undefined, big: boolean): number => {
  if (char === undefined || /\s/.test(char)) return 0;
  if (big) return 1;
  return /[A-Za-z0-9_]/.test(char) ? 1 : 2;
};

function wordObject(
  state: Snapshot,
  around: boolean,
  big: boolean,
): TextRange | null {
  const line = state.lines[state.cursor.line]!;
  if (!line.length) return null;
  let col = Math.min(state.cursor.col, line.length - 1);
  if (charClass(line[col], big) === 0) {
    while (col < line.length && charClass(line[col], big) === 0) col++;
    if (col >= line.length) return null;
  }
  const selected = charClass(line[col], big);
  let start = col;
  let end = col + 1;
  while (start > 0 && charClass(line[start - 1], big) === selected) start--;
  while (end < line.length && charClass(line[end], big) === selected) end++;
  if (around) {
    while (end < line.length && /\s/.test(line[end]!)) end++;
    if (end === col + 1)
      while (start > 0 && /\s/.test(line[start - 1]!)) start--;
  }
  return {
    start: { line: state.cursor.line, col: start },
    end: { line: state.cursor.line, col: end },
  };
}

function delimiterObject(
  state: Snapshot,
  around: boolean,
  object: string,
): TextRange | null {
  const line = state.lines[state.cursor.line]!;
  const aliases: Record<string, [string, string]> = {
    "(": ["(", ")"],
    ")": ["(", ")"],
    b: ["(", ")"],
    "[": ["[", "]"],
    "]": ["[", "]"],
    "{": ["{", "}"],
    "}": ["{", "}"],
    B: ["{", "}"],
    '"': ['"', '"'],
    "'": ["'", "'"],
  };
  const pair = aliases[object];
  if (!pair) return null;
  const [open, close] = pair;
  let left = -1;
  let right = -1;
  if (open === close) {
    left = line.lastIndexOf(open, state.cursor.col);
    if (left === state.cursor.col)
      left = line.lastIndexOf(open, state.cursor.col - 1);
    right = line.indexOf(close, Math.max(left + 1, state.cursor.col + 1));
  } else {
    let depth = 0;
    for (let index = state.cursor.col; index >= 0; index--) {
      if (line[index] === close) depth++;
      if (line[index] === open) {
        if (depth === 0) {
          left = index;
          break;
        }
        depth--;
      }
    }
    depth = 0;
    for (
      let index = Math.max(state.cursor.col, left + 1);
      index < line.length;
      index++
    ) {
      if (line[index] === open) depth++;
      if (line[index] === close) {
        if (depth === 0) {
          right = index;
          break;
        }
        depth--;
      }
    }
  }
  if (left < 0 || right < 0) return null;
  return {
    start: { line: state.cursor.line, col: around ? left : left + 1 },
    end: { line: state.cursor.line, col: around ? right + 1 : right },
  };
}

export function textObject(
  state: Snapshot,
  kind: "i" | "a",
  object: string,
): TextRange | null {
  if (object === "w" || object === "W")
    return wordObject(state, kind === "a", object === "W");
  return delimiterObject(state, kind === "a", object);
}
