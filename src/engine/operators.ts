import {
  firstNonBlank,
  normalCol,
  snapshotHistory,
  type RegisterValue,
  type Snapshot,
} from "./state.ts";
import type { TextRange } from "./textobjects.ts";

export type Operator = "d" | "c" | "y" | ">" | "<" | "=";

function ordered(range: TextRange): TextRange {
  const before =
    range.start.line < range.end.line ||
    (range.start.line === range.end.line && range.start.col <= range.end.col);
  return before ? range : { ...range, start: range.end, end: range.start };
}

function setRegister(
  state: Snapshot,
  value: RegisterValue,
  yank: boolean,
): Snapshot["registers"] {
  const target = state.activeRegister;
  const registers = { ...state.registers, '"': value, [target]: value };
  if (yank) registers["0"] = value;
  else if (!value.linewise && !value.text.includes("\n"))
    registers["-"] = value;
  return registers;
}

export function applyOperator(
  state: Snapshot,
  operator: Operator,
  sourceRange: TextRange,
): Snapshot {
  const range = ordered(sourceRange);
  const lines = [...state.lines];
  const linewise = range.linewise === true;
  let text: string;
  if (linewise) {
    const first = Math.min(range.start.line, range.end.line);
    const last = Math.max(range.start.line, range.end.line);
    text = lines.slice(first, last + 1).join("\n") + "\n";
    if (operator === "y") {
      return {
        ...state,
        cursor: {
          line: first,
          col: firstNonBlank(lines[first]!),
          desiredCol: firstNonBlank(lines[first]!),
        },
        registers: setRegister(state, { text, linewise: true }, true),
        pending: [],
        activeRegister: '"',
      };
    }
    if (operator === ">" || operator === "<" || operator === "=") {
      for (let index = first; index <= last; index++) {
        if (operator === ">") lines[index] = `  ${lines[index]}`;
        else if (operator === "<")
          lines[index] = lines[index]!.replace(/^ {1,2}/, "");
        else
          lines[index] =
            `${"  ".repeat(Math.max(0, braceDepth(lines, index)))}${lines[index]!.trimStart()}`;
      }
      return changed(
        state,
        lines,
        first,
        firstNonBlank(lines[first]!),
        state.registers,
        "normal",
      );
    }
    const registers = setRegister(state, { text, linewise: true }, false);
    if (operator === "c") {
      const indent = lines[first]!.match(/^ */)?.[0] ?? "";
      lines.splice(first, last - first + 1, indent);
      return changed(state, lines, first, indent.length, registers, "insert");
    }
    lines.splice(first, last - first + 1);
    if (!lines.length) lines.push("");
    const target = Math.min(first, lines.length - 1);
    return changed(
      state,
      lines,
      target,
      firstNonBlank(lines[target]!),
      registers,
      "normal",
    );
  }

  const start = range.start;
  const end = range.end;
  if (start.line === end.line)
    text = lines[start.line]!.slice(start.col, end.col);
  else
    text = [
      lines[start.line]!.slice(start.col),
      ...lines.slice(start.line + 1, end.line),
      lines[end.line]!.slice(0, end.col),
    ].join("\n");
  const register = { text, linewise: false };
  if (operator === "y") {
    return {
      ...state,
      cursor: {
        line: start.line,
        col: normalCol(lines[start.line]!, start.col),
        desiredCol: start.col,
      },
      registers: setRegister(state, register, true),
      pending: [],
      activeRegister: '"',
    };
  }
  if (operator === ">" || operator === "<" || operator === "=") {
    const lineRange: TextRange = {
      start: { line: start.line, col: 0 },
      end: { line: end.line, col: 0 },
      linewise: true,
    };
    return applyOperator(state, operator, lineRange);
  }
  const registers = setRegister(state, register, false);
  const prefix = lines[start.line]!.slice(0, start.col);
  const suffix = lines[end.line]!.slice(end.col);
  lines.splice(start.line, end.line - start.line + 1, prefix + suffix);
  return changed(
    state,
    lines,
    start.line,
    start.col,
    registers,
    operator === "c" ? "insert" : "normal",
  );
}

function braceDepth(lines: readonly string[], until: number): number {
  let depth = 0;
  for (let index = 0; index < until; index++) {
    const line = lines[index]!.replace(/#.*$/, "");
    depth += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
  }
  if (lines[until]!.trimStart().startsWith("}")) depth--;
  return depth;
}

export function changed(
  state: Snapshot,
  lines: readonly string[],
  line: number,
  col: number,
  registers = state.registers,
  mode: Snapshot["mode"] = "normal",
): Snapshot {
  const cursorCol =
    mode === "insert"
      ? Math.max(0, Math.min(col, lines[line]!.length))
      : normalCol(lines[line]!, col);
  return {
    ...state,
    lines,
    cursor: { line, col: cursorCol, desiredCol: cursorCol },
    mode,
    pending: [],
    registers,
    activeRegister: '"',
    undo: [...state.undo, snapshotHistory(state)],
    redo: [],
    selectionAnchor: null,
    insertStart:
      mode === "insert" ? { lines: state.lines, cursor: state.cursor } : null,
    message: "",
  };
}

export function paste(
  state: Snapshot,
  after: boolean,
  count = 1,
): Snapshot | null {
  const register =
    state.registers[state.activeRegister] ?? state.registers['"'];
  if (!register || (!register.text && !register.linewise)) return null;
  let result = state;
  for (let iteration = 0; iteration < count; iteration++) {
    const lines = [...result.lines];
    if (register.linewise) {
      const additions = register.text.replace(/\n$/, "").split("\n");
      const at = after ? result.cursor.line + 1 : result.cursor.line;
      if (lines[result.cursor.line]!.trimStart().startsWith("# replace"))
        lines.splice(result.cursor.line, 1);
      const insertion = Math.min(at, lines.length);
      lines.splice(insertion, 0, ...additions);
      result = changed(
        result,
        lines,
        insertion,
        firstNonBlank(lines[insertion]!),
        result.registers,
      );
    } else {
      const line = lines[result.cursor.line]!;
      const at =
        after && line.length ? result.cursor.col + 1 : result.cursor.col;
      const parts = register.text.split("\n");
      if (parts.length === 1) {
        lines[result.cursor.line] =
          line.slice(0, at) + register.text + line.slice(at);
        result = changed(
          result,
          lines,
          result.cursor.line,
          at + Math.max(0, register.text.length - 1),
          result.registers,
        );
      } else {
        lines.splice(
          result.cursor.line,
          1,
          line.slice(0, at) + parts[0],
          ...parts.slice(1, -1),
          parts.at(-1)! + line.slice(at),
        );
        result = changed(
          result,
          lines,
          result.cursor.line + parts.length - 1,
          Math.max(0, parts.at(-1)!.length - 1),
          result.registers,
        );
      }
    }
  }
  return result;
}
