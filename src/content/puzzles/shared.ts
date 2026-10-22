import { chapterById } from "../chapters.ts";
import { conceptById } from "../curriculum.ts";
import {
  definePuzzle,
  type PuzzleDef,
  type Role,
  type SceneSpec,
} from "../types.ts";

export interface PuzzleContent {
  title: string;
  start: string[];
  cursor?: { line: number; col: number };
  target: string[];
  optimal: string;
  helper: string;
  hints: [string, string];
  scene: SceneSpec;
}

export type ConceptPuzzleContent = Record<Role, PuzzleContent>;

export function defineConceptPuzzles(
  conceptId: string,
  content: ConceptPuzzleContent,
): readonly PuzzleDef[] {
  const concept = conceptById.get(conceptId);
  if (!concept) throw new Error(`Unknown Concept: ${conceptId}`);
  const chapter = chapterById.get(concept.chapterId);
  if (!chapter) throw new Error(`Unknown Chapter: ${concept.chapterId}`);
  const prefix = String(concept.order).padStart(2, "0");

  return (["introductory", "integration", "advanced"] as const).map((role) =>
    definePuzzle({
      id: `${prefix}-${concept.id}-${role}`,
      title: content[role].title,
      robotName: chapter.robotName,
      concept: concept.name,
      role,
      start: content[role].start,
      cursor: content[role].cursor ?? { line: 0, col: 0 },
      target: content[role].target,
      optimal: content[role].optimal,
      helper: content[role].helper,
      hints: content[role].hints,
      scene: content[role].scene,
    }),
  );
}

export function routeScene(
  _robotName: string,
  distance: number,
  objective: string,
  extra: Partial<SceneSpec> = {},
): SceneSpec {
  const width = Math.max(8, distance + 3);
  const row = `${".".repeat(distance + 1)}P${".".repeat(width - distance - 2)}`;
  return {
    tiles: [".".repeat(width), row, ".".repeat(width)],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: {
      text: objective,
      conditions: [{ robotAt: { x: 1 + distance, y: 1 } }],
    },
    ...extra,
  };
}
