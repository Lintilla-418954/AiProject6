import { concepts } from "./curriculum.ts";
import { airlockNetworkPuzzles } from "./puzzles/airlock-network.ts";
import { commandCorePuzzles } from "./puzzles/command-core.ts";
import { dockingRingPuzzles } from "./puzzles/docking-ring.ts";
import { fabricationDeckPuzzles } from "./puzzles/fabrication-deck.ts";
import { sensorArrayPuzzles } from "./puzzles/sensor-array.ts";
import { testOutPuzzles } from "./puzzles/test-outs.ts";
import type { PuzzleDef } from "./types.ts";

export const puzzles: readonly PuzzleDef[] = [
  ...dockingRingPuzzles,
  testOutPuzzles[0]!,
  ...fabricationDeckPuzzles,
  testOutPuzzles[1]!,
  ...airlockNetworkPuzzles,
  testOutPuzzles[2]!,
  ...sensorArrayPuzzles,
  testOutPuzzles[3]!,
  ...commandCorePuzzles,
  testOutPuzzles[4]!,
];

export const puzzleById = new Map(puzzles.map((puzzle) => [puzzle.id, puzzle]));

export type PuzzleId = string & { readonly __puzzleId: unique symbol };

export function parsePuzzleId(value: string): PuzzleId | null {
  return puzzleById.has(value) ? (value as PuzzleId) : null;
}

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
