// Shared shape for example Puzzles, per "What does a Puzzle definition contain?" (issue #7).
export type Role = "introductory" | "integration" | "advanced";

export type Facing = "N" | "E" | "S" | "W";

// Final-world conditions; all must hold, plus an implied "finished without failure".
export type ObjectiveCondition =
  | { robotAt: { x: number; y: number } }
  | { robotFacing: Facing }
  | { cargoAt: { name: string; x: number; y: number } }
  | { holding: string | "none" }
  | { device: { name: string; is: "open" | "closed" | number } }
  | { said: string };

export type Entity =
  | { kind: "door"; name: string; tile: string; open: boolean; airlock?: string; schedule?: { at: number; open: boolean }[] }
  | { kind: "device"; name: string; value: number; min: number; max: number }
  | { kind: "cargo"; name: string; x: number; y: number }
  | { kind: "sensor"; index: number; reads: number | string };

export interface SceneSpec {
  tiles: string[]; // legend: . floor, # hull, P pad, other capitals are door tiles
  robotStart: { x: number; y: number; facing: Facing };
  entities?: Entity[];
  maxLines?: number;
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
