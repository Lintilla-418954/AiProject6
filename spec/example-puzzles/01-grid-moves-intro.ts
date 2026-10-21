import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "01-grid-moves-intro",
  title: "Loose Wire",
  robotName: "HAULER-7",
  concept: "Grid moves",
  role: "introductory",
  start: ["move(1)", "turn(left)", "movee(2)"],
  cursor: { line: 0, col: 0 },
  target: ["move(1)", "turn(left)", "move(2)"],
  optimal: "jjllllx",
  budget: { pass: 14, two: 9 },
  helper: "h j k l move the cursor one cell at a time. x cuts the character under the cursor.",
  hints: ["Move down twice then right four times to reach the extra e, then press x."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "HAULER-7 runs its program without halting on a garbled instruction.", conditions: [{ text: "Program parses line by line with no garbled instruction." }] },
  },
});
