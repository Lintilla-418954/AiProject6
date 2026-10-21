import { definePuzzle } from "./types.ts";

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
  budget: { pass: 6, two: 4 },
  helper: "<C-a> adds one to the number under or after the cursor; <C-x> subtracts. Repeat it to cover a bigger gap.",
  hints: ["Cursor sits on the 1. Two <C-a> presses turn it into 3."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "PUMP-9 waits three ticks before moving.", conditions: [{ text: "Program parses; wait() argument equals 3." }] },
  },
});
