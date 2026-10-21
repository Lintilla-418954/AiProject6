import type { Facing } from "../content/types.ts";

export interface WorldSnapshot {
  robot: { x: number; y: number; facing: Facing };
  holding: string | null;
  cargo: readonly { name: string; x: number; y: number }[];
  doors: Readonly<Record<string, { open: boolean; tile: string }>>;
  devices: Readonly<Record<string, number>>;
  said: readonly string[];
  tick: number;
}

export type FailureKind = "memory" | "parse" | "runtime" | "objective";

export interface SceneFailure {
  kind: FailureKind;
  caption: string;
  at: { x: number; y: number };
  sourceLine?: number;
}

export interface SimulationFrame {
  world: WorldSnapshot;
  event: string;
}

export interface SimulationResult {
  frames: readonly SimulationFrame[];
  world: WorldSnapshot;
  success: boolean;
  objectiveMet: boolean;
  failure: SceneFailure | null;
}
