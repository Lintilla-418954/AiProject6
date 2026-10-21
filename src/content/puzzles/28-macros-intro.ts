import { definePuzzle } from "../types.ts";

export default definePuzzle({
  id: "28-macros-intro",
  title: "Long Wait",
  robotName: "PUMP-9",
  concept: "Macros",
  role: "introductory",
  start: ["wait(1)", "wait(1)", "wait(1)", "wait(1)", "move(2)"],
  cursor: { line: 0, col: 5 },
  target: ["wait(9)", "wait(9)", "wait(9)", "wait(9)", "move(2)"],
  optimal: "8<C-a>j0f18<C-a>j0f18<C-a>j0f18<C-a>",
  helper:
    "q{reg} records a macro into a register until q stops it; @{reg} replays it. Record the fix for one line plus the move to the next, then replay for the rest.",
  hints: [
    "Record with qa: 8<C-a> adds 8 to reach 9, j0 moves down to the next line's start, q stops. @a replays that whole fix-and-move on each remaining line.",
    "Trace the cursor route, then apply the named command at the corruption.",
  ],
  scene: {
    tiles: [".....", "..DP.", "....."],
    robotStart: { x: 1, y: 1, facing: "E" },
    entities: [
      {
        kind: "door",
        name: "blast",
        tile: "D",
        open: false,
        schedule: [{ at: 36, open: true }],
      },
    ],
    objective: {
      text: "PUMP-9 holds for 36 ticks until the blast door opens, then moves onto the pad.",
      conditions: [{ robotAt: { x: 3, y: 1 } }],
    },
  },
});
