import { definePuzzle } from "../types.ts";

export default definePuzzle({
  id: "25-visual-block-advanced",
  title: "Stray Column",
  robotName: "DOCK-1",
  concept: "Visual block",
  role: "advanced",
  start: ["open(bay1)9", "open(bay2)9", "open(bay3)9"],
  cursor: { line: 0, col: 10 },
  target: ["open(bay1)", "open(bay2)", "open(bay3)"],
  optimal: "<C-v>jjx",
  helper:
    "<C-v> starts a block Visual selection: a rectangle spanning several lines at the same columns. x then cuts that whole block at once, from Grid moves.",
  hints: [
    "The extra 9 sits at the same column on all three lines. <C-v> then 2j selects that column down through all three; x removes it everywhere in one step.",
    "Trace the cursor route, then apply the named command at the corruption.",
  ],
  scene: {
    tiles: ["ABC...", "......", ".P....", "......"],
    robotStart: { x: 1, y: 2, facing: "E" },
    entities: [
      { kind: "door", name: "bay1", tile: "A", open: false },
      { kind: "door", name: "bay2", tile: "B", open: false },
      { kind: "door", name: "bay3", tile: "C", open: false },
    ],
    objective: {
      text: "DOCK-1 opens bays 1, 2 and 3.",
      conditions: [
        { device: { name: "bay1", is: "open" } },
        { device: { name: "bay2", is: "open" } },
        { device: { name: "bay3", is: "open" } },
      ],
    },
  },
});
