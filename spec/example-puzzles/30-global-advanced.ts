import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "30-global-advanced",
  title: "Debug Log Flood",
  robotName: "SCANNER-4",
  concept: "Global",
  role: "advanced",
  start: ["# debug: entering loop", "open(bay1)", "# debug: bay open", "move(2)", "# debug: moved", "close(bay1)"],
  cursor: { line: 0, col: 0 },
  target: ["open(bay1)", "move(2)", "close(bay1)"],
  optimal: ":g/^#/d<CR>",
  budget: { pass: 14, two: 10 },
  helper: ":g/pattern/cmd runs an ex command on every line matching pattern, across the whole program; :v is its inverse, matching every line that doesn't.",
  hints: ["Every debug line starts with #. :g/^#/d deletes all of them in one command."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "SCANNER-4 opens the bay, moves, then closes it, with no debug noise.", conditions: [{ text: "Program parses with exactly three statements and no comment lines." }] },
  },
});
