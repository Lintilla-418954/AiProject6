import { parseKeys, type KeyToken } from "./keys.ts";
import { step, type StepResult } from "./step.ts";
import type { Snapshot } from "./state.ts";

export {
  formatKeys,
  isPrintableToken,
  normalizeToken,
  parseKeys,
} from "./keys.ts";
export { initialState, isSolved, type Mode, type Snapshot } from "./state.ts";
export { step, type StepResult } from "./step.ts";

export interface RunResult {
  state: Snapshot;
  bell: boolean;
  trace: readonly string[];
}

export function run(
  initial: Snapshot,
  tokens: readonly KeyToken[] | string,
): RunResult {
  const sequence = typeof tokens === "string" ? parseKeys(tokens) : tokens;
  let state = initial;
  let bell = false;
  const trace: string[] = [];
  for (const token of sequence) {
    const result: StepResult = step(state, token);
    state = result.state;
    bell ||= result.bell;
    trace.push(...result.trace);
  }
  return { state, bell, trace };
}
