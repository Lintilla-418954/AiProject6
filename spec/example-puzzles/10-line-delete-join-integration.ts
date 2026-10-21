import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "10-line-delete-join-integration",
  title: "Split Command",
  robotName: "HAULER-7",
  concept: "Line delete & join",
  role: "integration",
  start: ["# TODO remove this debug line", "grab('crate'", ")", "move(3)"],
  cursor: { line: 0, col: 0 },
  target: ["grab('crate')", "move(3)"],
  optimal: "ddJ",
  budget: { pass: 9, two: 5 },
  helper: "dd cuts a whole line. J joins the next line onto this one; vim's J skips the usual space when the joined line starts with ')'.",
  hints: ["dd removes the debug comment, leaving the split grab() call on top. J glues the closing paren back on."],
  scene: {
    tiles: ["......", ".....P", "......"],
    robotStart: { x: 2, y: 1, facing: "E" },
    entities: [
      { kind: "cargo", name: "crate", x: 2, y: 1 },
    ],
    objective: {
      text: "HAULER-7 grabs the crate and carries it three cells to the pad.",
      conditions: [{ holding: "crate" }, { robotAt: { x: 5, y: 1 } }],
    },
  },
});
