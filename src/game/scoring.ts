import { parseKeys } from "../engine/keys.ts";
import type { Budget, PuzzleDef } from "../content/types.ts";

export function budgetFor(puzzle: PuzzleDef): Budget {
  const optimal = parseKeys(puzzle.optimal).length;
  if (puzzle.role === "test-out")
    return { three: optimal, two: puzzle.budget.two, pass: puzzle.budget.pass };
  const two = optimal + Math.max(1, Math.ceil(optimal * 0.25));
  return {
    three: optimal,
    two,
    pass: Math.max(two + 1, optimal + Math.max(4, Math.ceil(optimal * 0.5))),
  };
}

export function starsFor(
  keys: number,
  budget: Budget,
  hintUsed: boolean,
): 1 | 2 | 3 {
  const stars = keys <= budget.three ? 3 : keys <= budget.two ? 2 : 1;
  return Math.min(stars, hintUsed ? 2 : 3) as 1 | 2 | 3;
}
