# Robot Program language

The language a Robot Program is written in, and how a Robot executes it in the Scene. Resolves [What should the Robot Program language be?](https://github.com/Lintilla-418954/AiProject6/issues/11); supersedes the provisional v0 draft from [Author example Puzzles across the Concept list](https://github.com/Lintilla-418954/AiProject6/issues/8). The `SceneSpec` type lives in [`example-puzzles/types.ts`](example-puzzles/types.ts).

## Role of the interpreter

A Puzzle is solved when the buffer equals its target text in Normal mode (engine ADR). The interpreter never decides that. It only drives the Scene: the ghost preview on every keystroke, and the real run as the solve payoff.

- An Objective is a set of conditions on the final world, never on the text.
- CI checks, for every Puzzle, that the target program meets the Objective and the start program does not.
- If the player's program meets the Objective but isn't the target, the preview shows success and the caption reads "works, but Ops expects the original repair". The Puzzle stays unsolved.

## Lexical rules

- **Case-sensitive.** Verbs and keywords are lowercase; `Move(2)` fails to parse. String contents keep their case.
- **Numbers:** decimal digits `[0-9]+`, any length. Never negative; `-` appears nowhere in the language, so `<C-a>`/`<C-x>` never see a sign.
- **Identifiers:** `[a-z][a-z0-9]*` segments joined by `.`, e.g. `bay3`, `dock.bay3`, `pump.2`. `w` stops at `.`, `W` doesn't. `_` and `-` are not allowed.
- **Strings:** `"…"` or `'…'`, fully interchangeable. Printable ASCII except the enclosing quote; no escapes.
- **Reserved words:** `repeat`, `when`, `sensor`, `left`, `right`. Scene names never use them.
- **Whitespace:** spaces between tokens are optional except between two word/number tokens (`repeat 3`). Trailing whitespace is ignored.
- **Comments:** `#` to end of line, on its own line or after a statement or brace.
- **Blank lines** are allowed and do nothing.

Authoring rule: no Puzzle hinges on whitespace the player can't see, except leading indentation.

## Statements

One statement per line. Bare identifiers name Scene things (Devices, directions); strings name Cargo or carry messages.

| Statement | Ticks | Effect | Runtime failures |
|---|---|---|---|
| `move(n)` | n | Step n tiles forward, one per tick | hull collision, closed door |
| `turn(left)` / `turn(right)` | 1 | Rotate 90° | — |
| `grab('name')` | 1 | Pick up the Cargo with that name on the Robot's tile | no such Cargo here; hands full |
| `drop()` | 1 | Put the held Cargo on the current tile | hands empty |
| `open(door)` / `close(door)` | 1 | Set a door's state, from anywhere | unknown device; not a door; crush; decompression |
| `set(device, n)` | 1 | Set a Device's value, from anywhere | unknown device; not settable; out of range |
| `say("text")` | 1 | Broadcast a message (shown in the Scene) | — |
| `wait(n)` | n | Do nothing for n ticks | — |

The Robot carries at most one Cargo, and held Cargo moves with it. `move(0)`, `wait(0)` and `repeat 0` are legal no-ops taking 0 ticks.

## Blocks

```
repeat 3 {
  move(2)
  when sensor[1] == 40 {
    say("pressure ok")
  }
}
```

- `repeat N { … }` runs its body N times.
- `when sensor[i] == n { … }` checks once, when reached, and runs its body only if the sensor currently reads n. There is no `else` and no `while`.
- The opening `{` ends the header line; the closing `}` sits alone on its own line (an optional comment may follow it).
- Blocks nest. Every program halts.

## Indentation

Significant. Each line sits at exactly `2 × brace depth` spaces (the engine's `shiftwidth=2`); a `}` line sits at its block's outer depth. Any other indent, or a tab, is a parse error on that line. Blank and comment-only lines are exempt.

## Time

The world runs in **ticks**, starting at 0. Each statement takes the ticks listed above. Door schedules apply at the start of their tick, before the Robot acts in it. A door that closes on the Robot's tile (by schedule or by `close`) crushes it.

## Sensors

Each sensor index is bound in the Scene either to a constant or to a Device's live value. `when sensor[i] == n` reads it at the moment the `when` is reached, so an earlier `set` can change which branch runs. An unknown sensor index is a runtime failure.

## Failure order

1. **Memory:** if the Scene declares `maxLines` and the buffer has more lines (comments and blank lines count), nothing runs: "program too large for <ROBOT>'s memory".
2. **Parse:** the whole program is parsed up front. If line L has an error (bad statement, wrong indent, unbalanced brace), statements before L run, then the Robot halts with "can't parse its program". A block whose closing `}` is at or after L, or missing, doesn't run at all.
3. **Run:** the first runtime failure halts the Robot at that point.

Captions describe the failure in the world only; they never name or quote a line (Scene layout Variant D).

## Hazards

A fixed set built into the engine; Puzzles can't define their own.

- **Hull collision:** moving onto `#` or off the map.
- **Closed door:** moving onto a tile of a closed door.
- **Crush:** a door closing on the Robot's tile.
- **Decompression:** every door in an airlock group open at once.
- **Overheat:** the run passes 500 ticks.

## Objective

Every condition must hold in the final world, and the program must finish without failure (implied). Order of events is never checked.

| Condition | Holds when |
|---|---|
| `robotAt(x, y)` | Robot is on that tile |
| `robotFacing(dir)` | Robot faces N/E/S/W |
| `cargoAt(name, x, y)` | Cargo is on that tile and not held |
| `holding(name \| none)` | Robot holds that Cargo, or nothing |
| `device(name, open \| closed \| n)` | Door state or Device value |
| `said(text)` | `say` broadcast that text at least once |

## SceneSpec

The tile map uses a fixed legend: `.` floor, `#` hull, `P` pad (floor, marked for Objectives), and other capital letters for door tiles. Everything else lives in typed `entities`:

- `door { name, tile, open, airlock?, schedule? }`: occupies every tile with that letter; `schedule` is a list of `{ at, open }`.
- `device { name, value, min, max }`: settable with `set`.
- `cargo { name, x, y }`
- `sensor { index, reads }`: `reads` is a constant or a Device name.

Plus `robotStart`, the optional `maxLines`, and the Objective. See [`example-puzzles/types.ts`](example-puzzles/types.ts).

## How Concepts get material

- `W B E`: dotted names (`dock.bay3`).
- `<C-a>`/`<C-x>`: numbers in `move`, `wait`, `repeat`, `set` and sensor comparisons, several per line.
- `%`, `i(`, `i{`, `i[`, `ib`, `iB`: calls, blocks, `sensor[i]`.
- `i"`, `i'`: strings in `grab` and `say`.
- `~`, `u`/`U`: case-sensitive keywords.
- `>>`, `<<`, Visual block: significant indentation.
- `dd`, `:g`, `:v`: comment lines that push a program past `maxLines`.
- `*`, `#`, `:s`: Device names repeated across a program.
