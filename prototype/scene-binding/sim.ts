// PROTOTYPE: throwaway robot-instruction interpreter and station simulation.
export type Dir = "N" | "E" | "S" | "W";

export interface World {
  robot: { x: number; y: number; dir: Dir; holding: boolean };
  crate: { x: number; y: number } | null;
  doors: Record<string, boolean>;
}

export interface Frame {
  world: World;
  line: number;
  event: string;
}

export interface Puzzle {
  id: string;
  name: string;
  robot: string;
  task: string;
  map: string[];
  start: World;
  doorTiles: Record<string, string>;
  goal: (w: World, map: string[]) => boolean;
  startText: string[];
  targetText: string[];
  budget: { three: number; two: number; pass: number };
  optimal: string;
  helper: string;
  hint: string;
}

export interface SimResult {
  frames: Frame[];
  failure: { line: number; reason: string } | null;
  success: boolean;
  linesOk: number;
}

const DELTA: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const LEFT: Record<Dir, Dir> = { N: "W", W: "S", S: "E", E: "N" };
const RIGHT: Record<Dir, Dir> = { N: "E", E: "S", S: "W", W: "N" };

const clone = (w: World): World => JSON.parse(JSON.stringify(w));

export function parseLine(raw: string): string | null {
  const l = raw.trim();
  if (l === "") return "NOP";
  if (/^MOVE [1-9]$/.test(l)) return l;
  if (/^TURN (LEFT|RIGHT)$/.test(l)) return l;
  if (l === "GRAB" || l === "DROP") return l;
  if (/^(OPEN|CLOSE) (INNER|OUTER)$/.test(l)) return l;
  return null;
}

export function simulate(p: Puzzle, lines: string[]): SimResult {
  let w = clone(p.start);
  const frames: Frame[] = [{ world: clone(w), line: -1, event: "standing by" }];
  const tile = (x: number, y: number) => p.map[y]?.[x];
  const doorAt = (x: number, y: number) => Object.entries(p.doorTiles).find(([, c]) => c === tile(x, y))?.[0];
  const fail = (line: number, reason: string): SimResult => {
    frames.push({ world: clone(w), line, event: reason });
    return { frames, failure: { line, reason }, success: false, linesOk: line };
  };

  for (let i = 0; i < lines.length; i++) {
    const cmd = parseLine(lines[i]);
    if (cmd === null) return fail(i, `garbled instruction: "${lines[i].trim()}"`);
    if (cmd === "NOP") continue;
    const [op, arg] = cmd.split(" ");
    if (op === "MOVE") {
      for (let s = 0; s < Number(arg); s++) {
        const [dx, dy] = DELTA[w.robot.dir];
        const nx = w.robot.x + dx;
        const ny = w.robot.y + dy;
        const t = tile(nx, ny);
        if (t === undefined || t === "#") return fail(i, "crashed into the hull");
        const d = doorAt(nx, ny);
        if (d && !w.doors[d]) return fail(i, `blocked by closed ${d} door`);
        w.robot.x = nx;
        w.robot.y = ny;
        if (w.robot.holding && w.crate) w.crate = { x: nx, y: ny };
        frames.push({ world: clone(w), line: i, event: cmd });
      }
    } else if (op === "TURN") {
      w.robot.dir = arg === "LEFT" ? LEFT[w.robot.dir] : RIGHT[w.robot.dir];
      frames.push({ world: clone(w), line: i, event: cmd });
    } else if (op === "GRAB") {
      if (!w.crate || w.crate.x !== w.robot.x || w.crate.y !== w.robot.y) return fail(i, "nothing here to grab");
      w.robot.holding = true;
      frames.push({ world: clone(w), line: i, event: cmd });
    } else if (op === "DROP") {
      if (!w.robot.holding) return fail(i, "not holding anything");
      w.robot.holding = false;
      frames.push({ world: clone(w), line: i, event: cmd });
    } else if (op === "OPEN" || op === "CLOSE") {
      if (!(arg in w.doors)) return fail(i, `no ${arg} door here`);
      if (op === "CLOSE" && doorAt(w.robot.x, w.robot.y) === arg) return fail(i, `${arg} door crushed the robot`);
      w.doors[arg] = op === "OPEN";
      frames.push({ world: clone(w), line: i, event: cmd });
      if (Object.keys(w.doors).length > 1 && Object.values(w.doors).every(Boolean)) return fail(i, "DECOMPRESSION: both airlock doors open");
    }
  }
  const success = p.goal(w, p.map);
  if (!success) frames.push({ world: clone(w), line: lines.length - 1, event: "program ended, task not done" });
  return { frames, failure: success ? null : { line: lines.length, reason: "task not complete" }, success, linesOk: lines.length };
}

export const PUZZLES: Puzzle[] = [
  {
    id: "cargo",
    name: "Cargo Bay 3",
    robot: "HAULER-7",
    task: "Move the crate onto the loading pad.",
    map: ["........", ".....P..", "........", "........", "........"],
    start: { robot: { x: 1, y: 3, dir: "E", holding: false }, crate: { x: 5, y: 3 }, doors: {} },
    doorTiles: {},
    goal: (w, map) => !!w.crate && !w.robot.holding && map[w.crate.y][w.crate.x] === "P",
    startText: ["MOVE 4", "GARB", "TURN LEFT", "MOVE 7", "DROP"],
    targetText: ["MOVE 4", "GRAB", "TURN LEFT", "MOVE 2", "DROP"],
    budget: { three: 9, two: 12, pass: 20 },
    optimal: "jlxpjj$r2",
    helper: "h j k l move the cursor. x cuts the character under the cursor; p puts it back after the cursor. r<char> replaces one character.",
    hint: "Two letters swapped? Put the cursor on the first and press x then p.",
  },
  {
    id: "airlock",
    name: "Airlock B",
    robot: "WELDER-2",
    task: "Get outside to the repair pad without venting the station.",
    map: ["####vvv", ".I.OvPv", "####vvv"],
    start: { robot: { x: 0, y: 1, dir: "E", holding: false }, crate: null, doors: { INNER: false, OUTER: false } },
    doorTiles: { INNER: "I", OUTER: "O" },
    goal: (w, map) => map[w.robot.y][w.robot.x] === "P" && !w.doors.INNER && !w.doors.OUTER,
    startText: ["OPEN INNER", "MOVE 2", "OPEN OUTER", "CLOSE INNER", "~#!@ SIGNAL NOISE @!#~", "MOVE 3", "CLOSE OUTER"],
    targetText: ["OPEN INNER", "MOVE 2", "CLOSE INNER", "OPEN OUTER", "MOVE 3", "CLOSE OUTER"],
    budget: { three: 8, two: 11, pass: 18 },
    optimal: "jjddpjdd",
    helper: "dd cuts the whole line; p puts a cut line below the cursor's line. A count repeats a motion: 2j moves down two lines.",
    hint: "On OPEN OUTER, ddp swaps it with the line below. Then dd the noise.",
  },
];
