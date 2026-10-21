export type Role = "introductory" | "integration" | "advanced";
export type Facing = "N" | "E" | "S" | "W";

export type ObjectiveCondition =
  | { robotAt: { x: number; y: number } }
  | { robotFacing: Facing }
  | { cargoAt: { name: string; x: number; y: number } }
  | { holding: string | "none" }
  | { device: { name: string; is: "open" | "closed" | number } }
  | { said: string };

export type Entity =
  | {
      kind: "door";
      name: string;
      tile: string;
      open: boolean;
      airlock?: string;
      schedule?: { at: number; open: boolean }[];
    }
  | { kind: "device"; name: string; value: number; min: number; max: number }
  | { kind: "cargo"; name: string; x: number; y: number }
  | { kind: "sensor"; index: number; reads: number | string };

export interface SceneSpec {
  tiles: string[];
  robotStart: { x: number; y: number; facing: Facing };
  entities?: Entity[];
  maxLines?: number;
  objective: { text: string; conditions: ObjectiveCondition[] };
  region?: string;
}

export interface BudgetOverride {
  pass: number;
  two: number;
}

interface PuzzleBase {
  id: string;
  title: string;
  robotName: string;
  start: string[];
  cursor: { line: number; col: number };
  target: string[];
  optimal: string;
  helper: string;
  hints: string[];
  scene: SceneSpec;
}

export type PuzzleDef =
  | (PuzzleBase & { concept: string; role: Role; budget?: never })
  | (PuzzleBase & {
      role: "test-out";
      chapter: string;
      budget: BudgetOverride;
    });

export interface Concept {
  id: string;
  name: string;
  order: number;
  chapterId: string;
  commands: string[];
  advanced: boolean;
}

export interface Chapter {
  id: string;
  name: string;
  region: string;
  robotName: string;
  conceptIds: string[];
  intro: string;
}

export interface Budget {
  three: number;
  two: number;
  pass: number;
}

export function definePuzzle<const T extends PuzzleDef>(puzzle: T): T {
  return puzzle;
}
