import gridMoves from "./puzzles/01-grid-moves-intro.ts";
import wordHops from "./puzzles/02-word-hops-integration.ts";
import characterSeek from "./puzzles/05-character-seek-advanced.ts";
import bracketJump from "./puzzles/06-bracket-jump-integration.ts";
import insert from "./puzzles/08-insert-intro.ts";
import lineDeleteJoin from "./puzzles/10-line-delete-join-integration.ts";
import deleteMotion from "./puzzles/15-delete-with-motion-advanced.ts";
import delimiterObjects from "./puzzles/19-delimiter-objects-intro.ts";
import numberTweak from "./puzzles/20-number-tweak-integration.ts";
import repeat from "./puzzles/21-repeat-intro.ts";
import search from "./puzzles/22-search-integration.ts";
import visualBlock from "./puzzles/25-visual-block-advanced.ts";
import indent from "./puzzles/26-indent-intro.ts";
import macros from "./puzzles/28-macros-intro.ts";
import substitute from "./puzzles/29-substitute-integration.ts";
import global from "./puzzles/30-global-advanced.ts";
import airlockTestOut from "./puzzles/test-out-tier3.ts";
import { chapters } from "./chapters.ts";
import { conceptByName, concepts } from "./curriculum.ts";
import { generatedPuzzles, generatedTestOuts } from "./generated.ts";
import type { PuzzleDef } from "./types.ts";

const migrated: PuzzleDef[] = [
  gridMoves,
  wordHops,
  characterSeek,
  bracketJump,
  insert,
  lineDeleteJoin,
  deleteMotion,
  delimiterObjects,
  numberTweak,
  repeat,
  search,
  visualBlock,
  indent,
  macros,
  substitute,
  global,
  airlockTestOut,
];

const roleOrder = {
  introductory: 0,
  integration: 1,
  advanced: 2,
  "test-out": 3,
} as const;

export const puzzles: readonly PuzzleDef[] = [
  ...migrated,
  ...generatedPuzzles,
  ...generatedTestOuts,
].sort((left, right) => {
  if (left.role === "test-out" || right.role === "test-out") {
    const leftChapter =
      left.role === "test-out"
        ? chapters.findIndex((chapter) => chapter.id === left.chapter)
        : -1;
    const rightChapter =
      right.role === "test-out"
        ? chapters.findIndex((chapter) => chapter.id === right.chapter)
        : -1;
    if (leftChapter !== rightChapter) return leftChapter - rightChapter;
  }
  const leftOrder =
    left.role === "test-out"
      ? Number.MAX_SAFE_INTEGER
      : (conceptByName.get(left.concept)?.order ?? Number.MAX_SAFE_INTEGER);
  const rightOrder =
    right.role === "test-out"
      ? Number.MAX_SAFE_INTEGER
      : (conceptByName.get(right.concept)?.order ?? Number.MAX_SAFE_INTEGER);
  return (
    leftOrder - rightOrder ||
    roleOrder[left.role] - roleOrder[right.role] ||
    left.id.localeCompare(right.id)
  );
});

export const puzzleById = new Map(puzzles.map((puzzle) => [puzzle.id, puzzle]));

export function puzzlesForChapter(chapterId: string): readonly PuzzleDef[] {
  const conceptNames = new Set(
    concepts
      .filter((concept) => concept.chapterId === chapterId)
      .map((concept) => concept.name),
  );
  return puzzles.filter((puzzle) =>
    puzzle.role === "test-out"
      ? puzzle.chapter === chapterId
      : conceptNames.has(puzzle.concept),
  );
}
