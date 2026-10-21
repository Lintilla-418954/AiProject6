import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "15-delete-with-motion-advanced",
  title: "Three Dead Steps",
  robotName: "WELDER-2",
  concept: "Delete with motion",
  role: "advanced",
  start: ["move(1) wait wait wait turn(left)"],
  cursor: { line: 0, col: 8 },
  target: ["move(1) turn(left)"],
  optimal: "3dw",
  budget: { pass: 8, two: 5 },
  helper: "d{motion} deletes from the cursor to wherever the motion would land. A count before an operator repeats it: 3dw deletes three words, from Counts.",
  hints: ["Cursor sits on the first bare wait. 3dw deletes all three wait tokens and the spaces after them in one command."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "WELDER-2 moves once, then turns, without idling.", conditions: [{ text: "Program parses with exactly two statements." }] },
  },
});
