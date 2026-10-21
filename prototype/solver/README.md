# PROTOTYPE: Optimal Solution solver feasibility

Throwaway code for [Is an automated Optimal Solution solver feasible?](https://github.com/Lintilla-418954/AiProject6/issues/5). Not the real engine.

- `engine.ts`: pure `step(state, token)` stub, about tiers 1–3 plus `f/t`, `.`, `iw/i(/i"`. Not checked against vim.
- `solver.ts`: three searches.
  - `solve`: plain token BFS.
  - `solveMacro`: uniform-cost search where an insert session is a single move that types a substring of the target and then `<Esc>`.
  - `solveBeam`: the same move set, with a cost-bucketed beam ranked by edit distance to the target.
- `bench.ts`: 10 Puzzles across 4 growing Toolkits. Run with `npm run prototype:solver`, setting `MODE=bfs|macro|beam`, `NODES=` and `WIDTH=`.
- `verify.ts`: tries to prove a beam result is optimal by searching every solution of length−1 exhaustively.

## Results (one 8-core box, Node 24)

| Search | Outcome |
|---|---|
| Token BFS | Branching ≈ 14–20 from T2 up. Hits 3M states at depth 5–6 (6–15 s), so nothing longer than 5 keys gets solved once insert or operators are in the Toolkit. |
| Macro-insert uniform cost | Fixes T2 (`oturn<Esc>` in 0.3 s). T3/T4 still blow up at cost 5. |
| Beam, width 5000 | Every Puzzle solved in ≤ 6.3 s. It **beat 6 of 10 hand-authored solutions** (`two deletes` 7→4 `eDPD`, `change word` 8→7 `wCleft<Esc>`, `change in quotes` 8→6 `fecwi<Esc>`, `repeat fix` 11→9, `long rewrite` 18→9 `ejjxpwlxp`). |
| Optimality proof | Works up to about 6 keys: `missing line` took 7 s / 1.2 GB, `change in quotes` 15 s / 2.6 GB. At 7+ keys in T3/T4 it fails at cost 5 even with 4M states / 4.5 GB, and runs out of memory at 12 GB. |

Not measured: tier 4–5 commands (visual, registers, search, macros, ex), which only add branching, and buffers over 4 lines.

## Verdict

- **Verify:** always replay the authored Optimal Solution and assert it solves the Puzzle within the Toolkit. This is cheap and exact.
- **Discover:** run a Toolkit-restricted beam search on every Puzzle in CI and fail if it finds anything shorter than the authored solution. Authors beat themselves often, and corruption by transposition invites cheap workarounds.
- **Prove optimal:** only where the authored solution is ≤ 6 keys. Longer solutions are "best known", not proven.
