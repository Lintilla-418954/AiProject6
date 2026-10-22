import { defineConceptPuzzles, routeScene } from "./shared.ts";

const robot = "HAULER-7";

export const airlockNetworkPuzzles = [
  ...defineConceptPuzzles("counts", {
    introductory: {
      title: "Triple Static",
      start: ["###move(2)"],
      target: ["move(2)"],
      optimal: "3x",
      helper:
        "A count before an action repeats that action a fixed number of times, so 3x deletes three characters in a row.",
      hints: [
        "The bad text is a run of three characters right after the cursor.",
        "Press 3x to delete all three at once.",
      ],
      scene: routeScene(robot, 2, "HAULER-7 clears the airlock approach."),
    },
    integration: {
      title: "Fourth Relay",
      start: ["move(1)", "move(1)", "move(1)", "move(1)x"],
      target: ["move(1)", "move(1)", "move(1)", "move(1)"],
      optimal: "3j$x",
      helper:
        "A count can be used with a motion to travel several lines before deleting, which makes distant cleanup much shorter.",
      hints: [
        "The stray x is on the fourth line, three lines below the cursor.",
        "Use 3j to move down, then $x to delete the final character.",
      ],
      scene: routeScene(robot, 4, "HAULER-7 crosses four relay cells."),
    },
    advanced: {
      title: "Compressed Transit",
      start: ["xxxxxxxxmove(1)", "turn(right)", "move(4)xxxx"],
      target: ["move(1)", "turn(right)", "move(4)"],
      optimal: "8x2j$hhh4x",
      helper:
        "Counts can combine with deletion and line movement to clean up multiple broken runs in one sequence.",
      hints: [
        "Delete the eight damaged characters at the start, then move down two lines and remove the four trailing ones.",
        "Use 8x, 2j, $, hhh, and then 4x.",
      ],
      scene: {
        tiles: [
          "....",
          "....",
          "....",
          "....",
          "....",
          "....",
          "....",
          "..P.",
          "....",
        ],
        robotStart: { x: 1, y: 2, facing: "E" },
        objective: {
          text: "HAULER-7 takes the counted transit route.",
          conditions: [{ robotAt: { x: 2, y: 6 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("delete-motion", {
    introductory: {
      title: "Leading Debris",
      start: ["debris wait(3)x"],
      target: ["wait(3)"],
      optimal: "dw$x",
      helper:
        "d{motion} deletes the text that a motion crosses, so dw removes a whole word and the space that follows it.",
      hints: [
        "The unwanted text is a word followed by a space before wait(3).",
        "Use dw to remove the word, then $x to delete the stray x.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "HAULER-7 waits for the cleared route.",
          conditions: [{ robotAt: { x: 1, y: 1 } }],
        },
      },
    },
    integration: {
      title: "Long Prefix",
      start: ["old unsafe move(3)x"],
      target: ["move(3)"],
      optimal: "2dw$x",
      helper:
        "A count before a delete-motion command lets you remove several words in one action without touching the valid command after them.",
      hints: [
        "Two leading words are garbage before the real instruction.",
        "Use 2dw to delete both words, then $x to remove the stray trailing x.",
      ],
      scene: routeScene(
        robot,
        3,
        "HAULER-7 follows only the safe instruction.",
      ),
    },
    advanced: {
      title: "Quarantine Sweep",
      start: ["junk move(1)", "turn(left)", "trash wait(1)", "debris move(2)"],
      target: ["move(1)", "turn(left)", "wait(1)", "move(2)"],
      optimal: "dw2jdwjdw",
      helper:
        "Delete-motion edits can be chained with a counted jump to remove several dirty prefixes across different lines.",
      hints: [
        "The first, third, and fourth lines each start with junk to delete.",
        "Use dw, jump down with 2j, then repeat dw on the remaining dirty lines.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "HAULER-7 sweeps the quarantine lane.",
          conditions: [{ robotAt: { x: 3, y: 2 } }, { robotFacing: "N" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("change-motion", {
    introductory: {
      title: "Wrong Verb",
      start: ['say("wait")'],
      cursor: { line: 0, col: 5 },
      target: ['say("go")'],
      optimal: "cwgo<Esc>",
      helper:
        "c{motion} deletes the text covered by the motion and enters Insert mode, so cw changes a whole word in place.",
      hints: [
        "Only the word inside the quotes is wrong.",
        "Use cw, type go, then press <Esc>.",
      ],
      scene: routeScene(robot, 2, "HAULER-7 replaces the stalled verb."),
    },
    integration: {
      title: "Wrong Direction",
      start: ["turn(left)", "move(2)"],
      cursor: { line: 0, col: 5 },
      target: ["turn(right)", "move(2)"],
      optimal: "cwright<Esc>",
      helper:
        "Change a word in place while leaving the surrounding command structure alone, which is ideal for fixing a single argument.",
      hints: [
        "The cursor is on the direction word, and it needs to become right.",
        "Use cw, type right, then press <Esc>.",
      ],
      scene: {
        tiles: ["....", "....", ".P..", "...."],
        robotStart: { x: 1, y: 2, facing: "E" },
        objective: {
          text: "HAULER-7 turns toward the lower airlock.",
          conditions: [{ robotAt: { x: 1, y: 3 } }, { robotFacing: "S" }],
        },
      },
    },
    advanced: {
      title: "Retask the Convoy",
      start: ["wait(1)", "turn(left)", "wait(2)"],
      target: ["move(1)", "turn(right)", "move(2)"],
      optimal: "cwmove<Esc>j0cc turn(right)<Esc>0xj0cwmove<Esc>",
      helper:
        "Use change motions at different cursor positions to repair several commands in a row, even when the wrong text is on multiple lines.",
      hints: [
        "The first and third lines need new verbs, and the middle line needs a direction change.",
        "Change the first word, move down to the direction, then use j0 to fix the last line.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "HAULER-7 follows the retasked convoy route.",
          conditions: [{ robotAt: { x: 3, y: 2 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("yank-motion", {
    introductory: {
      title: "Copy the Distance",
      start: ["move(2)", "move()"],
      cursor: { line: 0, col: 5 },
      target: ["move(2)", "move(2)"],
      optimal: "ylj$P",
      helper:
        "y{motion} copies text that a motion crosses, and p inserts that copied text after the cursor; this is a quick way to duplicate one value.",
      hints: [
        "Copy the 2 from the first line, then place it after the cursor on the next line.",
        "Use yl, move down with j$, then p.",
      ],
      scene: routeScene(robot, 4, "HAULER-7 repeats the copied distance."),
    },
    integration: {
      title: "Copy the Cargo Name",
      start: ["grab('cell')", "say('')"],
      cursor: { line: 0, col: 6 },
      target: ["grab('cell')", "say('cell')"],
      optimal: "ywj$hP",
      helper:
        "Yank through a word motion to copy the text, then move to the destination and put it there without retyping it.",
      hints: [
        "Copy the word cell from inside the first quotes, then place it into the empty quote on the second line.",
        "Use yw, move to the target with j$h, then p.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "cargo", name: "cell", x: 1, y: 1 }],
        objective: {
          text: "HAULER-7 collects and reports the power cell.",
          conditions: [{ holding: "cell" }, { said: "cell" }],
        },
      },
    },
    advanced: {
      title: "Replicate the Airlock Name",
      start: ["open(bay2)", "close()", "open()"],
      cursor: { line: 0, col: 5 },
      target: ["open(bay2)", "close(bay2)", "open(bay2)"],
      optimal: "ywj$Pj$P",
      helper:
        "A copied word can be pasted into several distant argument slots, making repeated values easy to reproduce consistently.",
      hints: [
        "Copy bay2 from the first command and paste it into the empty call arguments below.",
        "Use yw, move to the target with j$, then p on each blank call.",
      ],
      scene: {
        tiles: ["....", ".B.P", "...."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "door", name: "bay2", tile: "B", open: false }],
        objective: {
          text: "HAULER-7 cycles bay two before crossing.",
          conditions: [
            { robotAt: { x: 3, y: 1 } },
            { device: { name: "bay2", is: "open" } },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("word-objects", {
    introductory: {
      title: "Scrap Label",
      start: ["grab('scrap')"],
      cursor: { line: 0, col: 7 },
      target: ["grab('cell')"],
      optimal: "ciwcell<Esc>",
      helper:
        "iw selects the word under the cursor as a whole object, so ciw replaces only the word itself without disturbing the surrounding quotes.",
      hints: [
        "The cursor is inside scrap, and the whole word must be replaced.",
        "Use ciw, type cell, then press <Esc>.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [
          { kind: "cargo", name: "cell", x: 1, y: 1 },
          { kind: "cargo", name: "scrap", x: 1, y: 1 },
        ],
        objective: {
          text: "HAULER-7 grabs the power cell.",
          conditions: [{ holding: "cell" }],
        },
      },
    },
    integration: {
      title: "Remove Filler Word",
      start: ["move(1) unsafe move(2)"],
      cursor: { line: 0, col: 10 },
      target: ["move(1) move(2)"],
      optimal: "daw",
      helper:
        "aw selects a word together with the surrounding whitespace, which makes it perfect for removing filler text cleanly.",
      hints: [
        "The cursor sits inside unsafe, and the word plus its bordering space should disappear.",
        "Use daw to delete the filler word cleanly.",
      ],
      scene: routeScene(
        robot,
        3,
        "HAULER-7 follows the cleaned two-step route.",
      ),
    },
    advanced: {
      title: "Retag the Manifest",
      start: ["grab('scrap')", 'say("scrap loaded")', "drop()"],
      cursor: { line: 0, col: 7 },
      target: ["grab('cell')", 'say("cell loaded")', "drop()"],
      optimal: "ciwcell<Esc>j0fsciwcell<Esc>",
      helper:
        "Word objects can replace a name within different text delimiters and can be combined with search and line movement to edit multiple occurrences.",
      hints: [
        "Replace scrap in both the cargo command and the message text.",
        "Use ciw on the first word, then move down and repeat after finding the s in the message.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [
          { kind: "cargo", name: "cell", x: 1, y: 1 },
          { kind: "cargo", name: "scrap", x: 1, y: 1 },
        ],
        objective: {
          text: "HAULER-7 transfers and reports the cell.",
          conditions: [
            { cargoAt: { name: "cell", x: 1, y: 1 } },
            { said: "cell loaded" },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("delimiter-objects", {
    introductory: {
      title: "Wrong Cargo",
      start: ["grab('ore')"],
      cursor: { line: 0, col: 7 },
      target: ["grab('cell')"],
      optimal: "ci'cell<Esc>",
      helper:
        "i' selects the contents inside single quotes, so you can replace just the cargo name while keeping the surrounding delimiters intact.",
      hints: [
        "Keep the quotes and replace only the cargo name inside them.",
        "Use ci', type cell, then press <Esc>.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [
          { kind: "cargo", name: "cell", x: 1, y: 1 },
          { kind: "cargo", name: "scrap", x: 1, y: 1 },
        ],
        objective: {
          text: "HAULER-7 selects the correct cargo.",
          conditions: [{ holding: "cell" }],
        },
      },
    },
    integration: {
      title: "Replace Call Argument",
      start: ["open(bay99)"],
      cursor: { line: 0, col: 6 },
      target: ["open(bay3)"],
      optimal: "ci(bay3<Esc>",
      helper:
        "i( selects the content inside parentheses, making it easy to replace a call argument without rewriting the whole function call.",
      hints: [
        "The function name and parentheses are correct; only the number inside needs to change.",
        "Use ci(, type bay3, then press <Esc>.",
      ],
      scene: routeScene(
        robot,
        3,
        "HAULER-7 crosses the corrected airlock distance.",
      ),
    },
    advanced: {
      title: "Nested Sensor Rewrite",
      start: ["when sensor[4] == 4 {", '  say("unsafe")', "}"],
      cursor: { line: 0, col: 12 },
      target: ["when sensor[2] == 2 {", '  say("clear")', "}"],
      optimal: 'ci[2<Esc>f4r2j0f"lci"clear<Esc>',
      helper:
        "Different delimiter objects can target bracketed values and quoted text inside a multiline block, so one edit can fix several related fields at once.",
      hints: [
        "Fix the index, the comparison value, and the quoted message in the same block.",
        "Use ci[ for the index, then fix the other number and the message text with the appropriate delimiter object.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "sensor", index: 2, reads: 2 }],
        objective: {
          text: "HAULER-7 reports the safe sensor state.",
          conditions: [{ said: "clear" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("number-tweak", {
    introductory: {
      title: "One Step Short",
      start: ["set(flow, 1)"],
      cursor: { line: 0, col: 10 },
      target: ["set(flow, 2)"],
      optimal: "<C-a>",
      helper:
        "<C-a> increments the number under or just after the cursor, which is the simplest way to nudge a value upward by one.",
      hints: [
        "The route needs one more step, so increase the number by one.",
        "Press <C-a>.",
      ],
      scene: routeScene(robot, 2, "HAULER-7 reaches the inner hatch."),
    },
    integration: {
      title: "Delayed Release",
      start: ["wait(1)", "move(2)"],
      cursor: { line: 0, col: 5 },
      target: ["wait(3)", "move(2)"],
      optimal: "2<C-a>",
      helper:
        "A count before <C-a> adds more than one to a number, letting you adjust a value in a single motion.",
      hints: [
        "The wait must increase by two, not by one.",
        "Use 2<C-a> to add two to the number under the cursor.",
      ],
      scene: {
        ...routeScene(robot, 2, "HAULER-7 waits for the timed hatch."),
        entities: [{ kind: "door", name: "timer", tile: "T", open: true }],
      },
    },
    advanced: {
      title: "Balance the Cycle",
      start: ["wait(6)", "move(2)", "wait(1)", "move(2)"],
      cursor: { line: 0, col: 5 },
      target: ["wait(3)", "move(2)", "wait(4)", "move(2)"],
      optimal: "3<C-x>2j3<C-a>",
      helper:
        "Use increments and decrements on separate lines to rebalance a timed sequence without rewriting the whole pattern.",
      hints: [
        "Reduce the first wait by three and increase the second wait by three.",
        "Use 3<C-x>, move down two lines, then 3<C-a>.",
      ],
      scene: routeScene(robot, 4, "HAULER-7 balances the pressure cycle."),
    },
  }),
];

