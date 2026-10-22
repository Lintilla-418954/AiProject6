import { defineConceptPuzzles, routeScene } from "./shared.ts";

const robot = "PATCH-5";

export const fabricationDeckPuzzles = [
  ...defineConceptPuzzles("overwrite", {
    introductory: {
      title: "Wrong Distance",
      start: ["wait(9)"],
      cursor: { line: 0, col: 5 },
      target: ["wait(2)"],
      optimal: "r2",
      helper:
        "r{char} replaces the character under the cursor without entering Insert mode.",
      hints: ["The cursor is on the wrong digit.", "Press r followed by 2."],
      scene: routeScene(robot, 2, "PATCH-5 reaches the fabrication press."),
    },
    integration: {
      title: "Misdirected Arm",
      start: ["turn(LEFT)"],
      cursor: { line: 0, col: 4 },
      target: ["turn(left)"],
      optimal: "l4~",
      helper:
        "Seek a character, then use a counted replacement to overwrite a fixed-width word.",
      hints: [
        "Find the r that starts right.",
        "Use fr, then 5r followed by the letters of left is not valid; replace the word by changing it.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "PATCH-5 faces the press.",
          conditions: [{ robotFacing: "N" }],
        },
      },
    },
    advanced: {
      title: "Case-Sensitive Relays",
      start: ["Move(1)", "Turn(left)", "Move(2)"],
      target: ["move(1)", "turn(left)", "move(2)"],
      optimal: "~j0~j0~",
      helper:
        "~ toggles the case under the cursor; line and edge motions coordinate repeated repairs.",
      hints: [
        "Only the first letter of each verb has wrong case.",
        "Toggle it, then use j0 for each later line.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "PATCH-5 executes the case-correct route.",
          conditions: [{ robotAt: { x: 3, y: 2 } }, { robotFacing: "N" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("insert", {
    introductory: {
      title: "Missing Distance",
      start: ["move()"],
      cursor: { line: 0, col: 5 },
      target: ["move(2)"],
      optimal: "i2<Esc>",
      helper:
        "i enters Insert mode before the cursor; <Esc> returns to Normal mode.",
      hints: [
        "The cursor is on the closing parenthesis.",
        "Use i, type 2, then press <Esc>.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 reaches the parts rack."),
    },
    integration: {
      title: "Missing Calibration",
      start: ["set(press, )"],
      target: ["set(press, 4)"],
      optimal: "$i4<Esc>",
      helper:
        "Move near the line end, then insert the missing value before the closing parenthesis.",
      hints: [
        "$ reaches the closing parenthesis; h moves to the space.",
        "Use i to insert 4 after the space, then escape.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "device", name: "press", value: 0, min: 0, max: 4 }],
        objective: {
          text: "PATCH-5 calibrates the press to four.",
          conditions: [{ device: { name: "press", is: 4 } }],
        },
      },
    },
    advanced: {
      title: "Incomplete Sequence",
      start: ["move()", "turn()", "move()"],
      cursor: { line: 0, col: 5 },
      target: ["move(1)", "turn(right)", "move(2)"],
      optimal: "i1<Esc>j$iright<Esc>j$i2<Esc>",
      helper:
        "Insert mode composes with vertical and line-end movement across a program.",
      hints: [
        "Each call is missing its argument.",
        "Fill the first at the cursor, then use j$ to reach each closing parenthesis.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "PATCH-5 completes the assembly route.",
          conditions: [{ robotAt: { x: 3, y: 2 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("open-line", {
    introductory: {
      title: "Missing Dispatch",
      start: ["# dispatch"],
      target: ["# dispatch", "move(2)"],
      optimal: "omove(2)<Esc>",
      helper: "o opens a new line below and enters Insert mode.",
      hints: [
        "The new instruction belongs below the comment.",
        "Press o, type move(2), then escape.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 leaves dispatch."),
    },
    integration: {
      title: "Missing Header",
      start: ["move(2)"],
      target: ["# approved", "move(2)"],
      optimal: "O# approved<Esc>",
      helper:
        "O opens a line above; inserted comments can restore program context without changing execution.",
      hints: [
        "The approval belongs above the command.",
        "Use O, type the comment, then escape.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 runs the approved route."),
    },
    advanced: {
      title: "Missing Safety Steps",
      start: ["open(press)", "close(press)"],
      target: ["open(press)", "wait(2)", "move(1)", "close(press)"],
      optimal: "owait(2)<Esc>omove(1)<Esc>",
      helper:
        "Repeated o commands build a sequence while preserving the surrounding lines.",
      hints: [
        "Both missing steps belong between open and close.",
        "Open below the first line for wait(2), escape, then open below again for move(1).",
      ],
      scene: {
        tiles: ["....", ".AP.", "...."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "door", name: "press", tile: "A", open: false }],
        objective: {
          text: "PATCH-5 opens the press, enters, and closes it.",
          conditions: [
            { robotAt: { x: 2, y: 1 } },
            { device: { name: "press", is: "closed" } },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("line-delete-join", {
    introductory: {
      title: "Debug Line",
      start: ["# broken", "move(2)"],
      target: ["move(2)"],
      optimal: "dd",
      helper: "dd deletes the current line.",
      hints: ["The entire first line is unwanted.", "Press dd."],
      scene: routeScene(robot, 2, "PATCH-5 ignores the stale debug line."),
    },
    integration: {
      title: "Trailing Diagnostic",
      start: ["move(2)", "# remove"],
      target: ["move(2)"],
      optimal: "Gdd",
      helper: "Jump to the program end, then use dd on the unwanted line.",
      hints: ["The diagnostic is the final line.", "Use G, then dd."],
      scene: routeScene(robot, 2, "PATCH-5 runs the compact controller."),
    },
    advanced: {
      title: "Split Assembly",
      start: ["# obsolete", "open(press", ")", "move(1)", "close(press)"],
      target: ["open(press)", "move(1)", "close(press)"],
      optimal: "ddJ",
      helper:
        "dd removes a whole line and J rejoins a statement split across adjacent lines.",
      hints: [
        "First remove the obsolete comment.",
        "The cursor then sits on the split call; use J to join its closing parenthesis.",
      ],
      scene: {
        tiles: ["....", ".AP.", "...."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "door", name: "press", tile: "A", open: false }],
        objective: {
          text: "PATCH-5 cycles through the assembly press.",
          conditions: [
            { robotAt: { x: 2, y: 1 } },
            { device: { name: "press", is: "closed" } },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("undo-redo", {
    introductory: {
      title: "Recover the Calibration",
      start: ["set(press, 1)"],
      cursor: { line: 0, col: 11 },
      target: ["set(press, 2)"],
      optimal: "r2ur2",
      helper:
        "u undoes the last change; make, undo, and restore a correction to learn the history boundary.",
      hints: [
        "Replace 1 with 2, undo it, then make the replacement again.",
        "Use r2, u, then r2.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 restores the calibrated move."),
    },
    integration: {
      title: "Redo the Approved Edit",
      start: ["wait(1)", "set(press, 1)"],
      cursor: { line: 1, col: 11 },
      target: ["wait(1)", "set(press, 3)"],
      optimal: "r3u<C-r>",
      helper: "<C-r> reapplies an edit that u just reversed.",
      hints: [
        "Make the correct replacement, undo it, then redo it.",
        "Use r3, u, then <C-r>.",
      ],
      scene: routeScene(robot, 3, "PATCH-5 reapplies the approved route."),
    },
    advanced: {
      title: "History Fork",
      start: ["wait(1)", "turn(left)", "move(1)"],
      cursor: { line: 2, col: 5 },
      target: ["wait(1)", "turn(left)", "move(2)"],
      optimal: "r9ur2u<C-r>",
      helper:
        "A new edit after undo replaces the redo branch; undo and redo that new correction deliberately.",
      hints: [
        "Make a wrong replacement, undo it, then make the right one.",
        "Undo the right edit once more and use <C-r> to finish.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "PATCH-5 follows the corrected history.",
          conditions: [{ robotAt: { x: 3, y: 2 } }, { robotFacing: "N" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("change-line", {
    introductory: {
      title: "Replace Instruction",
      start: ["wait(9)"],
      target: ["move(2)"],
      optimal: "ccmove(2)<Esc>",
      helper: "cc changes the whole current line and enters Insert mode.",
      hints: [
        "The complete instruction is wrong.",
        "Use cc, type move(2), then escape.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 replaces the stalled instruction."),
    },
    integration: {
      title: "Replace Final Action",
      start: ["turn(right)", "wait(9)"],
      target: ["turn(right)", "move(2)"],
      optimal: "Gccmove(2)<Esc>",
      helper: "Program-end movement selects a distant line for cc.",
      hints: [
        "Only the final instruction is wrong.",
        "Use G, then cc and type the replacement.",
      ],
      scene: {
        tiles: ["....", "....", ".P..", "...."],
        robotStart: { x: 1, y: 2, facing: "E" },
        objective: {
          text: "PATCH-5 turns into the fabrication lane.",
          conditions: [{ robotAt: { x: 1, y: 3 } }, { robotFacing: "S" }],
        },
      },
    },
    advanced: {
      title: "Rewrite the Cycle",
      start: ["wait(8)", "wait(7)", "wait(6)"],
      target: ["open(press)", "move(1)", "close(press)"],
      optimal: "ccopen(press)<Esc>jccmove(1)<Esc>jccclose(press)<Esc>",
      helper:
        "Apply line changes across several related instructions to rebuild a complete cycle.",
      hints: [
        "Every line needs a full replacement.",
        "Use cc on each line, moving down with j after escaping.",
      ],
      scene: {
        tiles: ["....", ".AP.", "...."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "door", name: "press", tile: "A", open: false }],
        objective: {
          text: "PATCH-5 rebuilds the full press cycle.",
          conditions: [
            { robotAt: { x: 2, y: 1 } },
            { device: { name: "press", is: "closed" } },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("yank-put", {
    introductory: {
      title: "Repeat the Step",
      start: ["move(1)"],
      target: ["move(1)", "move(1)"],
      optimal: "yyp",
      helper: "yy yanks the current line; p puts its copy below.",
      hints: ["The same move is needed twice.", "Use yy, then p."],
      scene: routeScene(robot, 2, "PATCH-5 repeats the conveyor step."),
    },
    integration: {
      title: "Mirror the Shutdown",
      start: ["close(press)", "move(1)", "# replace"],
      target: ["close(press)", "move(1)", "close(press)"],
      optimal: "yyGp",
      helper:
        "Yank a line, jump to the placeholder at the program end, and put the copy there.",
      hints: [
        "The first line is the replacement text.",
        "Use yy, G, then p; the placeholder is replaced by the linewise put.",
      ],
      scene: {
        tiles: ["....", ".AP.", "...."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "door", name: "press", tile: "A", open: true }],
        objective: {
          text: "PATCH-5 keeps the press closed after moving.",
          conditions: [
            { robotAt: { x: 2, y: 1 } },
            { device: { name: "press", is: "closed" } },
          ],
        },
      },
    },
    advanced: {
      title: "Duplicate the Safe Cycle",
      start: ["move(1)", "turn(right)"],
      target: ["move(1)", "turn(right)", "move(1)", "turn(right)"],
      optimal: "2yyP",
      helper:
        "Counts extend yy and p so a multi-line sequence can be copied as a unit.",
      hints: [
        "The first two lines form the reusable cycle.",
        "Use 2yy, jump to the end, then 2p to replace both placeholders.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "PATCH-5 runs the duplicated corner cycle.",
          conditions: [{ robotAt: { x: 2, y: 2 } }, { robotFacing: "W" }],
        },
      },
    },
  }),
];
