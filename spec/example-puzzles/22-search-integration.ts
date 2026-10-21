import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "22-search-integration",
  title: "Find The Fault",
  robotName: "SCANNER-4",
  concept: "Search",
  role: "integration",
  start: ["open(bay1)", "move(2)", "grab('core')", "closeX(bay1)"],
  cursor: { line: 0, col: 0 },
  target: ["open(bay1)", "move(2)", "grab('core')", "close(bay1)"],
  optimal: "/X<CR>x",
  budget: { pass: 8, two: 5 },
  helper: "/{pattern}<CR> searches forward for text and jumps the cursor to the first match. Combine with x from Grid moves to fix what you land on.",
  hints: ["/X<CR> jumps straight to the garbled line, landing on the stray X; x cuts it."],
  scene: {
    tiles: [".....", ".B...", "....."],
    robotStart: { x: 0, y: 1, facing: "E" },
    entities: [
      { kind: "door", name: "bay1", tile: "B", open: false },
      { kind: "cargo", name: "core", x: 2, y: 1 },
    ],
    objective: {
      text: "SCANNER-4 opens the bay, retrieves the core, then closes the bay behind it.",
      conditions: [{ holding: "core" }, { device: { name: "bay1", is: "closed" } }],
    },
  },
});
