import { puzzles } from "../../src/content/index.ts";
import { parseKeys } from "../../src/engine/keys.ts";
import { findShorter } from "./solver.ts";

let shorter = 0;
for (const puzzle of puzzles) {
  const optimal = parseKeys(puzzle.optimal).length;
  if (optimal > 6) continue;
  const result = findShorter(puzzle, Math.max(0, optimal - 1));
  if (result.solution) {
    shorter++;
    console.log(`REVIEW ${puzzle.id}: candidate ${result.solution.join("")}`);
  } else
    console.log(
      `OK ${puzzle.id}: ${result.aborted ? "bounded search" : "no shorter solution"} (${result.expanded} expanded)`,
    );
}
console.log(
  `\nBounded search completed; ${shorter} generated-content candidate(s) need author review.`,
);
