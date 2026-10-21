# Pure vim engine checked against a Neovim oracle

The vim engine is a pure `step(state, token) → { state, bell }` over immutable, serialisable state, rather than a mutable class or an embedded emulator. That gives the Puzzle session, the Scene, Puzzle validation and the Optimal Solution solver deterministic replay, cheap cloning and hashing, and one mechanism behind `.`, macros and `:normal`. A wrong cursor-landing rule would make an Optimal Solution wrong, so every observable effect of a supported command must match real vim. This is enforced in CI by differential tests against a pinned headless Neovim, run with the same fixed option profile, and a recorded golden corpus means local tests don't need nvim.

## Considered Options

- Mutable engine class with `clone()`: rejected because the solver and replay would depend on clone discipline.
- Hand-written expected results only: rejected because they drift from real vim without anyone noticing.
