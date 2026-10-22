import { firstNonBlank, normalCol, type Snapshot } from "./state.ts";

export interface MotionResult {
  line: number;
  col: number;
  inclusive: boolean;
  linewise?: boolean;
  operatorEnd?: { line: number; col: number };
}

const wordClass = (char: string | undefined, big: boolean): number => {
  if (char === undefined || /\s/.test(char)) return 0;
  if (big) return 1;
  return /[A-Za-z0-9_]/.test(char) ? 1 : 2;
};

function nextPosition(
  lines: readonly string[],
  line: number,
  col: number,
): [number, number] | null {
  if (col + 1 < lines[line]!.length) return [line, col + 1];
  if (line + 1 < lines.length) return [line + 1, 0];
  return null;
}

function previousPosition(
  lines: readonly string[],
  line: number,
  col: number,
): [number, number] | null {
  if (col > 0) return [line, col - 1];
  if (line > 0) return [line - 1, Math.max(0, lines[line - 1]!.length - 1)];
  return null;
}

function wordForward(
  state: Snapshot,
  big: boolean,
  count: number,
): [number, number, boolean] {
  let { line, col } = state.cursor;
  let landedOnBoundary = false;
  for (let iteration = 0; iteration < count; iteration++) {
    landedOnBoundary = false;
    let currentClass = wordClass(state.lines[line]![col], big);
    let next = nextPosition(state.lines, line, col);
    while (next) {
      const crossedLine = next[0] !== line;
      [line, col] = next;
      const nextClass = wordClass(state.lines[line]![col], big);
      if (crossedLine && (nextClass !== 0 || state.lines[line]!.length === 0)) {
        landedOnBoundary = true;
        break;
      }
      if (currentClass !== 0 && nextClass !== currentClass) currentClass = 0;
      if (currentClass === 0 && nextClass !== 0) {
        landedOnBoundary = true;
        break;
      }
      next = nextPosition(state.lines, line, col);
    }
  }
  return [line, col, landedOnBoundary];
}

function wordBackward(
  state: Snapshot,
  big: boolean,
  count: number,
): [number, number] {
  let { line, col } = state.cursor;
  for (let iteration = 0; iteration < count; iteration++) {
    let previous = previousPosition(state.lines, line, col);
    while (
      previous &&
      wordClass(state.lines[previous[0]]![previous[1]], big) === 0
    ) {
      [line, col] = previous;
      previous = previousPosition(state.lines, line, col);
    }
    if (!previous) return [0, 0];
    [line, col] = previous;
    const selected = wordClass(state.lines[line]![col], big);
    while ((previous = previousPosition(state.lines, line, col))) {
      if (wordClass(state.lines[previous[0]]![previous[1]], big) !== selected)
        break;
      [line, col] = previous;
    }
  }
  return [line, col];
}

function wordEnd(
  state: Snapshot,
  big: boolean,
  count: number,
): [number, number] {
  let { line, col } = state.cursor;
  for (let iteration = 0; iteration < count; iteration++) {
    let next: [number, number] | null =
      iteration === 0 ? [line, col] : nextPosition(state.lines, line, col);
    while (next && wordClass(state.lines[next[0]]![next[1]], big) === 0) {
      [line, col] = next;
      next = nextPosition(state.lines, line, col);
    }
    if (!next) return [line, normalCol(state.lines[line]!, col)];
    [line, col] = next;
    const selected = wordClass(state.lines[line]![col], big);
    while ((next = nextPosition(state.lines, line, col))) {
      if (
        next[0] !== line ||
        wordClass(state.lines[next[0]]![next[1]], big) !== selected
      )
        break;
      [line, col] = next;
    }
  }
  return [line, col];
}

function paragraph(
  state: Snapshot,
  direction: 1 | -1,
  count: number,
): [number, number] {
  let line = state.cursor.line;
  for (let iteration = 0; iteration < count; iteration++) {
    line += direction;
    while (
      line > 0 &&
      line < state.lines.length - 1 &&
      state.lines[line]!.trim() !== ""
    )
      line += direction;
    line = Math.max(0, Math.min(line, state.lines.length - 1));
  }
  return [line, firstNonBlank(state.lines[line]!)];
}

function bracketMatch(state: Snapshot): [number, number] | null {
  const pairs: Record<string, string> = {
    "(": ")",
    "[": "]",
    "{": "}",
    ")": "(",
    "]": "[",
    "}": "{",
  };
  const text = state.lines.join("\n");
  const offsets: number[] = [];
  let offset = 0;
  for (const line of state.lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  const start = offsets[state.cursor.line]! + state.cursor.col;
  let at = start;
  while (at < text.length && !pairs[text[at]!]) at++;
  if (at >= text.length) return null;
  const open = text[at]!;
  const close = pairs[open]!;
  const direction = "([{ ".includes(open) ? 1 : -1;
  let depth = 1;
  for (
    let index = at + direction;
    index >= 0 && index < text.length;
    index += direction
  ) {
    if (text[index] === open) depth++;
    if (text[index] === close) depth--;
    if (depth === 0) {
      let targetLine = 0;
      while (
        targetLine + 1 < offsets.length &&
        offsets[targetLine + 1]! <= index
      )
        targetLine++;
      return [targetLine, index - offsets[targetLine]!];
    }
  }
  return null;
}

export function applyMotion(
  state: Snapshot,
  command: string,
  count = 1,
  argument?: string,
  countExplicit = false,
): MotionResult | null {
  const { line, col, desiredCol } = state.cursor;
  const current = state.lines[line]!;
  switch (command) {
    case "h":
      return col > 0
        ? { line, col: Math.max(0, col - count), inclusive: false }
        : null;
    case "l":
      return col < current.length - 1
        ? {
            line,
            col: Math.min(current.length - 1, col + count),
            inclusive: false,
          }
        : null;
    case "j": {
      const target = Math.min(state.lines.length - 1, line + count);
      return target !== line
        ? {
            line: target,
            col: normalCol(state.lines[target]!, desiredCol),
            inclusive: false,
            linewise: true,
          }
        : null;
    }
    case "k": {
      const target = Math.max(0, line - count);
      return target !== line
        ? {
            line: target,
            col: normalCol(state.lines[target]!, desiredCol),
            inclusive: false,
            linewise: true,
          }
        : null;
    }
    case "0":
      return { line, col: 0, inclusive: false };
    case "^":
      return { line, col: firstNonBlank(current), inclusive: false };
    case "$": {
      const target = Math.min(state.lines.length - 1, line + count - 1);
      return {
        line: target,
        col: Math.max(0, state.lines[target]!.length - 1),
        inclusive: true,
      };
    }
    case "gg": {
      const target =
        count > 1 ? Math.min(state.lines.length - 1, count - 1) : 0;
      return {
        line: target,
        col: normalCol(state.lines[target]!, desiredCol),
        inclusive: false,
        linewise: true,
      };
    }
    case "G": {
      const target = countExplicit
        ? Math.min(state.lines.length - 1, count - 1)
        : state.lines.length - 1;
      return {
        line: target,
        col: normalCol(state.lines[target]!, desiredCol),
        inclusive: false,
        linewise: true,
      };
    }
    case "{": {
      const [targetLine, targetCol] = paragraph(state, -1, count);
      return { line: targetLine, col: targetCol, inclusive: false };
    }
    case "}": {
      const [targetLine, targetCol] = paragraph(state, 1, count);
      return { line: targetLine, col: targetCol, inclusive: false };
    }
    case "w":
    case "W": {
      const [targetLine, targetCol, landedOnBoundary] = wordForward(
        state,
        command === "W",
        count,
      );
      const atBufferEnd =
        !landedOnBoundary &&
        targetLine === state.lines.length - 1 &&
        targetCol === state.lines[targetLine]!.length - 1;
      const crossedLine = targetLine > state.cursor.line;
      const crossedSingleBoundary =
        crossedLine && count === 1 && landedOnBoundary;
      return {
        line: targetLine,
        col: targetCol,
        inclusive: false,
        operatorEnd: atBufferEnd
          ? { line: targetLine, col: targetCol + 1 }
          : crossedSingleBoundary
            ? {
                line: state.cursor.line,
                col: state.lines[state.cursor.line]!.length,
              }
            : undefined,
      };
    }
    case "b":
    case "B": {
      const [targetLine, targetCol] = wordBackward(
        state,
        command === "B",
        count,
      );
      return { line: targetLine, col: targetCol, inclusive: false };
    }
    case "e":
    case "E": {
      const [targetLine, targetCol] = wordEnd(state, command === "E", count);
      return { line: targetLine, col: targetCol, inclusive: true };
    }
    case "f":
    case "t": {
      if (!argument) return null;
      let found = col;
      for (let index = 0; index < count; index++) {
        found = current.indexOf(argument, found + 1);
        if (found < 0) return null;
      }
      return {
        line,
        col: command === "t" ? found - 1 : found,
        inclusive: command === "f",
      };
    }
    case "F":
    case "T": {
      if (!argument) return null;
      let found = col;
      for (let index = 0; index < count; index++) {
        found = current.lastIndexOf(argument, found - 1);
        if (found < 0) return null;
      }
      return {
        line,
        col: command === "T" ? found + 1 : found,
        inclusive: false,
      };
    }
    case "%": {
      const match = bracketMatch(state);
      return match ? { line: match[0], col: match[1], inclusive: true } : null;
    }
    default:
      return null;
  }
}
