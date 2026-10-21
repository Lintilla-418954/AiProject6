import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "21-repeat-intro",
  title: "Three Bad Welds",
  robotName: "WELDER-2",
  concept: "Repeat",
  role: "introductory",
  start: ["weld(pump1)", "weld(pump2)", "weld(pump3)"],
  cursor: { line: 0, col: 0 },
  target: ["seal(pump1)", "seal(pump2)", "seal(pump3)"],
  optimal: "cwseal<Esc>j0.j0.",
  budget: { pass: 22, two: 16 },
  helper: ". repeats the last change exactly, including any inserted text. Move to the next spot and press . instead of retyping the change.",
  hints: ["Fix the first weld with c{motion} and Insert from earlier Concepts, then press . on each later line after moving the cursor back to column 0."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "WELDER-2 seals all three pumps.", conditions: [{ text: "Program parses; every line calls seal()." }] },
  },
});
