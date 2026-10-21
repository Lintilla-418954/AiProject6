import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "test-out-tier3",
  title: "Full Diagnostic: Tier 3",
  robotName: "HAULER-7",
  role: "test-out",
  chapter: "Tier 3 (provisional)",
  // Deliberately exercises every command tier 3 introduces: a count on a motion,
  // d{motion}, c{motion}, y{motion}, a word object, a delimiter object, and <C-a>/<C-x>.
  start: ["wait wait wait move(1)", "grab('junkk')", "turn(lleft)", "X", "open(bay0)"],
  cursor: { line: 0, col: 0 },
  target: ["move(4)", "grab('junk')", "turn(left)", "turn(left)", "open(bay1)"],
  optimal: "3dwf(lcl4<Esc>jfjdiwijunk<Esc>jci(left<Esc>0y$jVpjf0<C-a>",
  budget: { pass: 46, two: 34 },
  helper: "This Chapter's full Toolkit: counts before a motion or edit, d{motion}, c{motion}, y{motion}, word objects (iw/aw), delimiter objects, and <C-a>/<C-x>. Every one of them has a job here.",
  hints: [
    "3dw clears the three bare waits in one count-prefixed delete.",
    "f( then l then cl fixes move's argument: a plain change-with-motion, not a text object.",
    "On the next line, land on the j of junkk and diw it, then type junk: a word-object fix.",
    "On turn(lleft), ci( fixes the argument as a delimiter object instead.",
    "y$ yanks the fixed turn(left) line to the end; paste it over the placeholder X line with Vp, then <C-a> the bay number.",
  ],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "HAULER-7 moves four, grabs the junk, turns twice, opens bay 1.", conditions: [{ text: "Program parses; all five lines match the target exactly." }] },
  },
});
