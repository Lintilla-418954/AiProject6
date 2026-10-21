import { definePuzzle } from "./types.ts";

export default definePuzzle({
  id: "05-character-seek-advanced",
  title: "Three Leaks",
  robotName: "PUMP-9",
  concept: "Character seek",
  role: "advanced",
  start: ["close(pump1) close(pump1) close(pump1)"],
  cursor: { line: 0, col: 0 },
  target: ["close(pump9) close(pump9) close(pump9)"],
  optimal: "f1r9;r9;r9",
  budget: { pass: 18, two: 12 },
  helper: "f t F T jump the cursor to a character on the line; ; repeats the last f/t/F/T search. r{char} replaces one character, from Overwrite.",
  hints: ["f1 lands on the first digit. r9 fixes it. ; repeats the f1 search for the next digit, twice more."],
  scene: {
    tiles: ["........", ".P......", "........"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: { text: "PUMP-9 seals all three leaking pumps.", conditions: [{ text: "Program parses; all three close() calls target pump9." }] },
  },
});
