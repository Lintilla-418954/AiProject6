import { chapters } from "../content/chapters.ts";
import { concepts } from "../content/curriculum.ts";
import { puzzles, puzzlesForChapter } from "../content/index.ts";
import type { PuzzleDef } from "../content/types.ts";
import type { SaveV1 } from "./persistence.ts";

export function chapterUnlocked(chapterId: string, save: SaveV1): boolean {
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  if (index <= 0) return index === 0;
  const previous = chapters[index - 1]!;
  if (save.passedTestOuts.includes(previous.id)) return true;
  const regular = puzzlesForChapter(previous.id).filter(
    (puzzle) => puzzle.role !== "test-out",
  );
  return regular.every((puzzle) => Boolean(save.puzzleResults[puzzle.id]));
}

export function puzzleUnlocked(puzzle: PuzzleDef, save: SaveV1): boolean {
  const chapterId =
    puzzle.role === "test-out"
      ? puzzle.chapter
      : (concepts.find((concept) => concept.name === puzzle.concept)
          ?.chapterId ?? "");
  if (!chapterUnlocked(chapterId, save)) return false;
  if (puzzle.role === "test-out") return true;
  const regular = puzzlesForChapter(chapterId).filter(
    (item) => item.role !== "test-out",
  );
  const index = regular.findIndex((item) => item.id === puzzle.id);
  return index === 0 || Boolean(save.puzzleResults[regular[index - 1]!.id]);
}

export function nextPuzzle(current: PuzzleDef, save: SaveV1): PuzzleDef | null {
  const currentIndex = puzzles.findIndex((puzzle) => puzzle.id === current.id);
  return (
    puzzles
      .slice(currentIndex + 1)
      .find(
        (puzzle) =>
          puzzleUnlocked(puzzle, save) && !save.puzzleResults[puzzle.id],
      ) ?? null
  );
}
