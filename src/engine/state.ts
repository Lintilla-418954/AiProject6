import type { KeyToken } from "./keys.ts";

export type Mode =
  "normal" | "insert" | "command" | "visual" | "visual-line" | "visual-block";

export interface Cursor {
  line: number;
  col: number;
  desiredCol: number;
}

export interface RegisterValue {
  text: string;
  linewise: boolean;
  blockwise?: boolean;
}

export interface Snapshot {
  lines: readonly string[];
  cursor: Cursor;
  mode: Mode;
  selectionAnchor: { line: number; col: number } | null;
  pending: readonly KeyToken[];
  commandLine: string;
  registers: Readonly<Record<string, RegisterValue>>;
  activeRegister: string;
  search: { pattern: string; direction: 1 | -1 } | null;
  lastFind: { char: string; direction: 1 | -1; till: boolean } | null;
  lastChange: readonly KeyToken[] | null;
  undo: readonly HistoryEntry[];
  redo: readonly HistoryEntry[];
  insertStart: { lines: readonly string[]; cursor: Cursor } | null;
  changeTokens: readonly KeyToken[];
  recordingRegister: string | null;
  macros: Readonly<Record<string, readonly KeyToken[]>>;
  message: string;
}

export interface HistoryEntry {
  lines: readonly string[];
  cursor: Cursor;
  registers: Readonly<Record<string, RegisterValue>>;
}

const EMPTY_REGISTER: RegisterValue = { text: "", linewise: false };

export function initialState(
  lines: readonly string[],
  cursor = { line: 0, col: 0 },
): Snapshot {
  const normalized = lines.length ? [...lines] : [""];
  const line = Math.max(0, Math.min(cursor.line, normalized.length - 1));
  const col = normalCol(normalized[line]!, cursor.col);
  return {
    lines: normalized,
    cursor: { line, col, desiredCol: col },
    mode: "normal",
    selectionAnchor: null,
    pending: [],
    commandLine: "",
    registers: {
      '"': EMPTY_REGISTER,
      "0": EMPTY_REGISTER,
      "-": EMPTY_REGISTER,
    },
    activeRegister: '"',
    search: null,
    lastFind: null,
    lastChange: null,
    undo: [],
    redo: [],
    insertStart: null,
    changeTokens: [],
    recordingRegister: null,
    macros: {},
    message: "",
  };
}

export function normalCol(line: string, col: number): number {
  return Math.max(0, Math.min(col, Math.max(0, line.length - 1)));
}

export function insertCol(line: string, col: number): number {
  return Math.max(0, Math.min(col, line.length));
}

export function firstNonBlank(line: string): number {
  const at = line.search(/\S/);
  return at < 0 ? 0 : at;
}

export function snapshotHistory(state: Snapshot): HistoryEntry {
  return {
    lines: state.lines,
    cursor: state.cursor,
    registers: state.registers,
  };
}

export function withCursor(
  state: Snapshot,
  line: number,
  col: number,
  preserveDesired = false,
): Snapshot {
  const nextLine = Math.max(0, Math.min(line, state.lines.length - 1));
  const nextCol = normalCol(state.lines[nextLine]!, col);
  return {
    ...state,
    cursor: {
      line: nextLine,
      col: nextCol,
      desiredCol: preserveDesired ? state.cursor.desiredCol : nextCol,
    },
    pending: [],
    message: "",
  };
}

export function isSolved(state: Snapshot, target: readonly string[]): boolean {
  return (
    state.mode === "normal" &&
    state.pending.length === 0 &&
    state.lines.length === target.length &&
    state.lines.every((line, index) => line === target[index])
  );
}
