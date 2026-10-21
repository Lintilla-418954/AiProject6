import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "21-repeat-intro",
  title: "Three Open Hatches",
  robotName: "WELDER-2",
  concept: "Repeat",
  role: "introductory",
  start: ["open(hatch1)", "open(hatch2)", "open(hatch3)"],
  cursor: { line: 0, col: 0 },
  target: ["close(hatch1)", "close(hatch2)", "close(hatch3)"],
  optimal: "cwclose<Esc>j0.j0.",
  budget: { pass: 23, two: 17 },
  helper: ". repeats the last change exactly, including any inserted text. Move to the next spot and press . instead of retyping the change.",
  hints: ["Fix the first line with cw and type close, then press . on each later line after moving the cursor back to column 0."],
  scene: {
    tiles: ["ABC...", "......", ".P....", "......"],
    robotStart: { x: 1, y: 2, facing: "E" },
    entities: [
      { kind: "door", name: "hatch1", tile: "A", open: true },
      { kind: "door", name: "hatch2", tile: "B", open: true },
      { kind: "door", name: "hatch3", tile: "C", open: true },
    ],
    objective: {
      text: "WELDER-2 seals all three hatches.",
      conditions: [{ device: { name: "hatch1", is: "closed" } }, { device: { name: "hatch2", is: "closed" } }, { device: { name: "hatch3", is: "closed" } }],
    },
  },
});
