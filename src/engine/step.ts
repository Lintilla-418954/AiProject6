import { executeEx } from "./ex.ts";
import { isPrintableToken, type KeyToken } from "./keys.ts";
import { applyMotion, type MotionResult } from "./motions.ts";
import { applyOperator, changed, paste, type Operator } from "./operators.ts";
import {
  firstNonBlank,
  normalCol,
  snapshotHistory,
  type Snapshot,
} from "./state.ts";
import { textObject, type TextRange } from "./textobjects.ts";

export interface StepResult {
  state: Snapshot;
  bell: boolean;
  trace: readonly string[];
}

interface ParsedCommand {
  count: number;
  countExplicit: boolean;
  command: string;
  argument?: string;
  operator?: Operator;
  operatorCount?: number;
  operatorCountExplicit?: boolean;
}

const MOTIONS = new Set([
  "h",
  "j",
  "k",
  "l",
  "w",
  "b",
  "e",
  "W",
  "B",
  "E",
  "0",
  "^",
  "$",
  "G",
  "{",
  "}",
  "%",
  "gg",
]);
const ARG_MOTIONS = new Set(["f", "t", "F", "T"]);
const SIMPLE = new Set([
  "x",
  "r",
  "~",
  "i",
  "a",
  "I",
  "A",
  "o",
  "O",
  "D",
  "C",
  "s",
  "S",
  "J",
  "p",
  "P",
  "u",
  ".",
  "*",
  "#",
  ">",
  "<",
]);

function parsePending(
  tokens: readonly string[],
): "incomplete" | "invalid" | ParsedCommand {
  let index = 0;
  const readCount = (): number => {
    let digits = "";
    while (
      index < tokens.length &&
      /^\d$/.test(tokens[index]!) &&
      (digits || tokens[index] !== "0")
    )
      digits += tokens[index++]!;
    return digits ? Number(digits) : 0;
  };
  const parsedCount = readCount();
  const count = parsedCount || 1;
  const countExplicit = parsedCount !== 0;
  if (index >= tokens.length) return "incomplete";
  let command = tokens[index++]!;
  if (["d", "c", "y", ">", "<", "="].includes(command)) {
    const operator = command as Operator;
    const parsedOperatorCount = readCount();
    const operatorCount = parsedOperatorCount || 1;
    const operatorCountExplicit = parsedOperatorCount !== 0;
    if (index >= tokens.length) return "incomplete";
    let motion = tokens[index++]!;
    if (
      motion === operator ||
      ((operator === ">" || operator === "<" || operator === "=") &&
        motion === operator)
    ) {
      return index === tokens.length
        ? {
            count,
            countExplicit,
            command: "line",
            operator,
            operatorCount,
            operatorCountExplicit,
          }
        : "invalid";
    }
    if (motion === "g") {
      if (index >= tokens.length) return "incomplete";
      if (tokens[index++] !== "g") return "invalid";
      motion = "gg";
    }
    if (motion === "i" || motion === "a") {
      if (index >= tokens.length) return "incomplete";
      const argument = tokens[index++]!;
      return index === tokens.length
        ? {
            count,
            countExplicit,
            command: `object-${motion}`,
            argument,
            operator,
            operatorCount,
            operatorCountExplicit,
          }
        : "invalid";
    }
    if (ARG_MOTIONS.has(motion)) {
      if (index >= tokens.length) return "incomplete";
      const argument = tokens[index++]!;
      return index === tokens.length
        ? {
            count,
            countExplicit,
            command: motion,
            argument,
            operator,
            operatorCount,
            operatorCountExplicit,
          }
        : "invalid";
    }
    return MOTIONS.has(motion) && index === tokens.length
      ? {
          count,
          countExplicit,
          command: motion,
          operator,
          operatorCount,
          operatorCountExplicit,
        }
      : "invalid";
  }
  if (command === "g") {
    if (index >= tokens.length) return "incomplete";
    if (tokens[index++] !== "g") return "invalid";
    command = "gg";
  }
  if (command === ";" || command === ",")
    return index === tokens.length
      ? { count, countExplicit, command }
      : "invalid";
  if (ARG_MOTIONS.has(command) || command === "r") {
    if (index >= tokens.length) return "incomplete";
    const argument = tokens[index++]!;
    return index === tokens.length
      ? { count, countExplicit, command, argument }
      : "invalid";
  }
  if (command === '"' || command === "q" || command === "@") {
    if (index >= tokens.length) return "incomplete";
    const argument = tokens[index++]!;
    return index === tokens.length
      ? { count, countExplicit, command, argument }
      : "invalid";
  }
  if (command === "[") return "invalid";
  if (
    command === "<C-r>" ||
    command === "<C-a>" ||
    command === "<C-x>" ||
    command === "<C-v>" ||
    command === "V" ||
    command === "v" ||
    command === ":" ||
    command === "/" ||
    command === "?" ||
    command === "n" ||
    command === "N"
  ) {
    return index === tokens.length
      ? { count, countExplicit, command }
      : "invalid";
  }
  return (SIMPLE.has(command) || MOTIONS.has(command) || command === "gg") &&
    index === tokens.length
    ? { count, countExplicit, command }
    : "invalid";
}

const fail = (state: Snapshot, clear = true): StepResult => ({
  state: {
    ...state,
    pending: clear ? [] : state.pending,
    activeRegister: clear ? '"' : state.activeRegister,
    message: "",
  },
  bell: true,
  trace: [],
});

function enterInsert(
  state: Snapshot,
  line: number,
  col: number,
  token: string,
): Snapshot {
  return {
    ...state,
    mode: "insert",
    cursor: { line, col, desiredCol: col },
    pending: [],
    insertStart: { lines: state.lines, cursor: state.cursor },
    changeTokens: [token],
    message: "-- INSERT --",
  };
}

function insertStep(state: Snapshot, token: KeyToken): StepResult {
  const lines = [...state.lines];
  const { line, col } = state.cursor;
  const current = lines[line]!;
  if (token === "<Esc>" || token === "<C-[>") {
    const cursorCol = normalCol(current, col - 1);
    const didChange = state.insertStart
      ? state.insertStart.lines.some(
          (value, index) => value !== lines[index],
        ) || state.insertStart.lines.length !== lines.length
      : false;
    const next: Snapshot = {
      ...state,
      mode: "normal",
      cursor: { line, col: cursorCol, desiredCol: cursorCol },
      pending: [],
      insertStart: null,
      lastChange: didChange ? [...state.changeTokens, token] : state.lastChange,
      changeTokens: [],
      message: "",
    };
    return { state: next, bell: false, trace: ["<Esc>"] };
  }
  if (token === "<BS>") {
    if (col > 0) {
      lines[line] = current.slice(0, col - 1) + current.slice(col);
      return {
        state: {
          ...state,
          lines,
          cursor: { line, col: col - 1, desiredCol: col - 1 },
          changeTokens: [...state.changeTokens, token],
        },
        bell: false,
        trace: ["<BS>"],
      };
    }
    return fail({ ...state, changeTokens: [...state.changeTokens, token] });
  }
  if (token === "<CR>") {
    const indent = current.match(/^ */)?.[0] ?? "";
    lines.splice(
      line,
      1,
      current.slice(0, col),
      indent + current.slice(col).replace(/^ +/, ""),
    );
    return {
      state: {
        ...state,
        lines,
        cursor: {
          line: line + 1,
          col: indent.length,
          desiredCol: indent.length,
        },
        changeTokens: [...state.changeTokens, token],
      },
      bell: false,
      trace: ["<CR>"],
    };
  }
  if (!isPrintableToken(token)) return fail(state);
  lines[line] = current.slice(0, col) + token + current.slice(col);
  return {
    state: {
      ...state,
      lines,
      cursor: { line, col: col + 1, desiredCol: col + 1 },
      changeTokens: [...state.changeTokens, token],
    },
    bell: false,
    trace: [],
  };
}

function commandStep(state: Snapshot, token: KeyToken): StepResult {
  if (token === "<Esc>" || token === "<C-[>")
    return {
      state: { ...state, mode: "normal", commandLine: "", message: "" },
      bell: false,
      trace: [],
    };
  if (token === "<BS>")
    return {
      state: { ...state, commandLine: state.commandLine.slice(0, -1) },
      bell: false,
      trace: [],
    };
  if (token === "<CR>") {
    if (state.message === "/" || state.message === "?")
      return finishSearch(state);
    const result = executeEx(state, state.commandLine);
    return { state: result.state, bell: result.bell, trace: result.commandIds };
  }
  if (!isPrintableToken(token)) return fail(state);
  return {
    state: { ...state, commandLine: state.commandLine + token },
    bell: false,
    trace: [],
  };
}

function finishSearch(state: Snapshot): StepResult {
  const direction: 1 | -1 = state.message === "/" ? 1 : -1;
  const next = findPattern(
    { ...state, mode: "normal", message: "" },
    state.commandLine,
    direction,
    1,
  );
  if (!next) return fail({ ...state, mode: "normal", commandLine: "" });
  return {
    state: {
      ...next,
      commandLine: "",
      search: { pattern: state.commandLine, direction },
      message: "",
    },
    bell: false,
    trace: [direction === 1 ? "/" : "?"],
  };
}

function findPattern(
  state: Snapshot,
  pattern: string,
  direction: 1 | -1,
  count: number,
): Snapshot | null {
  if (!pattern) return null;
  const haystack = state.lines.join("\n");
  const offsets: number[] = [];
  let offset = 0;
  for (const line of state.lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  let position = offsets[state.cursor.line]! + state.cursor.col;
  for (let iteration = 0; iteration < count; iteration++) {
    if (direction === 1) {
      const found = haystack.indexOf(pattern, position + 1);
      position = found >= 0 ? found : haystack.indexOf(pattern);
    } else {
      const found = haystack.lastIndexOf(pattern, position - 1);
      position = found >= 0 ? found : haystack.lastIndexOf(pattern);
    }
    if (position < 0) return null;
  }
  let line = 0;
  while (line + 1 < offsets.length && offsets[line + 1]! <= position) line++;
  const col = position - offsets[line]!;
  return { ...state, cursor: { line, col, desiredCol: col }, pending: [] };
}

function motionRange(
  state: Snapshot,
  motion: MotionResult,
  command: string,
  count = 1,
): TextRange {
  if (motion.linewise && ["j", "k", "gg", "G"].includes(command)) {
    return {
      start: { line: state.cursor.line, col: 0 },
      end: { line: motion.line, col: 0 },
      linewise: true,
    };
  }
  let target = motion.operatorEnd ?? {
    line: motion.line,
    col: motion.col + (motion.inclusive ? 1 : 0),
  };
  if (
    command === "cw" &&
    !/\s/.test(state.lines[state.cursor.line]![state.cursor.col] ?? "")
  ) {
    const end = applyMotion(state, "e", count);
    if (end) target = { line: end.line, col: end.col + 1 };
  }
  const origin = { line: state.cursor.line, col: state.cursor.col };
  const backward =
    motion.line < origin.line ||
    (motion.line === origin.line && motion.col < origin.col);
  if (backward) {
    return {
      start: { line: motion.line, col: motion.col },
      end: {
        line: origin.line,
        col: origin.col + (motion.inclusive ? 1 : 0),
      },
    };
  }
  return { start: origin, end: target };
}

function updateNumber(
  state: Snapshot,
  delta: number,
  count: number,
): Snapshot | null {
  const lines = [...state.lines];
  const line = lines[state.cursor.line]!;
  const after = line.slice(state.cursor.col);
  const match = /\d+/.exec(after);
  if (!match || match.index === undefined) return null;
  const start = state.cursor.col + match.index;
  const value = Math.max(0, Number(match[0]) + delta * count);
  lines[state.cursor.line] =
    line.slice(0, start) + value + line.slice(start + match[0].length);
  return changed(state, lines, state.cursor.line, start);
}

function visualStep(state: Snapshot, token: KeyToken): StepResult {
  const toggle =
    state.mode === "visual"
      ? "v"
      : state.mode === "visual-line"
        ? "V"
        : "<C-v>";
  if (token === "<Esc>" || token === "<C-[>" || token === toggle)
    return {
      state: { ...state, mode: "normal", selectionAnchor: null, pending: [] },
      bell: false,
      trace: [],
    };
  const motion = applyMotion(state, token, 1);
  if (motion)
    return {
      state: {
        ...state,
        cursor: { line: motion.line, col: motion.col, desiredCol: motion.col },
      },
      bell: false,
      trace: [token],
    };
  if (token === "o" && state.selectionAnchor)
    return {
      state: {
        ...state,
        selectionAnchor: { line: state.cursor.line, col: state.cursor.col },
        cursor: {
          ...state.selectionAnchor,
          desiredCol: state.selectionAnchor.col,
        },
      },
      bell: false,
      trace: ["o"],
    };
  if (["d", "c", "y", ">", "<", "x"].includes(token) && state.selectionAnchor) {
    const linewise = state.mode === "visual-line";
    const operator = token === "x" ? "d" : (token as Operator);
    let next: Snapshot;
    if (state.mode === "visual-block") {
      const firstLine = Math.min(state.selectionAnchor.line, state.cursor.line);
      const lastLine = Math.max(state.selectionAnchor.line, state.cursor.line);
      const firstCol = Math.min(state.selectionAnchor.col, state.cursor.col);
      const lastCol = Math.max(state.selectionAnchor.col, state.cursor.col);
      const lines = [...state.lines];
      for (let line = firstLine; line <= lastLine; line++)
        lines[line] =
          lines[line]!.slice(0, firstCol) + lines[line]!.slice(lastCol + 1);
      next = changed(state, lines, firstLine, firstCol);
    } else {
      const endCol = linewise ? 0 : state.cursor.col + 1;
      next = applyOperator(state, operator, {
        start: state.selectionAnchor,
        end: { line: state.cursor.line, col: endCol },
        linewise,
      });
    }
    return {
      state: next,
      bell: false,
      trace: [
        state.mode === "visual-block"
          ? "<C-v>"
          : state.mode === "visual-line"
            ? "V"
            : "v",
        token,
      ],
    };
  }
  return fail(state);
}

function undo(state: Snapshot, redo = false): Snapshot | null {
  const source = redo ? state.redo : state.undo;
  const entry = source.at(-1);
  if (!entry) return null;
  const current = snapshotHistory(state);
  return {
    ...state,
    lines: entry.lines,
    cursor: entry.cursor,
    registers: entry.registers,
    undo: redo ? [...state.undo, current] : state.undo.slice(0, -1),
    redo: redo ? state.redo.slice(0, -1) : [...state.redo, current],
    pending: [],
  };
}

function normalStep(
  state: Snapshot,
  token: KeyToken,
  replayDepth: number,
): StepResult {
  if (state.recordingRegister && token === "q")
    return {
      state: { ...state, recordingRegister: null, pending: [] },
      bell: false,
      trace: ["q"],
    };
  if (token === "<Esc>" || token === "<C-[>") return fail(state);
  const pending = [...state.pending, token];
  const parsed = parsePending(pending);
  if (parsed === "incomplete")
    return { state: { ...state, pending }, bell: false, trace: [] };
  if (parsed === "invalid") return fail(state);
  const {
    count,
    countExplicit,
    command,
    argument,
    operator,
    operatorCount = 1,
  } = parsed;
  const working = { ...state, pending };

  if (command === '"' && argument)
    return {
      state: { ...state, pending: [], activeRegister: argument },
      bell: false,
      trace: ["register"],
    };
  if (command === "q" && argument) {
    return {
      state: {
        ...state,
        recordingRegister: argument,
        macros: { ...state.macros, [argument]: [] },
        pending: [],
      },
      bell: false,
      trace: ["q"],
    };
  }
  if ((command === "@" || command === ".") && replayDepth < 100) {
    const replay =
      command === "."
        ? state.lastChange
        : state.macros[
            argument === "@" ? state.activeRegister : (argument ?? "")
          ];
    if (!replay) return fail(state);
    let next: Snapshot = { ...state, pending: [] };
    const trace: string[] = [command === "." ? "." : "@"];
    for (let iteration = 0; iteration < count; iteration++)
      for (const inner of replay)
        next = stepInternal(next, inner, replayDepth + 1).state;
    return {
      state: { ...next, lastChange: state.lastChange },
      bell: false,
      trace,
    };
  }

  if (operator) {
    if (command === "line") {
      const last = Math.min(
        state.lines.length - 1,
        state.cursor.line + count * operatorCount - 1,
      );
      const next = applyOperator(state, operator, {
        start: { line: state.cursor.line, col: 0 },
        end: { line: last, col: 0 },
        linewise: true,
      });
      return { state: next, bell: false, trace: [`${operator}${operator}`] };
    }
    if (command.startsWith("object-") && argument) {
      const range = textObject(
        state,
        command.endsWith("i") ? "i" : "a",
        argument,
      );
      if (!range) return fail(state);
      const next = applyOperator(state, operator, range);
      return {
        state: next,
        bell: false,
        trace: [
          `${command.endsWith("i") ? "i" : "a"}${argument}`,
          `${operator}{motion}`,
        ],
      };
    }
    const motion = applyMotion(
      state,
      command,
      count * operatorCount,
      argument,
      countExplicit || parsed.operatorCountExplicit === true,
    );
    if (!motion) return fail(state);
    const next = applyOperator(
      working,
      operator,
      motionRange(
        working,
        motion,
        operator === "c" ? `c${command}` : command,
        count * operatorCount,
      ),
    );
    return {
      state: next,
      bell: false,
      trace: [command, `${operator}{motion}`],
    };
  }

  let motion = applyMotion(state, command, count, argument, countExplicit);
  if ((command === ";" || command === ",") && state.lastFind) {
    const reversed = command === ",";
    const direction = reversed
      ? ((state.lastFind.direction * -1) as 1 | -1)
      : state.lastFind.direction;
    const findCommand =
      direction === 1
        ? state.lastFind.till
          ? "t"
          : "f"
        : state.lastFind.till
          ? "T"
          : "F";
    motion = applyMotion(state, findCommand, count, state.lastFind.char);
  }
  if (motion) {
    const next: Snapshot = {
      ...state,
      cursor: {
        line: motion.line,
        col: motion.col,
        desiredCol: ["j", "k", "gg", "G"].includes(command)
          ? state.cursor.desiredCol
          : motion.col,
      },
      pending: [],
      lastFind:
        ARG_MOTIONS.has(command) && argument
          ? {
              char: argument,
              direction: command === "f" || command === "t" ? 1 : -1,
              till: command === "t" || command === "T",
            }
          : state.lastFind,
      activeRegister: '"',
    };
    return { state: next, bell: false, trace: [command] };
  }

  switch (command) {
    case "i":
      return {
        state: enterInsert(state, state.cursor.line, state.cursor.col, "i"),
        bell: false,
        trace: ["i"],
      };
    case "a":
      return {
        state: enterInsert(
          state,
          state.cursor.line,
          Math.min(
            state.lines[state.cursor.line]!.length,
            state.cursor.col + 1,
          ),
          "a",
        ),
        bell: false,
        trace: ["a"],
      };
    case "I":
      return {
        state: enterInsert(
          state,
          state.cursor.line,
          firstNonBlank(state.lines[state.cursor.line]!),
          "I",
        ),
        bell: false,
        trace: ["I"],
      };
    case "A":
      return {
        state: enterInsert(
          state,
          state.cursor.line,
          state.lines[state.cursor.line]!.length,
          "A",
        ),
        bell: false,
        trace: ["A"],
      };
    case "o":
    case "O": {
      const lines = [...state.lines];
      const indent = state.lines[state.cursor.line]!.match(/^ */)?.[0] ?? "";
      const line = command === "o" ? state.cursor.line + 1 : state.cursor.line;
      lines.splice(line, 0, indent);
      const prepared = {
        ...state,
        lines,
        undo: [...state.undo, snapshotHistory(state)],
        redo: [],
      };
      return {
        state: enterInsert(prepared, line, indent.length, command),
        bell: false,
        trace: [command],
      };
    }
    case "x": {
      const line = state.lines[state.cursor.line]!;
      if (!line.length) return fail(state);
      const end = Math.min(line.length, state.cursor.col + count);
      return {
        state: applyOperator(state, "d", {
          start: { line: state.cursor.line, col: state.cursor.col },
          end: { line: state.cursor.line, col: end },
        }),
        bell: false,
        trace: ["x"],
      };
    }
    case "D":
    case "C": {
      const operatorType = command === "D" ? "d" : "c";
      const motion = applyMotion(state, "$", count);
      if (!motion) return fail(state);
      const next = applyOperator(
        state,
        operatorType,
        motionRange(state, motion, "$"),
      );
      return { state: next, bell: false, trace: [command] };
    }
    case "s":
    case "S": {
      const range: TextRange =
        command === "S"
          ? {
              start: { line: state.cursor.line, col: 0 },
              end: {
                line: Math.min(
                  state.lines.length - 1,
                  state.cursor.line + count - 1,
                ),
                col: 0,
              },
              linewise: true,
            }
          : {
              start: { line: state.cursor.line, col: state.cursor.col },
              end: {
                line: state.cursor.line,
                col: Math.min(
                  state.lines[state.cursor.line]!.length,
                  state.cursor.col + count,
                ),
              },
            };
      return {
        state: applyOperator(state, "c", range),
        bell: false,
        trace: [command],
      };
    }
    case "r": {
      if (!argument || !isPrintableToken(argument)) return fail(state);
      const lines = [...state.lines];
      const line = lines[state.cursor.line]!;
      if (state.cursor.col + count > line.length) return fail(state);
      lines[state.cursor.line] =
        line.slice(0, state.cursor.col) +
        argument.repeat(count) +
        line.slice(state.cursor.col + count);
      return {
        state: changed(
          state,
          lines,
          state.cursor.line,
          state.cursor.col + count - 1,
        ),
        bell: false,
        trace: ["r"],
      };
    }
    case "~": {
      const lines = [...state.lines];
      const line = lines[state.cursor.line]!;
      const end = Math.min(line.length, state.cursor.col + count);
      const toggled = [...line.slice(state.cursor.col, end)]
        .map((char) =>
          char.toUpperCase() === char ? char.toLowerCase() : char.toUpperCase(),
        )
        .join("");
      lines[state.cursor.line] =
        line.slice(0, state.cursor.col) + toggled + line.slice(end);
      return {
        state: changed(
          state,
          lines,
          state.cursor.line,
          Math.min(end, Math.max(0, line.length - 1)),
        ),
        bell: false,
        trace: ["~"],
      };
    }
    case "J": {
      const joins = Math.max(1, count - 1);
      if (state.cursor.line + joins >= state.lines.length) return fail(state);
      const lines = [...state.lines];
      let cursor = state.cursor.col;
      for (let iteration = 0; iteration < joins; iteration++) {
        const left = lines[state.cursor.line]!.replace(/\s+$/, "");
        const right = lines[state.cursor.line + 1]!.replace(/^\s+/, "");
        cursor = left.length;
        lines.splice(
          state.cursor.line,
          2,
          `${left}${left && right && !/^[)\]}]/.test(right) ? " " : ""}${right}`,
        );
      }
      return {
        state: changed(state, lines, state.cursor.line, cursor),
        bell: false,
        trace: ["J"],
      };
    }
    case "p":
    case "P": {
      const next = paste(state, command === "p", count);
      return next
        ? { state: next, bell: false, trace: [command] }
        : fail(state);
    }
    case "u":
    case "<C-r>": {
      const next = undo(state, command === "<C-r>");
      return next
        ? { state: next, bell: false, trace: [command] }
        : fail(state);
    }
    case "<C-a>":
    case "<C-x>": {
      const next = updateNumber(state, command === "<C-a>" ? 1 : -1, count);
      return next
        ? { state: next, bell: false, trace: [command] }
        : fail(state);
    }
    case ":":
    case "/":
    case "?":
      return {
        state: {
          ...state,
          mode: "command",
          pending: [],
          commandLine: "",
          message: command,
        },
        bell: false,
        trace: [],
      };
    case "n":
    case "N": {
      if (!state.search) return fail(state);
      const direction =
        command === "n"
          ? state.search.direction
          : ((state.search.direction * -1) as 1 | -1);
      const next = findPattern(state, state.search.pattern, direction, count);
      return next
        ? { state: next, bell: false, trace: [command] }
        : fail(state);
    }
    case "*":
    case "#": {
      const line = state.lines[state.cursor.line]!;
      const left = line.slice(0, state.cursor.col + 1).search(/[A-Za-z0-9_]+$/);
      const rightMatch = /^[A-Za-z0-9_]+/.exec(line.slice(state.cursor.col));
      if (left < 0 || !rightMatch) return fail(state);
      const word = line.slice(left, state.cursor.col) + rightMatch[0];
      const direction: 1 | -1 = command === "*" ? 1 : -1;
      const next = findPattern(state, word, direction, count);
      return next
        ? {
            state: { ...next, search: { pattern: word, direction } },
            bell: false,
            trace: [command],
          }
        : fail(state);
    }
    case "v":
    case "V":
    case "<C-v>": {
      const mode =
        command === "v"
          ? "visual"
          : command === "V"
            ? "visual-line"
            : "visual-block";
      return {
        state: {
          ...state,
          mode,
          selectionAnchor: { line: state.cursor.line, col: state.cursor.col },
          pending: [],
        },
        bell: false,
        trace: [command],
      };
    }
    case ">":
    case "<": {
      const next = applyOperator(state, command, {
        start: { line: state.cursor.line, col: 0 },
        end: { line: state.cursor.line + count - 1, col: 0 },
        linewise: true,
      });
      return { state: next, bell: false, trace: [`${command}${command}`] };
    }
    default:
      return fail(state);
  }
}

function stepInternal(
  state: Snapshot,
  token: KeyToken,
  replayDepth: number,
): StepResult {
  let result =
    state.mode === "insert"
      ? insertStep(state, token)
      : state.mode === "command"
        ? commandStep(state, token)
        : state.mode.startsWith("visual")
          ? visualStep(state, token)
          : normalStep(state, token, replayDepth);
  if (state.recordingRegister && token !== "q") {
    const recorded = [...(state.macros[state.recordingRegister] ?? []), token];
    result = {
      ...result,
      state: {
        ...result.state,
        macros: { ...result.state.macros, [state.recordingRegister]: recorded },
      },
    };
  }
  return result;
}

export function step(state: Snapshot, token: KeyToken): StepResult {
  return stepInternal(state, token, 0);
}
