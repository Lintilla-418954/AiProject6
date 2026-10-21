// PROTOTYPE: run with `npm run prototype:solver`; measures solver blow-up per Toolkit and buffer.
import { initialState, run, parseKeys, isSolved } from "./engine.ts";
import { solve, solveMacro, solveBeam, type Toolkit } from "./solver.ts";

const T1: Toolkit = { name: "T1 hjkl x", normal: ["h", "j", "k", "l", "x"], counts: false, charArgs: [], insert: false };
const T2: Toolkit = { name: "T2 +insert/dd/p/r", normal: [...T1.normal, "i", "a", "A", "o", "d", "p", "P", "r", "0", "$"], counts: false, charArgs: [], insert: true };
const T3: Toolkit = { name: "T3 +words/ops/counts", normal: [...T2.normal, "w", "b", "e", "c", "y", "D", "C", "J", "~"], counts: true, charArgs: [], insert: true };
const T4: Toolkit = { name: "T4 +f/t/./textobj", normal: [...T3.normal, "f", "t", "F", "T", "."], counts: true, charArgs: ["*"], insert: true };

interface P { name: string; start: string[]; target: string[]; hand: string; kits: Toolkit[] }

const puzzles: P[] = [
  { name: "swap typo", start: ["mvoe 3"], target: ["moe 3"], hand: "lx", kits: [T1, T2, T3, T4] },
  { name: "two deletes", start: ["movve 33", "turn left"], target: ["move 3", "turn left"], hand: "lllxllx", kits: [T1, T2, T3, T4] },
  { name: "wrong digit", start: ["move 9"], target: ["move 2"], hand: "$r2", kits: [T2, T3, T4] },
  { name: "missing line", start: ["move 3", "grab"], target: ["move 3", "turn", "grab"], hand: "oturn<Esc>", kits: [T2, T3, T4] },
  { name: "swap lines", start: ["grab", "move 3", "drop"], target: ["move 3", "grab", "drop"], hand: "ddp", kits: [T2, T3, T4] },
  { name: "change word", start: ["turn rihgt"], target: ["turn left"], hand: "wcwleft<Esc>", kits: [T3, T4] },
  { name: "delete words", start: ["move fast fast fast 3"], target: ["move 3"], hand: "w3dw", kits: [T3, T4] },
  { name: "repeat fix", start: ["mov 1", "mov 2", "mov 3"], target: ["move 1", "move 2", "move 3"], hand: "llae<Esc>jh.jh.", kits: [T3, T4] },
  { name: "change in quotes", start: ['say("helo")'], target: ['say("hi")'], hand: 'f"ci"hi<Esc>', kits: [T4] },
  { name: "long rewrite", start: ["loop 3 {", "  move 1", "  trun lfet", "}"], target: ["loop 3 {", "  move 1", "  turn left", "}"], hand: "jjwcwturn<Esc>wcwleft<Esc>", kits: [T4] },
];

const budget = Number(process.env.NODES ?? 3_000_000);
const rows: string[] = [];
for (const p of puzzles) {
  const start = initialState(p.start);
  const hand = parseKeys(p.hand);
  const ok = isSolved(run(start, hand), p.target);
  for (const kit of p.kits) {
    const r = process.env.MODE === "beam" ? solveBeam(start, p.target, kit, hand.length, Number(process.env.WIDTH ?? 20000)) : (process.env.MODE === "bfs" ? solve : solveMacro)(start, p.target, kit, hand.length, budget);
    const verdict = r.aborted ? `ABORT at depth ${r.depth}` : r.solution ? `found ${r.solution.length}: ${r.solution.join("")}` : `none <= ${hand.length}`;
    const branching = r.perDepth.length > 2 ? (r.perDepth[r.perDepth.length - 2] / Math.max(1, r.perDepth[r.perDepth.length - 3])).toFixed(1) : "-";
    rows.push([p.name.padEnd(17), kit.name.padEnd(21), `hand ${hand.length}${ok ? "" : "(BROKEN)"}`.padEnd(9), verdict.padEnd(40), `${r.expanded}`.padStart(9), `${Math.round(r.ms)}ms`.padStart(8), `b≈${branching}`, `frontier ${r.perDepth.join(",")}`].join(" "));
    console.log(rows[rows.length - 1]);
  }
}
