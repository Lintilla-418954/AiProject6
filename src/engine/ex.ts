import { applyOperator, changed, type Operator } from "./operators.ts";
import type { Snapshot } from "./state.ts";

export interface ExResult {
  state: Snapshot;
  bell: boolean;
  commandIds: string[];
}

function parseAddress(value: string, state: Snapshot): number {
  if (value === "." || value === "") return state.cursor.line;
  if (value === "$") return state.lines.length - 1;
  return Math.max(0, Math.min(state.lines.length - 1, Number(value) - 1));
}

function rangeFrom(raw: string | undefined, state: Snapshot): [number, number] {
  if (!raw) return [state.cursor.line, state.cursor.line];
  if (raw === "%") return [0, state.lines.length - 1];
  const parts = raw.split(",");
  return [
    parseAddress(parts[0]!, state),
    parseAddress(parts[1] ?? parts[0]!, state),
  ];
}

function substitute(
  lines: string[],
  first: number,
  last: number,
  expression: string,
): boolean {
  const delimiter = expression[0];
  if (!delimiter) return false;
  const parts = expression.slice(1).split(delimiter);
  if (parts.length < 2) return false;
  const pattern = parts[0]!;
  const replacement = parts[1]!;
  const flags = parts[2] ?? "";
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags.includes("g") ? "g" : "");
  } catch {
    return false;
  }
  for (let line = first; line <= last; line++)
    lines[line] = lines[line]!.replace(regex, replacement);
  return true;
}

export function executeEx(state: Snapshot, rawCommand: string): ExResult {
  const command = rawCommand.trim();
  const rangeMatch = /^(%|(?:\d+|\.|\$)(?:,(?:\d+|\.|\$))?)?\s*(.*)$/.exec(
    command,
  );
  const rangeRaw = rangeMatch?.[1];
  const body = rangeMatch?.[2] ?? command;
  const [first, last] = rangeFrom(rangeRaw, state);
  const lines = [...state.lines];

  if (body.startsWith("s") && body.length > 1) {
    if (!substitute(lines, first, last, body.slice(1)))
      return {
        state: {
          ...state,
          mode: "normal",
          commandLine: "",
          message: "Pattern not found",
        },
        bell: true,
        commandIds: [":s"],
      };
    return {
      state: {
        ...changed(state, lines, first, state.cursor.col),
        mode: "normal",
        commandLine: "",
      },
      bell: false,
      commandIds: [rangeRaw === "%" ? ":%s" : ":s"],
    };
  }

  const global = /^([gv])(.)(.*?)\2(.*)$/.exec(body);
  if (global) {
    let pattern: RegExp;
    try {
      pattern = new RegExp(global[3]!);
    } catch {
      return {
        state: { ...state, mode: "normal", commandLine: "" },
        bell: true,
        commandIds: [`:${global[1]}`],
      };
    }
    const invert = global[1] === "v";
    const nested = global[4]!.trim();
    if (nested === "d") {
      const kept = lines.filter((line) => pattern.test(line) === invert);
      return {
        state: {
          ...changed(
            state,
            kept.length ? kept : [""],
            Math.min(first, Math.max(0, kept.length - 1)),
            0,
          ),
          mode: "normal",
          commandLine: "",
        },
        bell: false,
        commandIds: [`:${global[1]}`],
      };
    }
    if (nested.startsWith("s")) {
      for (let index = lines.length - 1; index >= 0; index--)
        if (pattern.test(lines[index]!) !== invert)
          substitute(lines, index, index, nested.slice(1));
      return {
        state: {
          ...changed(state, lines, first, 0),
          mode: "normal",
          commandLine: "",
        },
        bell: false,
        commandIds: [`:${global[1]}`],
      };
    }
  }

  if (/^d(?:elete)?$/.test(body)) {
    const next = applyOperator(state, "d" as Operator, {
      start: { line: first, col: 0 },
      end: { line: last, col: 0 },
      linewise: true,
    });
    return {
      state: { ...next, mode: "normal", commandLine: "" },
      bell: false,
      commandIds: [":d"],
    };
  }

  const copyMove = /^(m|move|t|copy)\s*(\d+|\.|\$)$/.exec(body);
  if (copyMove) {
    const destination = parseAddress(copyMove[2]!, state);
    const selected = lines.slice(first, last + 1);
    if (copyMove[1] === "m" || copyMove[1] === "move") {
      lines.splice(first, selected.length);
      const adjusted =
        destination > last
          ? destination - selected.length + 1
          : destination + 1;
      lines.splice(adjusted, 0, ...selected);
    } else lines.splice(destination + 1, 0, ...selected);
    return {
      state: {
        ...changed(
          state,
          lines,
          Math.min(lines.length - 1, destination + 1),
          0,
        ),
        mode: "normal",
        commandLine: "",
      },
      bell: false,
      commandIds: [copyMove[1]!.startsWith("m") ? ":m" : ":t"],
    };
  }

  return {
    state: {
      ...state,
      mode: "normal",
      commandLine: "",
      message: `Not an editor command: ${body}`,
    },
    bell: true,
    commandIds: [],
  };
}
