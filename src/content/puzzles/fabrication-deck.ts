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
        "r replaces the character under the cursor without leaving Normal mode, so it is the right tool for a single-digit fix.",
      hints: [
        "The wrong value is the 9 in wait(9).",
        "Move to the 9 and press r followed by 2.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 reaches the fabrication press."),
    },
    integration: {
      title: "Misdirected Arm",
      start: ["turn(LEFT)"],
      cursor: { line: 0, col: 4 },
      target: ["turn(left)"],
      optimal: "l4~",
      helper:
        "Move to the uppercase letter, then use a counted case toggle to rewrite the whole word in one action.",
      hints: [
        "The word is TURN and must become lowercase.",
        "Move to the L with l, then press 4~ to toggle the word.",
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
        "~ toggles the case under the cursor, so you can fix each initial letter while moving down the file.",
      hints: [
        "Each verb starts with the wrong case.",
        "Toggle the first letter on each line, then move with j0 to the next start.",
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
        "i enters Insert mode before the cursor, and <Esc> exits back to Normal mode when the edit is done.",
      hints: [
        "The cursor is sitting right before the closing parenthesis.",
        "Press i, type 2, then press <Esc>.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 reaches the parts rack."),
    },
    integration: {
      title: "Missing Calibration",
      start: ["set(press, )"],
      target: ["set(press, 4)"],
      optimal: "$i4<Esc>",
      helper:
        "Move to the end of the line, then insert the missing value before the closing parenthesis.",
      hints: [
        "The cursor should end at the final parenthesis.",
        "Use $ to move there, then i to insert 4 before the closing parenthesis.",
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
        "Insert mode repairs each missing argument in place, while $ and j help you reach every closing parenthesis efficiently.",
      hints: [
        "Each call is missing its argument before the closing parenthesis.",
        "Fix the first one at the cursor, then use j$ to land at the end of the next line and insert the remaining values.",
      ],
      scene: {
        tiles: ["....", "....", ".P..", "...."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "PATCH-5 completes the assembly route.",
          conditions: [{ robotAt: { x: 2, y: 3 } }, { robotFacing: "S" }],
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
      helper: "o creates a new line below the current one and immediately starts Insert mode for the new command.",
      hints: [
        "The new instruction belongs immediately below the comment.",
        "Press o, type move(2), then press <Esc>.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 leaves dispatch."),
    },
    integration: {
      title: "Missing Header",
      start: ["move(2)"],
      target: ["# approved", "move(2)"],
      optimal: "O# approved<Esc>",
      helper:
        "O inserts a line above the current one, which is useful when a comment must explain the command without changing the execution path.",
      hints: [
        "The approval note belongs before the move command.",
        "Use O, type # approved, then press <Esc>.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 runs the approved route."),
    },
    advanced: {
      title: "Missing Safety Steps",
      start: ["open(press)", "close(press)"],
      target: ["open(press)", "wait(2)", "move(1)", "close(press)"],
      optimal: "owait(2)<Esc>omove(1)<Esc>",
      helper:
        "Repeat o to add new lines in the middle of a block while keeping the surrounding instructions intact.",
      hints: [
        "The missing safety steps belong between open(press) and close(press).",
        "Open a new line below the first instruction for wait(2), then open another line below the new one for move(1).",
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
      helper: "dd removes the entire current line, which is exactly what you want for a stale debug statement.",
      hints: [
        "The first line is an unwanted debug comment and should be removed entirely.",
        "Press dd to delete it.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 ignores the stale debug line."),
    },
    integration: {
      title: "Trailing Diagnostic",
      start: ["move(2)", "# remove"],
      target: ["move(2)"],
      optimal: "Gdd",
      helper:
        "G jumps to the last line, then dd deletes the stray diagnostic without changing the valid command above it.",
      hints: [
        "The final line is the extra diagnostic and should be deleted.",
        "Use G, then dd.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 runs the compact controller."),
    },
    advanced: {
      title: "Split Assembly",
      start: ["# obsolete", "open(press", ")", "move(1)", "close(press)"],
      target: ["open(press)", "move(1)", "close(press)"],
      optimal: "ddJ",
      helper:
        "Delete the comment line, then use J to join the split call back into a single instruction.",
      hints: [
        "A useless comment sits above the broken open(press) call.",
        "Press dd to remove the comment, then use J to join the split function call.",
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
        "u undoes the last edit, so you can test a correction, reverse it, and then restore the final value.",
      hints: [
        "Change 1 to 2, undo it, then make the same replacement again.",
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
      helper:
        "<C-r> redoes the last undone change, which is useful when you temporarily revert a fix and need it back.",
      hints: [
        "The correct value is 3, but the edit is undone before it is restored.",
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
        "Undo to back up through the history, then redo the corrected branch after a mistaken replacement changes the timeline.",
      hints: [
        "The first replacement is wrong; undo it, then make the correct one.",
        "Undo the correct edit once more and finish with <C-r> to restore the final version.",
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
      helper: "cc replaces the entire current line, which is the best move when the whole instruction is wrong.",
      hints: [
        "The entire instruction must be rewritten.",
        "Press cc, type move(2), then press <Esc>.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 replaces the stalled instruction."),
    },
    integration: {
      title: "Replace Final Action",
      start: ["turn(right)", "wait(9)"],
      target: ["turn(right)", "move(2)"],
      optimal: "Gccmove(2)<Esc>",
      helper:
        "G moves to the last line, then cc rewrites the entire instruction without touching the lines above it.",
      hints: [
        "Only the last instruction is wrong.",
        "Use G, then cc, type move(2), and finish with <Esc>.",
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
        "Use cc on each line to replace the whole instruction, then move down with j to continue the cycle rebuild.",
      hints: [
        "Every line in the sequence must be rewritten completely.",
        "Run cc on the first line, then use j to reach the next one and repeat the same replacement pattern.",
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
      helper: "yy copies the current line, and p pastes it below to duplicate the instruction.",
      hints: [
        "The same move command is needed twice.",
        "Use yy, then p to duplicate it.",
      ],
      scene: routeScene(robot, 2, "PATCH-5 repeats the conveyor step."),
    },
    integration: {
      title: "Mirror the Shutdown",
      start: ["close(press)", "move(1)", "# replace"],
      target: ["close(press)", "move(1)", "close(press)"],
      optimal: "yyGp",
      helper:
        "Yank a whole line, jump to the end of the file, and put it there to replace the placeholder without losing the original.",
      hints: [
        "The last line is a placeholder that needs the earlier close(press) command copied over it.",
        "Use yy, G, then p.",
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
        "Counts extend yank and put so you can duplicate several lines as one block and place it where the cycle repeats.",
      hints: [
        "The first two lines form the reusable cycle.",
        "Use 2yy, then place the block at the end with 2p to replace both placeholders.",
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

