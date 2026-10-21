import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "26-indent-intro",
  title: "Flat Block",
  robotName: "HAULER-7",
  concept: "Indent",
  role: "introductory",
  start: ["repeat 3 {", "move(2)", "}"],
  cursor: { line: 1, col: 0 },
  target: ["repeat 3 {", "  move(2)", "}"],
  optimal: ">>",
  budget: { pass: 6, two: 3 },
  helper: ">> indents the current line one shiftwidth (two spaces, the engine's fixed profile). The Robot Program language requires each line to sit at 2 × its brace depth.",
  hints: ["The line inside the braces must be indented two spaces to parse. >> does it in one step."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "HAULER-7 moves twice, three times over.", conditions: [{ text: "Program parses; the repeat block's body is correctly indented." }] },
  },
});
