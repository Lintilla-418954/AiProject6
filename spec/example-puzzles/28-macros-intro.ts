import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "28-macros-intro",
  title: "Four Idle Pumps",
  robotName: "PUMP-9",
  concept: "Macros",
  role: "introductory",
  start: ["wait(1)", "wait(1)", "wait(1)", "wait(1)"],
  cursor: { line: 0, col: 5 },
  target: ["wait(9)", "wait(9)", "wait(9)", "wait(9)"],
  optimal: "qa8<C-a>j0q@a@a@a",
  budget: { pass: 22, two: 16 },
  helper: "q{reg} records a macro into a register until q stops it; @{reg} replays it. Record the fix for one line plus the move to the next, then replay for the rest.",
  hints: ["Record with qa: 8<C-a> adds 8 to reach 9, j0 moves down to the next line's start, q stops. @a replays that whole fix-and-move on each remaining line."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "PUMP-9 waits nine ticks, four times.", conditions: [{ text: "Program parses; every wait() argument equals 9." }] },
  },
});
