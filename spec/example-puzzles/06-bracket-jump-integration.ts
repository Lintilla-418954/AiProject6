import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "06-bracket-jump-integration",
  title: "Doubled Bracket",
  robotName: "SCANNER-4",
  concept: "Bracket jump",
  role: "integration",
  start: ["when sensor[1]] == 0 {", "  say(\"clear\")", "}"],
  cursor: { line: 0, col: 11 },
  target: ["when sensor[1] == 0 {", "  say(\"clear\")", "}"],
  optimal: "%lx",
  budget: { pass: 8, two: 4 },
  helper: "% jumps the cursor from a bracket to its matching partner. From there, l (Grid moves) and x clear what's left over.",
  hints: ["Cursor starts on [. % lands on its matching ]. One l lands on the stray extra ] right after it; x cuts it."],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "N" },
    objective: { text: "SCANNER-4 reports clear once sensor 1 reads zero.", conditions: [{ text: "Program parses; the when-condition is well-formed." }] },
  },
});
