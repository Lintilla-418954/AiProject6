import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "25-visual-block-advanced",
  title: "Stray Column",
  robotName: "DOCK-1",
  concept: "Visual block",
  role: "advanced",
  start: ["open(bay1)9", "open(bay2)9", "open(bay3)9"],
  cursor: { line: 0, col: 10 },
  target: ["open(bay1)", "open(bay2)", "open(bay3)"],
  optimal: "<C-v>2jx",
  budget: { pass: 8, two: 5 },
  helper: "<C-v> starts a block Visual selection: a rectangle spanning several lines at the same columns. x then cuts that whole block at once, from Grid moves.",
  hints: ["The extra 9 sits at the same column on all three lines. <C-v> then 2j selects that column down through all three; x removes it everywhere in one step."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "DOCK-1 opens bays 1, 2 and 3 with no stray tokens.", conditions: [{ text: "Program parses; each open() call has a clean single-digit bay number." }] },
  },
});
