import { definePuzzle } from "../types.ts";

export default definePuzzle({
  id: "05-character-seek-advanced",
  title: "Wrong Valve, Wrong Flow",
  robotName: "PUMP-9",
  concept: "Character seek",
  role: "advanced",
  start: ["set(valve.1, 11)"],
  cursor: { line: 0, col: 0 },
  target: ["set(valve.9, 99)"],
  optimal: "f1r9;r9;r9",
  helper:
    "f t F T jump the cursor to a character on the line; ; repeats the last f/t/F/T search. r{char} replaces one character, from Overwrite.",
  hints: [
    "f1 lands on the first 1. r9 fixes it. ; repeats the f1 search for the next 1, twice more.",
    "Trace the cursor route, then apply the named command at the corruption.",
  ],
  scene: {
    tiles: ["......", ".P....", "......"],
    robotStart: { x: 1, y: 1, facing: "E" },
    entities: [{ kind: "device", name: "valve.9", value: 0, min: 0, max: 99 }],
    objective: {
      text: "PUMP-9 opens valve 9 to full flow.",
      conditions: [{ device: { name: "valve.9", is: 99 } }],
    },
  },
});
