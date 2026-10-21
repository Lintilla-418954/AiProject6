// PROTOTYPE: proves beam results optimal by exhaustive search to length-1, under a node budget.
import { initialState } from "./engine.ts";
import { solveBeam, solveMacro, type Toolkit } from "./solver.ts";

const T3: Toolkit = { name: "T3", normal: ["h", "j", "k", "l", "x", "i", "a", "A", "o", "d", "p", "P", "r", "0", "$", "w", "b", "e", "c", "y", "D", "C", "J", "~"], counts: true, charArgs: [], insert: true };
const T4: Toolkit = { ...T3, name: "T4", normal: [...T3.normal, "f", "t", "F", "T", "."] };
const cases: [string, string[], string[], Toolkit][] = [
  ["missing line", ["move 3", "grab"], ["move 3", "turn", "grab"], T3],
  ["change word", ["turn rihgt"], ["turn left"], T3],
  ["change in quotes", ['say("helo")'], ['say("hi")'], T4],
  ["repeat fix", ["mov 1", "mov 2", "mov 3"], ["move 1", "move 2", "move 3"], T4],
];
const nodes = Number(process.env.NODES ?? 12_000_000);
for (const [name, s, t, kit] of cases.filter((c) => !process.env.CASE || c[0] === process.env.CASE)) {
  const st = initialState(s);
  const b = solveBeam(st, t, kit, 30, 5000);
  const len = b.solution!.length;
  const v = solveMacro(st, t, kit, len - 1, nodes);
  const mem = Math.round(process.memoryUsage().heapUsed / 1e6);
  console.log(name.padEnd(17), kit.name, `beam ${len}: ${b.solution!.join("")}`.padEnd(32), v.aborted ? `UNPROVEN (budget hit at cost ${v.depth})` : v.solution ? `SHORTER ${v.solution.join("")}` : "PROVEN OPTIMAL", `${v.expanded} expanded`, `${Math.round(v.ms / 1000)}s`, `${mem}MB`);
}
