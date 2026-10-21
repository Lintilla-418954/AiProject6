import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "29-substitute-integration",
  title: "Wrong Bay, Everywhere",
  robotName: "DOCK-1",
  concept: "Substitute",
  role: "integration",
  start: ["open(bay7)", "move(2)", "close(bay7)"],
  cursor: { line: 0, col: 0 },
  target: ["open(bay3)", "move(2)", "close(bay3)"],
  optimal: ":%s/bay7/bay3/g<CR>",
  budget: { pass: 26, two: 19 },
  helper: ":%s/pat/repl/g runs a Substitute over every line (the % range) and every match per line (the g flag), replacing each occurrence of the pattern.",
  hints: ["bay7 appears twice. :%s/bay7/bay3/g<CR> fixes both in one command."],
  scene: {
    tiles: [".....", ".B...", "....."],
    robotStart: { x: 0, y: 1, facing: "E" },
    entities: [
      { kind: "door", name: "bay3", tile: "B", open: false },
    ],
    objective: {
      text: "DOCK-1 opens bay 3, passes through, and closes it behind itself.",
      conditions: [{ robotAt: { x: 2, y: 1 } }, { device: { name: "bay3", is: "closed" } }],
    },
  },
});
