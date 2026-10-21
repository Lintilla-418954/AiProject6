import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "19-delimiter-objects-intro",
  title: "Wrong Cargo",
  robotName: "HAULER-7",
  concept: "Delimiter objects",
  role: "introductory",
  start: ["grab('scrap')"],
  cursor: { line: 0, col: 7 },
  target: ["grab('crate')"],
  optimal: "ci'crate<Esc>",
  budget: { pass: 16, two: 11 },
  helper: "i' selects the text inside a pair of quotes (a text object), without the quotes themselves. c{textobj} changes it in one step.",
  hints: ["Cursor anywhere inside 'scrap'. ci' deletes just scrap and drops you into Insert mode to type the replacement."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "HAULER-7 grabs the crate, not the scrap.", conditions: [{ text: "Program parses; grab() argument is 'crate'." }] },
  },
});
