# Robot Program language (v0, provisional)

Provisional draft produced while authoring example Puzzles for [Author example Puzzles across the Concept list](https://github.com/Lintilla-418954/AiProject6/issues/8). Feeds [What is the Chapter outline across vim tiers 1–5?](https://github.com/Lintilla-418954/AiProject6/issues/3)'s fog item "Robot Program language" as a starting input, not a final answer.

## Shape

One statement per line: `verb(args)`.

Verbs: `move(n)`, `turn(left|right)`, `grab(x)`, `drop()`, `open(x)`, `close(x)`, `say(x)`, `wait(n)`, `scan()`.

Args are integers, bare words (`left`, `right`), or strings in `"…"` or `'…'`.

## Blocks

```
repeat 3 {
  move(2)
  grab('crate')
}

when sensor[1] == 0 {
  say("bay clear")
}
```

`{}` and `[]` give `%`, `i{`/`a{`, `i[`/`a[` and `ib` real targets. `repeat N { … }` and `when sensor[i] == n { … }` are the only two block forms.

## Indentation

Significant. Each line sits at `2 × brace depth` columns (the engine's `shiftwidth=2`). A line at the wrong indent fails to parse. This is the material for Indent (`>>`, `<<`) and Visual block.

## Comments

`#` comment lines. Ignored by the Robot at runtime; present as noise for `dd`, `:g/^#/d`, `:v`.

## Repetition for search/substitute targets

Device names and numbers repeat across a program on purpose (`pump2`, `"bay"` used twice, `wait(3)` beside another `3`), so Word search (`*`/`#`), `:s`, `:g` and `<C-a>`/`<C-x>` have real targets, not synthetic ones.

## Failure

The ghost preview (Scene layout Variant D) stops at the first line that fails to parse, or that parses but fails in the world (e.g. `grab` with nothing there). Unchanged from the existing Scene-binding prototype.

## Known gaps (to feed back to the format/curriculum tickets)

- No construct yet naturally wants `W`/`B`/`E` (big-word motions) over `w`/`b`/`e`, since `-`/`.`/`_` don't appear in identifiers here. May need punctuated identifiers (`bay-door`, `pump.3`) if Big word hops needs distinct material from Word hops.
- `wait(n)` and `move(n)` are the only numeric args; `<C-a>`/`<C-x>` material is thin without more numeric fields appearing in context (e.g. multiple `repeat N` counts in one program).
- The two block keywords (`repeat`, `when`) are the only reserved words; this is deliberately minimal so vim's `w`/`b`/`e` word classes don't need special-casing beyond `_` not appearing in identifiers.
