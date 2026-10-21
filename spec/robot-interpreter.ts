// Reference interpreter for spec/robot-language.md: parse, run in a Scene, check the Objective.
import type { Entity, Facing, ObjectiveCondition, SceneSpec } from "./example-puzzles/types.ts";

type Tok =
  | { k: "num"; v: number }
  | { k: "id"; v: string }
  | { k: "str"; v: string }
  | { k: "p"; v: string };

type Stmt =
  | { k: "move" | "wait"; n: number }
  | { k: "turn"; dir: "left" | "right" }
  | { k: "grab" | "say"; s: string }
  | { k: "drop" }
  | { k: "open" | "close"; dev: string }
  | { k: "set"; dev: string; n: number }
  | { k: "repeat"; n: number; body: Stmt[] }
  | { k: "when"; sensor: number; n: number; body: Stmt[] };

const RESERVED = new Set(["repeat", "when", "sensor", "left", "right"]);
const TICK_CAP = 500;

// Returns null on a lexical error.
function lex(src: string): Tok[] | null {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " ") i++;
    else if (c === "#") break;
    else if (/[0-9]/.test(c)) {
      const m = /^[0-9]+/.exec(src.slice(i))!;
      out.push({ k: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-z]/.test(c)) {
      const m = /^[a-z][a-z0-9]*(\.[a-z0-9]+)*/.exec(src.slice(i))!;
      out.push({ k: "id", v: m[0] });
      i += m[0].length;
    } else if (c === '"' || c === "'") {
      const end = src.indexOf(c, i + 1);
      if (end < 0) return null;
      out.push({ k: "str", v: src.slice(i + 1, end) });
      i = end + 1;
    } else if (src.startsWith("==", i)) {
      out.push({ k: "p", v: "==" });
      i += 2;
    } else if ("()[]{},".includes(c)) {
      out.push({ k: "p", v: c });
      i++;
    } else return null;
  }
  return out;
}

// Matches tokens against a shape: "num", "id", "str", or a literal punctuation/word.
function match(toks: Tok[], shape: string[]): Tok[] | null {
  if (toks.length !== shape.length) return null;
  for (let i = 0; i < shape.length; i++) {
    const t = toks[i];
    const s = shape[i];
    if (s === "num" || s === "id" || s === "str") {
      if (t.k !== s) return null;
    } else if (t.v !== s) return null;
  }
  return toks;
}

const device = (t: Tok) => (t.k === "id" && !RESERVED.has(t.v) ? t.v : null);

function parseStatement(toks: Tok[]): Stmt | null {
  let m: Tok[] | null;
  if ((m = match(toks, ["move", "(", "num", ")"]))) return { k: "move", n: m[2].v as number };
  if ((m = match(toks, ["wait", "(", "num", ")"]))) return { k: "wait", n: m[2].v as number };
  if ((m = match(toks, ["turn", "(", "left", ")"]))) return { k: "turn", dir: "left" };
  if ((m = match(toks, ["turn", "(", "right", ")"]))) return { k: "turn", dir: "right" };
  if ((m = match(toks, ["grab", "(", "str", ")"]))) return { k: "grab", s: m[2].v as string };
  if ((m = match(toks, ["say", "(", "str", ")"]))) return { k: "say", s: m[2].v as string };
  if ((m = match(toks, ["drop", "(", ")"]))) return { k: "drop" };
  for (const k of ["open", "close"] as const) {
    if ((m = match(toks, [k, "(", "id", ")"])) && device(m[2])) return { k, dev: m[2].v as string };
  }
  if ((m = match(toks, ["set", "(", "id", ",", "num", ")"])) && device(m[2])) return { k: "set", dev: m[2].v as string, n: m[4].v as number };
  return null;
}

export interface Parsed {
  program: Stmt[];
  errorLine: number | null;
}

export function parse(lines: string[]): Parsed {
  const root: Stmt[] = [];
  const stack: { body: Stmt[] }[] = [{ body: root }];
  const fail = (line: number): Parsed => ({ program: root, errorLine: line });
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].replace(/ +$/, "");
    if (raw.includes("\t")) return fail(i);
    const indent = raw.length - raw.trimStart().length;
    const toks = lex(raw.trimStart());
    if (!toks) return fail(i);
    if (toks.length === 0) continue;
    const depth = stack.length - 1;
    if (match(toks, ["}"])) {
      if (depth === 0 || indent !== 2 * (depth - 1)) return fail(i);
      const block = stack.pop() as unknown as Stmt;
      stack[stack.length - 1].body.push(block);
      continue;
    }
    if (indent !== 2 * depth) return fail(i);
    let m: Tok[] | null;
    if ((m = match(toks, ["repeat", "num", "{"]))) {
      stack.push({ k: "repeat", n: m[1].v as number, body: [] } as Stmt & { body: Stmt[] });
    } else if ((m = match(toks, ["when", "sensor", "[", "num", "]", "==", "num", "{"]))) {
      stack.push({ k: "when", sensor: m[3].v as number, n: m[6].v as number, body: [] } as Stmt & { body: Stmt[] });
    } else {
      const s = parseStatement(toks);
      if (!s) return fail(i);
      stack[stack.length - 1].body.push(s);
    }
  }
  return stack.length > 1 ? fail(lines.length) : { program: root, errorLine: null };
}

interface World {
  x: number;
  y: number;
  facing: Facing;
  holding: string | null;
  cargo: { name: string; x: number; y: number }[];
  doors: Map<string, Extract<Entity, { kind: "door" }>>;
  devices: Map<string, Extract<Entity, { kind: "device" }>>;
  sensors: Map<number, number | string>;
  said: string[];
  tick: number;
}

class Halt extends Error {}

const DELTA: Record<Facing, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const ORDER: Facing[] = ["N", "E", "S", "W"];

export interface RunResult {
  success: boolean;
  failure: string | null;
}

export function run(scene: SceneSpec, lines: string[]): RunResult {
  const w: World = {
    ...scene.robotStart,
    holding: null,
    cargo: [],
    doors: new Map(),
    devices: new Map(),
    sensors: new Map(),
    said: [],
    tick: 0,
  };
  for (const e of scene.entities ?? []) {
    if (e.kind === "door") w.doors.set(e.name, { ...e });
    else if (e.kind === "device") w.devices.set(e.name, { ...e });
    else if (e.kind === "cargo") w.cargo.push({ ...e });
    else w.sensors.set(e.index, e.reads);
  }
  const halt = (why: string): never => {
    throw new Halt(why);
  };
  const tileAt = (x: number, y: number) => scene.tiles[y]?.[x];
  const doorOn = (tile: string | undefined) => [...w.doors.values()].find((d) => d.tile === tile);

  const setDoor = (d: Extract<Entity, { kind: "door" }>, open: boolean) => {
    d.open = open;
    if (!open && tileAt(w.x, w.y) === d.tile) halt(`crushed by the ${d.name} door`);
    if (open && d.airlock) {
      const group = [...w.doors.values()].filter((o) => o.airlock === d.airlock);
      if (group.length > 1 && group.every((o) => o.open)) halt("DECOMPRESSION: airlock fully open");
    }
  };

  const tick = (act: () => void) => {
    if (w.tick >= TICK_CAP) halt("overheated");
    for (const d of w.doors.values()) for (const s of d.schedule ?? []) if (s.at === w.tick) setDoor(d, s.open);
    act();
    w.tick++;
  };

  const exec = (body: Stmt[]) => {
    for (const s of body) {
      switch (s.k) {
        case "move":
          for (let i = 0; i < s.n; i++)
            tick(() => {
              const [dx, dy] = DELTA[w.facing];
              const t = tileAt(w.x + dx, w.y + dy);
              if (t === undefined || t === "#") halt("crashed into the hull");
              const d = doorOn(t);
              if (d && !d.open) halt(`blocked by the closed ${d.name} door`);
              w.x += dx;
              w.y += dy;
            });
          break;
        case "wait":
          for (let i = 0; i < s.n; i++) tick(() => {});
          break;
        case "turn":
          tick(() => {
            w.facing = ORDER[(ORDER.indexOf(w.facing) + (s.dir === "right" ? 1 : 3)) % 4];
          });
          break;
        case "grab":
          tick(() => {
            if (w.holding) halt("hands already full");
            const i = w.cargo.findIndex((c) => c.name === s.s && c.x === w.x && c.y === w.y);
            if (i < 0) halt(`no ${s.s} here to grab`);
            w.cargo.splice(i, 1);
            w.holding = s.s;
          });
          break;
        case "drop":
          tick(() => {
            if (!w.holding) halt("not holding anything");
            w.cargo.push({ name: w.holding!, x: w.x, y: w.y });
            w.holding = null;
          });
          break;
        case "open":
        case "close":
          tick(() => {
            const d = w.doors.get(s.dev);
            if (!d) halt(w.devices.has(s.dev) ? `${s.dev} is not a door` : `no device ${s.dev}`);
            setDoor(d!, s.k === "open");
          });
          break;
        case "set":
          tick(() => {
            const d = w.devices.get(s.dev);
            if (!d) halt(w.doors.has(s.dev) ? `${s.dev} is not settable` : `no device ${s.dev}`);
            if (s.n < d!.min || s.n > d!.max) halt(`${s.dev} rejects ${s.n}`);
            d!.value = s.n;
          });
          break;
        case "say":
          tick(() => w.said.push(s.s));
          break;
        case "repeat":
          for (let i = 0; i < s.n; i++) exec(s.body);
          break;
        case "when": {
          const reads = w.sensors.get(s.sensor);
          if (reads === undefined) halt(`no sensor ${s.sensor}`);
          const value = typeof reads === "number" ? reads : w.devices.get(reads as string)?.value;
          if (value === s.n) exec(s.body);
          break;
        }
      }
    }
  };

  const holds = (c: ObjectiveCondition): boolean => {
    if ("robotAt" in c) return w.x === c.robotAt.x && w.y === c.robotAt.y;
    if ("robotFacing" in c) return w.facing === c.robotFacing;
    if ("cargoAt" in c) return w.cargo.some((k) => k.name === c.cargoAt.name && k.x === c.cargoAt.x && k.y === c.cargoAt.y);
    if ("holding" in c) return (w.holding ?? "none") === c.holding;
    if ("device" in c) {
      const d = w.doors.get(c.device.name);
      if (d) return (d.open ? "open" : "closed") === c.device.is;
      return w.devices.get(c.device.name)?.value === c.device.is;
    }
    return w.said.includes(c.said);
  };

  try {
    if (scene.maxLines !== undefined && lines.length > scene.maxLines) halt("program too large for memory");
    const { program, errorLine } = parse(lines);
    exec(program);
    if (errorLine !== null) halt("can't parse its program");
  } catch (e) {
    if (e instanceof Halt) return { success: false, failure: e.message };
    throw e;
  }
  const unmet = scene.objective.conditions.filter((c) => !holds(c));
  return unmet.length ? { success: false, failure: `objective not met: ${JSON.stringify(unmet)}` } : { success: true, failure: null };
}
