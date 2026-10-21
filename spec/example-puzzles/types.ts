// Shared shape for example Puzzles, per "What does a Puzzle definition contain?" (issue #7).
export type Role = "introductory" | "integration" | "advanced";

export interface ObjectiveCondition {
  // declarative: what must be true of the world when the Robot Program finishes
  text: string;
}

export interface SceneSpec {
  tiles: string[]; // ASCII tile map, one row per string
  robotStart: { x: number; y: number; facing: "N" | "E" | "S" | "W" };
  entities?: { glyph: string; x: number; y: number; label: string }[];
  objective: { text: string; conditions: ObjectiveCondition[] };
}

export interface PuzzleDefBase {
  id: string;
  title: string;
  robotName: string;
  start: string[];
  cursor: { line: number; col: number };
  target: string[];
  optimal: string; // key notation, parsed by the engine's shared tokenizer
  budget?: { pass?: number; two?: number };
  helper: string;
  hints: string[];
  scene: SceneSpec;
}

export type PuzzleDef =
  | (PuzzleDefBase & { concept: string; role: Exclude<Role, never> })
  | (PuzzleDefBase & { role: "test-out"; chapter: string });

export function definePuzzle(p: PuzzleDef): PuzzleDef {
  return p;
}
