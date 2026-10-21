import type { PuzzleDef } from "../content/types.ts";
import {
  initialState,
  isSolved,
  step,
  type Snapshot,
} from "../engine/index.ts";
import { simulate, type SimulationResult } from "../robot/index.ts";
import { budgetFor, starsFor } from "./scoring.ts";

export interface PuzzleSession {
  puzzle: PuzzleDef;
  vim: Snapshot;
  simulation: SimulationResult;
  keystrokes: number;
  hintCount: number;
  locked: boolean;
  solved: boolean;
  stars: 1 | 2 | 3 | null;
  bell: boolean;
  nudge: string;
}

export function createSession(puzzle: PuzzleDef): PuzzleSession {
  const vim = initialState(puzzle.start, puzzle.cursor);
  return {
    puzzle,
    vim,
    simulation: simulate(puzzle.scene, vim.lines),
    keystrokes: 0,
    hintCount: 0,
    locked: false,
    solved: false,
    stars: null,
    bell: false,
    nudge: "",
  };
}

export function sendToken(
  session: PuzzleSession,
  token: string,
): PuzzleSession {
  if (session.locked || session.solved) return session;
  const result = step(session.vim, token);
  const keystrokes = session.keystrokes + 1;
  const simulation = simulate(session.puzzle.scene, result.state.lines);
  const solved = isSolved(result.state, session.puzzle.target);
  const budget = budgetFor(session.puzzle);
  const stars = solved
    ? starsFor(keystrokes, budget, session.hintCount > 0)
    : null;
  return {
    ...session,
    vim: result.state,
    simulation,
    keystrokes,
    solved,
    locked: !solved && keystrokes >= budget.pass,
    stars,
    bell: result.bell,
    nudge: "",
  };
}

export function revealHint(session: PuzzleSession): PuzzleSession {
  if (session.puzzle.role === "test-out") return session;
  return {
    ...session,
    hintCount: Math.min(session.puzzle.hints.length, session.hintCount + 1),
    nudge: "",
  };
}

export function withNudge(
  session: PuzzleSession,
  nudge: string,
): PuzzleSession {
  return { ...session, nudge };
}
