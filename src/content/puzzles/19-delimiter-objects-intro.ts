import { definePuzzle } from "../types.ts";

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
  helper:
    "i' selects the text inside a pair of quotes (a text object), without the quotes themselves. c{textobj} changes it in one step.",
  hints: [
    "Cursor anywhere inside 'scrap'. ci' deletes just scrap and drops you into Insert mode to type the replacement.",
    "Trace the cursor route, then apply the named command at the corruption.",
  ],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    entities: [
      { kind: "cargo", name: "crate", x: 1, y: 1 },
      { kind: "cargo", name: "scrap", x: 1, y: 1 },
    ],
    objective: {
      text: "HAULER-7 grabs the crate, not the scrap.",
      conditions: [{ holding: "crate" }],
    },
  },
});
