import { definePuzzle } from "../types.ts";

export default definePuzzle({
  id: "test-out-tier3",
  title: "Full Diagnostic: Tier 3",
  robotName: "HAULER-7",
  role: "test-out",
  chapter: "airlock-network",
  // Deliberately exercises every command tier 3 introduces: a count on a motion,
  // d{motion}, c{motion}, y{motion}, a word object, a delimiter object, and <C-a>/<C-x>.
  start: [
    "wait wait wait move(1)",
    "grab('junkk')",
    "turn(lleft)",
    "X",
    "open(bay0)",
  ],
  cursor: { line: 0, col: 0 },
  target: ["move(4)", "grab('junk')", "turn(left)", "turn(left)", "open(bay1)"],
  optimal:
    "ccmove(4)<Esc>jccgrab('junk')<Esc>jccturn(left)<Esc>jccturn(left)<Esc>jccopen(bay1)<Esc>",
  budget: { pass: 78, two: 72 },
  helper: "",
  hints: [],
  scene: {
    tiles: ["......", ".....B", "......"],
    robotStart: { x: 0, y: 1, facing: "E" },
    entities: [
      { kind: "cargo", name: "junk", x: 4, y: 1 },
      { kind: "door", name: "bay1", tile: "B", open: false },
    ],
    objective: {
      text: "HAULER-7 moves four, grabs the junk, turns around and opens bay 1.",
      conditions: [
        { holding: "junk" },
        { robotFacing: "W" },
        { device: { name: "bay1", is: "open" } },
      ],
    },
  },
});
