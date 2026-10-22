import { defineConceptPuzzles, routeScene } from "./shared.ts";

const robot = "HAULER-7";

export const airlockNetworkPuzzles = [
  ...defineConceptPuzzles("counts", {
    introductory: {
      title: "Triple Static",
      start: ["###move(2)"],
      target: ["move(2)"],
      optimal: "3x",
      helper: "A numeric count repeats the following command.",
      hints: [
        "Three unwanted characters sit under and after the cursor.",
        "Use 3x.",
      ],
      scene: routeScene(robot, 2, "HAULER-7 clears the airlock approach."),
    },
    integration: {
      title: "Fourth Relay",
      start: ["move(1)", "move(1)", "move(1)", "move(1)x"],
      target: ["move(1)", "move(1)", "move(1)", "move(1)"],
      optimal: "3j$x",
      helper:
        "Counts apply to motions, so one command can cross several lines before an earlier edit.",
      hints: ["The fault is three lines below.", "Use 3j, then $x."],
      scene: routeScene(robot, 4, "HAULER-7 crosses four relay cells."),
    },
    advanced: {
      title: "Compressed Transit",
      start: ["xxxxxxxxmove(1)", "turn(right)", "move(4)xxxx"],
      target: ["move(1)", "turn(right)", "move(4)"],
      optimal: "8x2j$hhh4x",
      helper:
        "Compose counts with deletion and vertical movement to repair distant runs of corruption.",
      hints: [
        "There are eight bad characters at the start and four at the end.",
        "Use 8x, move down two lines, then $ followed by 4x from the last x by moving left three.",
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
      helper: "d{motion} deletes the text crossed by a motion.",
      hints: [
        "The unwanted word and its following space come first.",
        "Use dw.",
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
        "A count before d combines with a word motion to remove several words efficiently.",
      hints: ["Two leading words are unwanted.", "Use 2dw."],
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
        "Operator-motion edits can be composed with counted line movement across nonadjacent faults.",
      hints: [
        "Lines one, three, and four have leading debris words.",
        "Use dw, skip with 2j, use dw, then descend and repeat.",
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
        "c{motion} deletes a range and enters Insert mode for its replacement.",
      hints: [
        "Only the first word is wrong.",
        "Use cw, type move, then escape.",
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
        "Change a word in place while preserving punctuation and surrounding instructions.",
      hints: [
        "The cursor is on the direction word.",
        "Use cw, type right, then escape.",
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
        "Use change motions at different cursor positions to retask several related commands.",
      hints: [
        "The verbs on lines one and three and the direction on line two are wrong.",
        "Change the first word, descend to the direction with w, then use j0 for the final verb.",
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
      helper: "y{motion} copies a character range; p puts it after the cursor.",
      hints: [
        "Copy the 2 with a one-cell motion.",
        "Use yl, move down to the closing parenthesis with j$, then p.",
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
        "Yank through a word motion, then navigate to a quoted gap and put the copied text.",
      hints: [
        "Copy cell from inside the first quotes.",
        "Use yw, move down, use e then h to reach the opening quote, and put after it.",
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
        "A yanked word can be put into several distant argument slots without retyping it.",
      hints: [
        "Yank bay2 from the first call.",
        "After yw, descend and use $p in each empty call.",
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
      helper: "iw selects the word under the cursor independent of its edges.",
      hints: [
        "The cursor is inside scrap.",
        "Use ciw, type cell, then escape.",
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
        "aw includes a word and adjacent whitespace, making clean deletion possible from inside it.",
      hints: [
        "The cursor sits inside unsafe.",
        "Use daw to remove the word and one surrounding space.",
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
        "Word objects work inside different delimiters and compose with seek and line movement.",
      hints: [
        "Replace scrap in both the cargo command and message.",
        "Use ciw on the first, then descend, seek s, and use ciw again.",
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
      helper: "i' selects everything inside matching single quotes.",
      hints: [
        "Keep the quotes and replace only their contents.",
        "Use ci', type cell, then escape.",
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
        "i( selects the contents of the surrounding parentheses for a change.",
      hints: [
        "The call structure is correct; its argument is not.",
        "Use ci(, type 3, then escape.",
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
        "Different delimiter objects can target brackets and quotes within a multiline block.",
      hints: [
        "Fix the sensor index, comparison value, and quoted message.",
        'Use ci[ for the index, seek and replace the other digit, then ci" inside the message.',
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
      helper: "<C-a> increments the number under or after the cursor.",
      hints: ["The route needs one more step.", "Press <C-a>."],
      scene: routeScene(robot, 2, "HAULER-7 reaches the inner hatch."),
    },
    integration: {
      title: "Delayed Release",
      start: ["wait(1)", "move(2)"],
      cursor: { line: 0, col: 5 },
      target: ["wait(3)", "move(2)"],
      optimal: "2<C-a>",
      helper:
        "Counts scale a number tweak, changing a value by more than one efficiently.",
      hints: ["The wait must increase by two.", "Use 2<C-a>."],
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
        "Use counted increments and decrements on separate lines to rebalance a timed sequence.",
      hints: [
        "Reduce the first wait by three and increase the second by three.",
        "Use 3<C-x>, move down two lines, then 3<C-a>.",
      ],
      scene: routeScene(robot, 4, "HAULER-7 balances the pressure cycle."),
    },
  }),
];
