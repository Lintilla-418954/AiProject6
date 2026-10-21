import { parseKeys } from "../engine/keys.ts";
import { initialState, isSolved, run } from "../engine/index.ts";
import { simulate } from "../robot/index.ts";
import { chapters } from "./chapters.ts";
import { conceptByName, concepts, toolkitFor } from "./curriculum.ts";
import type { PuzzleDef } from "./types.ts";

export interface ValidationIssue {
  puzzleId: string;
  message: string;
}

export function validateContent(
  puzzles: readonly PuzzleDef[],
  options: { replay?: boolean } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const push = (puzzleId: string, message: string) =>
    issues.push({ puzzleId, message });
  for (const puzzle of puzzles) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(puzzle.id))
      push(puzzle.id, "ID must be stable kebab-case");
    if (ids.has(puzzle.id)) push(puzzle.id, "ID is duplicated");
    ids.add(puzzle.id);
    if (!puzzle.start.length || !puzzle.target.length)
      push(puzzle.id, "Start and target must contain lines");
    if (
      [...puzzle.start, ...puzzle.target].some((line) =>
        [...line].some(
          (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) > 126,
        ),
      )
    )
      push(puzzle.id, "Buffers must contain printable ASCII");
    if (puzzle.start.join("\n") === puzzle.target.join("\n"))
      push(puzzle.id, "Start and target must differ");
    if (
      puzzle.cursor.line < 0 ||
      puzzle.cursor.line >= puzzle.start.length ||
      puzzle.cursor.col < 0 ||
      puzzle.cursor.col > puzzle.start[puzzle.cursor.line]!.length
    )
      push(puzzle.id, "Initial cursor is out of bounds");
    try {
      const tokens = parseKeys(puzzle.optimal);
      if (!tokens.length) push(puzzle.id, "Optimal Solution must not be empty");
      if (options.replay) {
        const initial = initialState(puzzle.start, puzzle.cursor);
        const beforeFinal = run(initial, tokens.slice(0, -1)).state;
        const final = run(initial, tokens).state;
        if (isSolved(beforeFinal, puzzle.target))
          push(puzzle.id, "Optimal Solution solves before its final token");
        if (!isSolved(final, puzzle.target))
          push(puzzle.id, "Optimal Solution does not reach the exact target");
      }
    } catch (error) {
      push(puzzle.id, `Optimal notation does not parse: ${String(error)}`);
    }
    const startRun = simulate(puzzle.scene, puzzle.start);
    const targetRun = simulate(puzzle.scene, puzzle.target);
    if (startRun.success)
      push(puzzle.id, "Start already satisfies the Objective");
    if (!targetRun.success)
      push(
        puzzle.id,
        `Target fails the Objective: ${targetRun.failure?.caption ?? "unknown"}`,
      );
    if (
      puzzle.scene.tiles.some(
        (row) => row.length !== puzzle.scene.tiles[0]!.length,
      )
    )
      push(puzzle.id, "Scene rows must have equal widths");
    if (puzzle.role === "test-out") {
      if (!chapters.some((chapter) => chapter.id === puzzle.chapter))
        push(puzzle.id, "Unknown Chapter");
      if (puzzle.helper || puzzle.hints.length)
        push(puzzle.id, "Test-Outs cannot have Helper Text or Hints");
      const optimalLength = parseKeys(puzzle.optimal).length;
      if (!(
        optimalLength <= puzzle.budget.two &&
        puzzle.budget.two < puzzle.budget.pass
      ))
        push(puzzle.id, "Test-Out budget must satisfy O <= two < pass");
    } else {
      const concept = conceptByName.get(puzzle.concept);
      if (!concept) push(puzzle.id, "Unknown Concept");
      else if (!toolkitFor(concept.id).length)
        push(puzzle.id, "Derived Toolkit is empty");
      if (!puzzle.helper.trim())
        push(puzzle.id, "Regular Puzzle requires Helper Text");
      if (puzzle.hints.length !== 2)
        push(puzzle.id, "Regular Puzzle requires exactly two Hints");
    }
  }
  const expected = 78;
  if (puzzles.length !== expected)
    push("curriculum", `Expected ${expected} Puzzles, found ${puzzles.length}`);
  for (const concept of concepts) {
    const roles = puzzles
      .filter(
        (puzzle) =>
          puzzle.role !== "test-out" && puzzle.concept === concept.name,
      )
      .map((puzzle) => puzzle.role);
    for (const role of ["introductory", "integration"] as const)
      if (!roles.includes(role)) push(concept.id, `Missing ${role} Puzzle`);
    if (concept.advanced && !roles.includes("advanced"))
      push(concept.id, "Missing Advanced Puzzle");
  }
  for (const chapter of chapters)
    if (
      !puzzles.some(
        (puzzle) => puzzle.role === "test-out" && puzzle.chapter === chapter.id,
      )
    )
      push(chapter.id, "Missing Test-Out Puzzle");
  return issues;
}
