import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "15-delete-with-motion-advanced",
  title: "Stutter",
  robotName: "WELDER-2",
  concept: "Delete with motion",
  role: "advanced",
  start: ["move(1)", "say(\"all all all clear\")"],
  cursor: { line: 1, col: 5 },
  target: ["move(1)", "say(\"clear\")"],
  optimal: "3dw",
  budget: { pass: 8, two: 5 },
  helper: "d{motion} deletes from the cursor to wherever the motion would land. A count before an operator repeats it: 3dw deletes three words, from Counts.",
  hints: ["Cursor sits on the first all. 3dw deletes all three words and the spaces after them in one command."],
  scene: {
    tiles: ["......", "..P...", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: {
      text: "WELDER-2 moves onto the pad and reports clear, without stuttering.",
      conditions: [{ robotAt: { x: 2, y: 1 } }, { said: "clear" }],
    },
  },
});
