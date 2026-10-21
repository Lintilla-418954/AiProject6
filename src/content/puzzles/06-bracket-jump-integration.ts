import { definePuzzle } from "../types.ts";

export default definePuzzle({
  id: "06-bracket-jump-integration",
  title: "Doubled Bracket",
  robotName: "SCANNER-4",
  concept: "Bracket jump",
  role: "integration",
  start: ["when sensor[1]] == 0 {", '  say("clear")', "}"],
  cursor: { line: 0, col: 11 },
  target: ["when sensor[1] == 0 {", '  say("clear")', "}"],
  optimal: "%lx",
  helper:
    "% jumps the cursor from a bracket to its matching partner. From there, l (Grid moves) and x clear what's left over.",
  hints: [
    "Cursor starts on [. % lands on its matching ]. One l lands on the stray extra ] right after it; x cuts it.",
    "Trace the cursor route, then apply the named command at the corruption.",
  ],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "N" },
    entities: [{ kind: "sensor", index: 1, reads: 0 }],
    objective: {
      text: "SCANNER-4 reports clear once sensor 1 reads zero.",
      conditions: [{ said: "clear" }],
    },
  },
});
