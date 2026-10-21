import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "08-insert-intro",
  title: "Missing Target",
  robotName: "DOCK-1",
  concept: "Insert",
  role: "introductory",
  start: ["move()"],
  cursor: { line: 0, col: 5 },
  target: ["move(3)"],
  optimal: "i3<Esc>",
  budget: { pass: 10, two: 5 },
  helper: "i enters Insert mode before the cursor; type the missing text, then <Esc> returns to Normal mode.",
  hints: ["Cursor sits on the closing paren. i opens a gap before it; type 3, then <Esc>."],
  scene: {
    tiles: ["......", ".....P", "......"],
    robotStart: { x: 2, y: 1, facing: "E" },
    objective: {
      text: "DOCK-1 moves three cells forward onto the pad.",
      conditions: [{ robotAt: { x: 5, y: 1 } }],
    },
  },
});
