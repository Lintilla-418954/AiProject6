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

export interface PuzzleInventoryRow {
  id: string;
  chapter: string;
  concept: string;
  role: PuzzleDef["role"];
  lineCount: number;
  optimalLength: number;
  trace: readonly string[];
}

const roleOrder = ["introductory", "integration", "advanced"] as const;

function regularPuzzle(
  puzzle: PuzzleDef,
): puzzle is Extract<
  PuzzleDef,
  { role: "introductory" | "integration" | "advanced" }
> {
  return puzzle.role !== "test-out";
}

function traceFor(puzzle: PuzzleDef): readonly string[] {
  try {
    return run(
      initialState(puzzle.start, puzzle.cursor),
      parseKeys(puzzle.optimal),
    ).trace;
  } catch {
    return [];
  }
}

function chapterFor(puzzle: PuzzleDef): string {
  if (puzzle.role === "test-out") return puzzle.chapter;
  return conceptByName.get(puzzle.concept)?.chapterId ?? "unknown";
}

export function puzzleInventory(
  puzzles: readonly PuzzleDef[],
): PuzzleInventoryRow[] {
  return puzzles.map((puzzle) => ({
    id: puzzle.id,
    chapter: chapterFor(puzzle),
    concept: puzzle.role === "test-out" ? "Chapter Test-Out" : puzzle.concept,
    role: puzzle.role,
    lineCount: Math.max(puzzle.start.length, puzzle.target.length),
    optimalLength: parseKeys(puzzle.optimal).length,
    trace: traceFor(puzzle),
  }));
}

function normalizedRepair(puzzle: PuzzleDef): string {
  const normalize = (lines: readonly string[]) =>
    lines
      .join("\n")
      .toLowerCase()
      .replace(/\d+/g, "number")
      .replace(/\s+/g, " ");
  return `${normalize(puzzle.start)}=>${normalize(puzzle.target)}`;
}

function repairDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );
  for (let index = 0; index <= left.length; index++) rows[index]![0] = index;
  for (let index = 0; index <= right.length; index++) rows[0]![index] = index;
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++)
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++)
      rows[leftIndex]![rightIndex] = Math.min(
        rows[leftIndex - 1]![rightIndex]! + 1,
        rows[leftIndex]![rightIndex - 1]! + 1,
        rows[leftIndex - 1]![rightIndex - 1]! +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
  return rows[left.length]![right.length]!;
}

function conceptTraceSets(conceptName: string): {
  current: Set<string>;
  earlier: Set<string>;
} {
  const concept = conceptByName.get(conceptName);
  if (!concept) return { current: new Set(), earlier: new Set() };
  return {
    current: new Set(concept.commands),
    earlier: new Set(
      concepts
        .filter((item) => item.order < concept.order)
        .flatMap((item) => item.commands),
    ),
  };
}

function traceUses(trace: readonly string[], commands: Set<string>): boolean {
  if (trace.some((command) => commands.has(command))) return true;
  if (commands.has("count") && trace.length > 0) return true;
  return commands.has(".") && trace.includes("c{motion}");
}

export function validateContent(
  puzzles: readonly PuzzleDef[],
  options: { replay?: boolean } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const repairs: { id: string; normalized: string }[] = [];
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

    let trace: readonly string[] = [];
    try {
      const tokens = parseKeys(puzzle.optimal);
      if (!tokens.length) push(puzzle.id, "Optimal Solution must not be empty");
      const initial = initialState(puzzle.start, puzzle.cursor);
      const result = run(initial, tokens);
      trace = result.trace;
      if (options.replay) {
        const beforeFinal = run(initial, tokens.slice(0, -1)).state;
        if (isSolved(beforeFinal, puzzle.target))
          push(puzzle.id, "Optimal Solution solves before its final token");
        if (!isSolved(result.state, puzzle.target))
          push(puzzle.id, "Optimal Solution does not reach the exact target");
      }
    } catch (error) {
      push(puzzle.id, `Optimal notation does not parse: ${String(error)}`);
    }

    const startRun = simulate(puzzle.scene, puzzle.start);
    const targetRun = simulate(puzzle.scene, puzzle.target);
    if (startRun.success && !targetRun.success)
      push(puzzle.id, "Scene does not distinguish the repaired program");
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

      if (concept) {
        const { current, earlier } = conceptTraceSets(puzzle.concept);
        if (
          puzzle.role === "integration" &&
          concept.order > 1 &&
          (!traceUses(trace, current) || !traceUses(trace, earlier))
        )
          push(
            puzzle.id,
            "Integration trace must use the current Concept and an earlier Concept",
          );
      }

      const normalized = normalizedRepair(puzzle);
      const previous = repairs.find(({ normalized: candidate }) => {
        const maxLength = Math.max(normalized.length, candidate.length);
        if (normalized === candidate) return true;
        if (
          normalized.includes("\n") &&
          candidate.includes("\n") &&
          maxLength >= 120
        )
          return repairDistance(normalized, candidate) <= maxLength * 0.02;
        return false;
      });
      if (previous) push(puzzle.id, `Repair is too similar to ${previous.id}`);
      else repairs.push({ id: puzzle.id, normalized });
    }
  }

  if (puzzles.length !== 98)
    push("curriculum", `Expected 98 Puzzles, found ${puzzles.length}`);
  for (const concept of concepts) {
    const conceptPuzzles = puzzles.filter(
      (puzzle) => regularPuzzle(puzzle) && puzzle.concept === concept.name,
    );
    const roles = conceptPuzzles.map((puzzle) => puzzle.role);
    if (
      roles.length !== roleOrder.length ||
      roles.some((role, index) => role !== roleOrder[index])
    )
      push(
        concept.id,
        "Regular Puzzles must be ordered introductory, integration, advanced",
      );
    const advanced = conceptPuzzles.find(
      (puzzle) => puzzle.role === "advanced",
    );
    const earlier = conceptPuzzles.filter(
      (puzzle) => puzzle.role !== "advanced",
    );
    if (
      advanced &&
      earlier.some((puzzle) => puzzle.optimal === advanced.optimal)
    )
      push(advanced.id, "Advanced trace must differ from earlier roles");
    if (
      advanced &&
      concept.order >= 14 &&
      advanced.start.length === 1 &&
      advanced.target.length === 1
    )
      push(advanced.id, "Later Advanced Puzzle must be multiline");
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
