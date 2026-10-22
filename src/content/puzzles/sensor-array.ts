import { defineConceptPuzzles, routeScene } from "./shared.ts";

const robot = "TRACE-4";

export const sensorArrayPuzzles = [
  ...defineConceptPuzzles("repeat", {
    introductory: {
      title: "Twin Fault",
      start: ["movx(1)", "movx(1)"],
      cursor: { line: 0, col: 3 },
      target: ["move(1)", "move(1)"],
      optimal: "rej0lllre",
      helper:
        ". repeats the most recent change, including the replacement character.",
      hints: [
        "Fix the first x by replacing it with e.",
        "Move down and to column zero, then press . on the second x position after moving right three.",
      ],
      scene: routeScene(robot, 2, "TRACE-4 repeats the repaired scan step."),
    },
    integration: {
      title: "Repeated Labels",
      start: ["grab('scrap')", "grab('scrap')", "grab('scrap')"],
      cursor: { line: 0, col: 7 },
      target: ["grab('cell')", "grab('cell')", "grab('cell')"],
      optimal: "ci'cell<Esc>j0f'lci'cell<Esc>j0f'lci'cell<Esc>",
      helper:
        "After one delimiter change, . can replay the complete edit on matching later lines.",
      hints: [
        "Change the first quoted name to cell.",
        "Move down and press . on each later quoted name.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [
          { kind: "cargo", name: "cell", x: 1, y: 1 },
          { kind: "cargo", name: "scrap", x: 1, y: 1 },
        ],
        objective: {
          text: "TRACE-4 selects the first good cell.",
          conditions: [{ holding: "cell" }],
        },
      },
    },
    advanced: {
      title: "Array-Wide Repair",
      start: ["open(bay1)x", "open(bay2)x", "open(bay3)x", "move(2)"],
      cursor: { line: 0, col: 10 },
      target: ["open(bay1)", "open(bay2)", "open(bay3)", "move(2)"],
      optimal: "xj$xj$x",
      helper:
        "Repeat can replay a deletion while motions reposition to equivalent faults across several lines.",
      hints: [
        "Delete the first trailing x to establish the change.",
        "For each later bay line, descend, use $, and repeat with .",
      ],
      scene: routeScene(robot, 2, "TRACE-4 restores every sensor bay."),
    },
  }),
  ...defineConceptPuzzles("search", {
    introductory: {
      title: "Find the Fault",
      start: ["open(bay1)", "move(2)", "closeX(bay1)"],
      target: ["open(bay1)", "move(2)", "close(bay1)"],
      optimal: "/X<CR>x",
      helper: "/pattern<CR> searches forward and lands on the match.",
      hints: ["Search for the unique X.", "Use /X<CR>, then x."],
      scene: routeScene(robot, 2, "TRACE-4 closes the scanned bay."),
    },
    integration: {
      title: "Next Corrupt Reading",
      start: ['say("bad")', "move(1)", 'say("bad")'],
      cursor: { line: 0, col: 5 },
      target: ['say("ok")', "move(1)", 'say("ok")'],
      optimal: 'ci"ok<Esc>/bad<CR>ci"ok<Esc>',
      helper:
        "Search jumps to a later occurrence after an earlier text-object change.",
      hints: [
        "Fix the first quoted word, then search for the remaining bad.",
        'Use ci", then /bad<CR> and repeat the quoted change.',
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "TRACE-4 reports both readings as okay.",
          conditions: [{ said: "ok" }],
        },
      },
    },
    advanced: {
      title: "Search and Repeat Sweep",
      start: [
        "move(1) BAD",
        "turn(right)",
        "move(2) BAD",
        "turn(left)",
        "move(1) BAD",
      ],
      target: ["move(1)", "turn(right)", "move(2)", "turn(left)", "move(1)"],
      optimal: "/ BAD<CR>4x n4x n4x",
      helper:
        "n repeats the latest search, allowing the same edit to be applied to separated matches.",
      hints: [
        "Search for the leading space plus BAD so each match starts at removable text.",
        "Delete four characters, then use n and 4x for each remaining match.",
      ],
      scene: {
        tiles: [".....", "....P", ".....", "....."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "TRACE-4 completes the cleaned sensor sweep.",
          conditions: [{ robotAt: { x: 4, y: 2 } }, { robotFacing: "E" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("word-search", {
    introductory: {
      title: "Matching Device",
      start: ["set(scan, 1)", "set(scan, 9)"],
      cursor: { line: 0, col: 4 },
      target: ["set(scan, 1)", "set(scan, 1)"],
      optimal: "*f9r1",
      helper: "* searches forward for the word under the cursor.",
      hints: [
        "The cursor is on scan; its next occurrence is on the faulty line.",
        "Use *, then f9r1.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "device", name: "scan", value: 0, min: 0, max: 1 }],
        objective: {
          text: "TRACE-4 holds scanner one at its valid value.",
          conditions: [{ device: { name: "scan", is: 1 } }],
        },
      },
    },
    integration: {
      title: "Previous Channel",
      start: ["open(bay2)", "move(1)", "close(bay2)x"],
      cursor: { line: 2, col: 6 },
      target: ["open(bay2)", "move(1)", "close(bay2)"],
      optimal: "#*$x",
      helper:
        "# searches backward for the current word; * can return forward before an edge edit.",
      hints: [
        "Use # to confirm the prior bay2 reference, then * to return.",
        "At the closing line, use $x.",
      ],
      scene: routeScene(
        robot,
        1,
        "TRACE-4 verifies the same bay in both directions.",
      ),
    },
    advanced: {
      title: "Channel Consistency",
      start: [
        "set(scan, 1)",
        'say("scan ready")',
        "set(scan, 9)",
        'say("scan done")',
      ],
      cursor: { line: 0, col: 4 },
      target: [
        "set(scan, 1)",
        'say("scan ready")',
        "set(scan, 1)",
        'say("scan done")',
      ],
      optimal: "*n f9r1",
      helper:
        "Word search ignores intervening lines and lands on a matching identifier for a precise follow-up edit.",
      hints: [
        "Search from the first scan identifier to the next one.",
        "Use *, then seek 9 and replace it with 1.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "device", name: "scan", value: 0, min: 0, max: 1 }],
        objective: {
          text: "TRACE-4 completes the consistent scanner cycle.",
          conditions: [
            { device: { name: "scan", is: 1 } },
            { said: "scan done" },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("visual", {
    introductory: {
      title: "Selected Static",
      start: ["xxxmove(2)"],
      target: ["move(2)"],
      optimal: "vllx",
      helper:
        "v starts a characterwise Visual selection; a motion extends it and x deletes it.",
      hints: [
        "Select the three leading x characters.",
        "Use v, move right twice, then x.",
      ],
      scene: routeScene(robot, 2, "TRACE-4 removes the selected static."),
    },
    integration: {
      title: "Selected Debug Lines",
      start: ["# one", "# two", "move(2)"],
      target: ["move(2)"],
      optimal: "Vjx",
      helper:
        "V selects whole lines; j extends the selection and x deletes it.",
      hints: [
        "The first two complete lines are unwanted.",
        "Use V, j, then x.",
      ],
      scene: routeScene(robot, 2, "TRACE-4 drops the selected diagnostics."),
    },
    advanced: {
      title: "Pivoted Selection",
      start: ["junk move(1) scrap", "move(1)"],
      cursor: { line: 0, col: 4 },
      target: [" move(1) scrap", "move(1)"],
      optimal: "0vex",
      helper:
        "o swaps the active end of a Visual selection, enabling adjustment from the opposite edge.",
      hints: [
        "Start inside move, select, then pivot with o to adjust the left edge.",
        "Use v, o, b, then x to remove the leading region.",
      ],
      scene: routeScene(
        robot,
        1,
        "TRACE-4 keeps the selected valid instruction.",
      ),
    },
  }),
  ...defineConceptPuzzles("visual-block", {
    introductory: {
      title: "Stray Column",
      start: ["xmove(1)", "xmove(1)", "xmove(1)"],
      target: ["move(1)", "move(1)", "move(1)"],
      optimal: "<C-v>jjx",
      helper:
        "<C-v> starts a rectangular Visual block across matching columns.",
      hints: [
        "All three faults share column zero.",
        "Use <C-v>, move down twice, then x.",
      ],
      scene: routeScene(robot, 3, "TRACE-4 clears the repeated scan column."),
    },
    integration: {
      title: "Two-Column Noise",
      start: ["xxmove(1)", "xxturn(left)", "xxmove(2)"],
      target: ["move(1)", "turn(left)", "move(2)"],
      optimal: "<C-v>jjlx",
      helper:
        "A block selection can span both rows and columns before an earlier delete action.",
      hints: [
        "The unwanted rectangle is two columns wide and three lines tall.",
        "Select with <C-v>, move down twice and right once, then x.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "TRACE-4 clears the rectangular interference.",
          conditions: [{ robotAt: { x: 3, y: 2 } }, { robotFacing: "N" }],
        },
      },
    },
    advanced: {
      title: "Misaligned Telemetry Field",
      start: ["BAD move(1)", "BAD turn(right)", "BAD move(2)", 'BAD say("ok")'],
      target: ["move(1)", "turn(right)", "move(2)", 'say("ok")'],
      optimal: "<C-v>jjjlllx",
      helper:
        "A four-line block selection removes one aligned field across a larger program.",
      hints: [
        "The BAD prefix occupies the same four columns on every line.",
        "Select that rectangle from top to bottom, then delete it.",
      ],
      scene: routeScene(robot, 3, "TRACE-4 clears both telemetry margins."),
    },
  }),
  ...defineConceptPuzzles("indent", {
    introductory: {
      title: "Flat Block",
      start: ["repeat 2 {", "move(1)", "}"],
      cursor: { line: 1, col: 0 },
      target: ["repeat 2 {", "  move(1)", "}"],
      optimal: ">>",
      helper: ">> indents the current line by two spaces.",
      hints: [
        "The line inside the block needs one indentation level.",
        "Press >>.",
      ],
      scene: routeScene(robot, 2, "TRACE-4 runs the indented scan loop."),
    },
    integration: {
      title: "Overindented Branch",
      start: ["when sensor[1] == 1 {", "    move(2)", "}"],
      cursor: { line: 1, col: 4 },
      target: ["when sensor[1] == 1 {", "  move(2)", "}"],
      optimal: "<<",
      helper: "<< removes one indentation level from the current line.",
      hints: ["The body is indented twice instead of once.", "Press <<."],
      scene: {
        ...routeScene(robot, 2, "TRACE-4 follows the corrected sensor branch."),
        entities: [{ kind: "sensor", index: 1, reads: 1 }],
      },
    },
    advanced: {
      title: "Nested Alignment",
      start: ["repeat 2 {", "when sensor[1] == 1 {", "move(1)", "}", "}"],
      cursor: { line: 1, col: 0 },
      target: [
        "repeat 2 {",
        "  when sensor[1] == 1 {",
        "    move(1)",
        "  }",
        "}",
      ],
      optimal: "gg=G",
      helper:
        "= with a linewise motion recalculates indentation over nested ranges.",
      hints: [
        "The whole nested block needs structural reindentation.",
        "From the inner header, use a range that covers through its close, then align the remaining brace.",
      ],
      scene: {
        ...routeScene(robot, 2, "TRACE-4 executes the nested aligned scan."),
        entities: [{ kind: "sensor", index: 1, reads: 1 }],
      },
    },
  }),
  ...defineConceptPuzzles("named-registers", {
    introductory: {
      title: "Stored Instruction",
      start: ["move(1)", "# replace"],
      target: ["move(1)", "move(1)"],
      optimal: '"ayyj"ap',
      helper: '"a selects named register a for the following yank or put.',
      hints: [
        "Store the first line in register a.",
        'Use "ayy, move down, then "ap.',
      ],
      scene: routeScene(robot, 2, "TRACE-4 restores the stored instruction."),
    },
    integration: {
      title: "Protect the Route",
      start: ["move(1)", "turn(right)"],
      target: ["move(1)", "move(1)", "turn(right)", "move(1)"],
      optimal: '"ayy"apG"ap',
      helper:
        "A named register preserves copied text while other movement and edits occur.",
      hints: [
        "Save move(1) in register a and use it twice.",
        "Put it at the first placeholder, move down two lines, and put from a again.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "TRACE-4 preserves the route through later edits.",
          conditions: [{ robotAt: { x: 2, y: 2 } }, { robotFacing: "S" }],
        },
      },
    },
    advanced: {
      title: "Two Stored Patterns",
      start: ["open(bay1)", "close(bay1)"],
      target: [
        "open(bay1)",
        "close(bay1)",
        "open(bay1)",
        "close(bay1)",
        "open(bay1)",
      ],
      optimal: '"ayyj"byy"ap"bp"ap',
      helper:
        "Multiple named registers retain independent linewise patterns for interleaved reuse.",
      hints: [
        "Store open in a and close in b.",
        "At the placeholders, put from a, then b, then a.",
      ],
      scene: {
        tiles: ["...", ".B.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "door", name: "bay1", tile: "B", open: false }],
        objective: {
          text: "TRACE-4 replays the stored bay pattern.",
          conditions: [{ device: { name: "bay1", is: "open" } }],
        },
      },
    },
  }),
];
