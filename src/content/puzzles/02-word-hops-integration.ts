import { definePuzzle } from "../types.ts";

export default definePuzzle({
  id: "02-word-hops-integration",
  title: "Stray Letter",
  robotName: "WELDER-2",
  concept: "Word hops",
  role: "integration",
  start: ["turn(left)", "grabx('bolt')"],
  cursor: { line: 1, col: 0 },
  target: ["turn(left)", "grab('bolt')"],
  optimal: "ex",
  helper:
    "w b e hop by word. e lands on the end of the current word, so it can carry the cursor straight onto a stray letter for x (Grid moves) to cut.",
  hints: [
    'e jumps to the end of "grabx", landing right on the extra x.',
    "Trace the cursor route, then apply the named command at the corruption.",
  ],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    entities: [{ kind: "cargo", name: "bolt", x: 1, y: 1 }],
    objective: {
      text: "WELDER-2 turns to face the hull, then grabs the bolt.",
      conditions: [{ robotFacing: "N" }, { holding: "bolt" }],
    },
  },
});
