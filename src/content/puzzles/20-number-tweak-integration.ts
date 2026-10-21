import { definePuzzle } from "../types.ts";

export default definePuzzle({
  id: "20-number-tweak-integration",
  title: "Off By Two",
  robotName: "PUMP-9",
  concept: "Number tweak",
  role: "integration",
  start: ["wait(1)", "move(3)"],
  cursor: { line: 0, col: 5 },
  target: ["wait(3)", "move(3)"],
  optimal: "<C-a><C-a>",
  helper:
    "<C-a> adds one to the number under or after the cursor; <C-x> subtracts. Repeat it to cover a bigger gap.",
  hints: [
    "Cursor sits on the 1. Two <C-a> presses turn it into 3.",
    "Trace the cursor route, then apply the named command at the corruption.",
  ],
  scene: {
    tiles: ["......", ".D.P..", "......"],
    robotStart: { x: 0, y: 1, facing: "E" },
    entities: [
      {
        kind: "door",
        name: "blast",
        tile: "D",
        open: false,
        schedule: [{ at: 3, open: true }],
      },
    ],
    objective: {
      text: "PUMP-9 waits for the blast door to open, then moves onto the pad.",
      conditions: [{ robotAt: { x: 3, y: 1 } }],
    },
  },
});
