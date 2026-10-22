# Vim Station — buildable specification

This is the binding product and engineering specification for the Vim puzzle game. Domain terms are defined in [`CONTEXT.md`](../CONTEXT.md). The Vim engine architecture is fixed by [ADR 0001](adr/0001-pure-engine-with-neovim-oracle.md). Robot Program syntax and execution follow [`spec/robot-language.md`](../spec/robot-language.md).

## Product

Vim Station is a desktop-browser puzzle game teaching Vim from first movement through macros and Ex commands. An ion storm has corrupted Robot Programs throughout a space station. The player remotely repairs each exact target program using Vim keys while a Scene previews what the Robot would do.

The application is a static TypeScript/Vite site. It has no accounts, server, sync, leaderboard, telemetry, plugins, multiple buffers, windows, or mobile gameplay. Progress is local to the browser.

A Puzzle is solved only when:

1. buffer lines exactly equal the authored target;
2. the engine is in Normal mode; and
3. no command is pending.

Scene success alone is not a solve. If another program meets the Objective, the caption is “Works, but Ops expects the original repair.”

## Curriculum

The supported command set is exactly the union of these ordered Concepts. Commands remain available even before their Concept, but each Optimal Solution may use only its derived Toolkit.

|   # | Concept              | Introduced commands                 |
| --: | -------------------- | ----------------------------------- |
|   1 | Grid moves           | `h j k l x`                         |
|   2 | Word hops            | `w b e W B E`                       |
|   3 | Line ends            | `0 ^ $`                             |
|   4 | Program ends         | `gg G { }`                          |
|   5 | Character seek       | `f t F T ; ,`                       |
|   6 | Bracket jump         | `%`                                 |
|   7 | Overwrite            | `r ~`                               |
|   8 | Insert               | `i a I A`, `<Esc>`, `<C-[>`, `<BS>` |
|   9 | Open line            | `o O`                               |
|  10 | Line delete and join | `dd D J`                            |
|  11 | Undo and redo        | `u <C-r>`                           |
|  12 | Change line          | `cc C s S`                          |
|  13 | Yank and put         | `yy p P`                            |
|  14 | Counts               | numeric prefixes                    |
|  15 | Delete with motion   | `d{motion}`                         |
|  16 | Change with motion   | `c{motion}`                         |
|  17 | Yank with motion     | `y{motion}`                         |
|  18 | Word objects         | `iw aw iW aW`                       |
|  19 | Delimiter objects    | `i/a` with `() {} [] " '`           |
|  20 | Number tweak         | `<C-a> <C-x>`                       |
|  21 | Repeat               | `.`                                 |
|  22 | Search               | `/ ? n N <CR>`                      |
|  23 | Word search          | `* #`                               |
|  24 | Visual               | `v V o` and operators               |
|  25 | Visual block         | `<C-v> I A c`                       |
|  26 | Indent               | `>> << > < =`                       |
|  27 | Named registers      | `"{register}`                       |
|  28 | Macros               | `q{register} q @ @@`                |
|  29 | Substitute           | `:s :%s &`                          |
|  30 | Global               | `:g :v`                             |
|  31 | Ex line operations   | `:d :m :t :normal` and ranges       |

Scrolling/screen-relative commands, marks, Replace mode, `gu`, `gU`, `g~{motion}`, interactive substitute confirmation, Insert-mode `<C-u>/<C-h>`, and tier-six features are excluded.

### Chapters and inventory

| Chapter          | Region                                | Concepts | Regular Puzzles | Test-Out | Total |
| ---------------- | ------------------------------------- | -------: | --------------: | -------: | ----: |
| Docking Ring     | Restore navigation and inspect damage |      1–6 |              18 |        1 |    19 |
| Fabrication Deck | Restore editing and cargo systems     |     7–13 |              21 |        1 |    22 |
| Airlock Network  | Restore environmental routing         |    14–20 |              21 |        1 |    22 |
| Sensor Array     | Repair repeated and selected data     |    21–27 |              21 |        1 |    22 |
| Command Core     | Recover station automation            |    28–31 |              12 |        1 |    13 |

The 98 Puzzles comprise 31 Introductory, 31 Integration, 31 Advanced, and five Test-Out Puzzles. Every Concept presents those three regular roles consecutively before the curriculum advances.

Chapter 1 is initially unlocked. Regular Puzzles unlock in curriculum order. Every unlocked Chapter exposes its Test-Out immediately. Passing the final regular Puzzle or the Test-Out unlocks the next Chapter. Test-Out completion never invents results for skipped Puzzles; those remain playable.

Each Test-Out’s Optimal Solution traces every command introduced in its Chapter. Validation repeats bounded search with each required command removed and requires the pass threshold to exclude every found workaround.

## Puzzle data

Each `src/content/puzzles/<id>.ts` is data-only and exports `definePuzzle({...})`. The permanent kebab-case ID matches the filename and save-data key. A definition contains title, Robot name, Concept and role or Chapter, start lines, zero-based cursor, target lines, Optimal Solution notation, optional Test-Out budget override, Helper Text, ordered Hints, and typed Scene.

Start and target use printable ASCII. Attempts begin in Normal mode with empty registers. Toolkit and play order derive from curriculum. Regular budgets derive from Optimal Solution length and are not authored.

Introductory Puzzles isolate their Concept. Integration Puzzles trace at least one current and one earlier Concept command. Advanced Puzzles explore a distinct deeper behavior and are predominantly multiline; the few single-line Advanced Puzzles focus on command depth where extra lines would be artificial. Test-Outs remain after all Concept sequences in their Chapter.

Regular Puzzles have Helper Text and exactly two Hints: a conceptual command/pattern nudge, then a concrete starting strategy that is not the complete Optimal Solution. Test-Outs have neither. Trusted author markup disables raw HTML; key notation is parsed during validation.

## Keystrokes, budgets, and Stars

Shared key parsing makes each printable key, `<Esc>`, `<CR>`, `<BS>`, and Ctrl token one keystroke. Every player token delivered to the engine counts, including digits, inserted characters, bells, and no-ops. Internal replay by `.`, macros, or `:normal` does not count. Blocked keys, composition events, and Reset do not count.

For Optimal Solution length `O`:

- three Stars: `O`;
- two Stars: `O + max(1, ceil(O * 0.25))`;
- pass: `max(two + 1, O + max(4, ceil(O * 0.50)))`.

Only Test-Outs may override two-Star/pass thresholds, with `O <= two < pass`. After a token, solve is checked before the pass lock, so solving on the pass boundary succeeds. Any Hint caps the attempt at two Stars. Best Stars and best keystrokes are persisted independently. Every solve reveals the Optimal Solution.

## Engine

The public API is pure and deterministic:

```ts
initialState(lines, cursor)
step(state, token) -> { state, bell, trace }
run(state, tokens) -> { state, bell, trace }
parseKeys(notation)
formatKeys(tokens)
```

State is immutable, serializable, cloneable, and hashable. It includes lines, cursor, mode/selection, pending command, registers, undo/redo, search, last change, macro/replay state, and command line. Puzzle Session concerns—count, budget, Hints, reset, progression—stay outside the engine.

Behavior matches clean Neovim with `shiftwidth=2 expandtab noignorecase wrapscan nostartofline`. ASCII-only Robot Programs intentionally bound text behavior. Undo/redo is linear. Replay and recursion have deterministic safety caps. Every completed command emits curriculum command IDs for content validation.

A committed golden corpus lets local tests run without Neovim. CI compares it and the implementation with a pinned headless Neovim, and scheduled bounded fuzzing explores supported token sequences.

## Browser input

Gameplay supports desktop hardware keyboards. Menus and utility controls permit the mouse; buffer clicks and arrow-style navigation never reposition the cursor. Blocked keys are ignored, show “Use vim!” briefly, and do not count.

The adapter prevents default browser behavior only for accepted gameplay keys. macOS Command shortcuts pass through. `Ctrl-[` normalizes to `<Esc>`. `Ctrl-W`, `Ctrl-N`, and `Ctrl-T` are excluded. Composition keydown/key-code 229 is ignored; a focused hidden textarea and input events capture dead-key/composed printable text. Backspace counts in Insert/command-line modes. The game never requests fullscreen. Touch or narrow devices receive a keyboard-required notice.

Visible Hint and Reset controls have keyboard equivalents. Reset starts a fresh attempt without cost.

## Robot Program and Scene

The final grammar, indentation, Tick model, schedules, sensors, hazards, failure order, and Objective predicates are defined by [`spec/robot-language.md`](../spec/robot-language.md). The production interpreter returns immutable world frames, structured failure, and Objective status. Source positions may exist for tests but never appear in gameplay feedback.

The current Robot Program is re-simulated after every accepted engine token. Before solve, the Scene renders a ghost path and world-space failure marker. On exact solve, it animates the real Robot through the trace. The start must fail and target must satisfy every Puzzle Objective.

## Presentation

The production layout is Variant D:

- Scene first, with Objective, Robot header, Helper Text, and Hint controls beside it;
- full-width `UPLINK ▸ ROBOT.prog` console beneath;
- buffer, cursor/selection, mode, pending input, command line, messages, and Budget status;
- no per-line diagnostic gutter and no caption that identifies or quotes a faulty line.

Five recurring Robot families—SCOUT-3, PATCH-5, HAULER-7, TRACE-4, and RELAY-0—connect the five station regions. Narrative remains concise.

Canvas 2D renders an original repository-owned 16×16 logical pixel-art atlas at integer scale with nearest-neighbor sampling. Scene authoring remains declarative. Animation clips cover idle, move, turn, interaction, failure, and completion; reduced motion uses short state transitions while preserving the ghost path.

Web Audio synthesizes accepted-key, bell, blocked-key, Hint, movement, failure, and solve effects plus optional Chapter ambience. Effects enable after first interaction; music defaults off. Settings control them independently, suspend them while hidden, and never make sound the only feedback.

Authored text is safely rendered, focus remains visible, state changes use live regions, and color contrast meets WCAG AA.

## Persistence

The single durable key is `vim-station.save.v1`:

```ts
interface SaveV1 {
  version: 1;
  puzzleResults: Record<
    string,
    {
      passedAt: string;
      bestKeystrokes: number;
      bestStars: 1 | 2 | 3;
      solvedWithoutHint: boolean;
    }
  >;
  passedTestOuts: string[];
  lastPuzzleId?: string;
  settings: {
    soundEnabled: boolean;
    soundVolume: number;
    musicEnabled: boolean;
    musicVolume: number;
    reducedMotion: boolean | "system";
  };
}
```

Unlocks derive from results. Unknown Puzzle records are retained but ignored. Invalid data is copied to a recovery key and replaced with defaults; unavailable storage falls back to memory with a non-blocking warning. Future versions use sequential migrations. Reload starts a fresh attempt. Reset All Progress requires confirmation.

## Validation and delivery

Content validation checks IDs/references/cardinality; printable distinct buffers and cursor bounds; Scene/entity integrity; Optimal solve only on its final token; Normal mode and no pending command; Toolkit and role traces; normalized duplicate repairs; Test-Out coverage; budgets; and Helper/Hint rules. `npm run report:content` lists every Puzzle's Chapter, Concept, role, line count, Optimal Solution length, and verified command trace for curriculum review.

CI installs from the lockfile, type-checks, tests, validates content, runs deterministic solver checks, builds production, compares the Neovim oracle, and runs Chromium/Firefox/WebKit end-to-end tests. GitHub Pages deploys the static artifact from the default branch. Hash routes avoid server fallback requirements.

## No open decisions

This document resolves the former open areas: Chapter/Test-Out structure, story and Robots, original art and Scene workflow, budget formula, versioned local save, sound/music behavior, and Hint authoring. Product behavior outside this specification is explicitly excluded rather than undecided.
