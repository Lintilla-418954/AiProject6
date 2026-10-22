import { defineConceptPuzzles, routeScene } from "./shared.ts";

const robot = "SCOUT-3";

export const dockingRingPuzzles = [
  ...defineConceptPuzzles("grid-moves", {
    introductory: {
      title: "Loose Coupling",
      start: ["movex(2)"],
      cursor: { line: 0, col: 4 },
      target: ["move(2)"],
      optimal: "x",
      helper:
        "h j k l move one cell at a time; x removes the character under the cursor.",
      hints: [
        "The cursor is already on the loose x.",
        "Press x to cut the extra character.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 reaches the docking beacon."),
    },
    integration: {
      title: "Offset Thruster",
      start: ["move(3)x"],
      target: ["move(3)"],
      optimal: "7lx",
      helper:
        "Combine horizontal movement with x to remove a fault elsewhere on the line.",
      hints: [
        "The stray x is at the far end.",
        "Move right seven cells, then cut it.",
      ],
      scene: routeScene(robot, 3, "SCOUT-3 crosses the outer approach lane."),
    },
    advanced: {
      title: "Three Loose Leads",
      start: ["xmove(1)", "turn(left)x", "move(2)x"],
      target: ["move(1)", "turn(left)", "move(2)"],
      optimal: "xj$xj$x",
      helper:
        "Use vertical and horizontal grid movement to repair several lines without leaving Normal mode.",
      hints: [
        "The faults sit at alternating line edges.",
        "Cut the first x, then use j and $ for the trailing faults.",
      ],
      scene: {
        tiles: [".....", "...P.", ".....", "....."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "SCOUT-3 follows the bent approach into dock.",
          conditions: [{ robotAt: { x: 3, y: 1 } }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("word-hops", {
    introductory: {
      title: "Trailing Static",
      start: ["junk move(2)"],
      target: ["move(2)"],
      optimal: "dw",
      helper:
        "w jumps to the start of the next word; combine it with an operator to remove that word.",
      hints: [
        "Jump from move to junk.",
        "Use w, then delete the word with dw.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 clears the short approach."),
    },
    integration: {
      title: "Broken Verb",
      start: ["movee(3)"],
      target: ["move(3)"],
      optimal: "ex",
      helper: "e lands at a word end, where x can remove a stray character.",
      hints: [
        "The word ends on the extra e.",
        "Press e to land there, then x.",
      ],
      scene: routeScene(
        robot,
        3,
        "SCOUT-3 restores the main thruster command.",
      ),
    },
    advanced: {
      title: "Telemetry Chaff",
      start: ["junk move(1)", "noise turn(right)", "scrap move(2)"],
      target: ["move(1)", "turn(right)", "move(2)"],
      optimal: "dwjdwjdw",
      helper:
        "Word motions compose with operators and line movement to clear repeated leading corruption.",
      hints: [
        "Each line begins with one unwanted word and space.",
        "Use dw, then move down and repeat.",
      ],
      scene: {
        tiles: [".....", ".....", ".P...", "....."],
        robotStart: { x: 1, y: 2, facing: "E" },
        objective: {
          text: "SCOUT-3 takes the clean turn toward telemetry.",
          conditions: [{ robotAt: { x: 4, y: 2 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("line-ends", {
    introductory: {
      title: "End Marker",
      start: ["wait(2)x"],
      target: ["wait(2)"],
      optimal: "$x",
      helper: "$ jumps to the final character on the line.",
      hints: ["The fault is at the line end.", "Use $, then x."],
      scene: routeScene(robot, 2, "SCOUT-3 reaches marker two."),
    },
    integration: {
      title: "Indented Noise",
      start: ["  xmove(3)"],
      target: ["  move(3)"],
      optimal: "^x",
      helper:
        "^ jumps to the first nonblank character; x can remove the fault there.",
      hints: ["Ignore the leading spaces.", "Use ^ to reach x, then cut it."],
      scene: routeScene(robot, 3, "SCOUT-3 follows the indented route."),
    },
    advanced: {
      title: "Edge Calibration",
      start: ["xmove(1)x", "xturn(right)x", "xmove(2)x"],
      target: ["move(1)", "turn(right)", "move(2)"],
      optimal: "x$xj0x$xj0x$x",
      helper:
        "0 and $ move between opposite line edges; combine them with j and x for coordinated repairs.",
      hints: [
        "Every line has one bad character at each edge.",
        "Clear the left edge, use $ for the right, then descend and use 0.",
      ],
      scene: {
        tiles: ["....", "...P", "....", "...."],
        robotStart: { x: 1, y: 3, facing: "E" },
        objective: {
          text: "SCOUT-3 calibrates both route boundaries.",
          conditions: [{ robotAt: { x: 3, y: 2 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("program-ends", {
    introductory: {
      title: "Last Instruction",
      start: ["# route", "move(2)x"],
      target: ["# route", "move(2)"],
      optimal: "G$x",
      helper: "G jumps to the final line of the program; $ reaches its end.",
      hints: ["The only fault is on the last line.", "Use G, then $ and x."],
      scene: routeScene(
        robot,
        2,
        "SCOUT-3 executes the final route instruction.",
      ),
    },
    integration: {
      title: "Header and Footer",
      start: ["x# approach", "move(2)", "# verifiedx"],
      target: ["# approach", "move(2)", "# verified"],
      optimal: "xG$x",
      helper:
        "Use G with earlier edge movement to repair opposite ends of the program.",
      hints: [
        "Start on the bad header character.",
        "Cut it, jump to the program end, then cut the final x.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 accepts the verified route."),
    },
    advanced: {
      title: "Section Boundaries",
      start: ["x# primary", "move(1)", "", "x# reserve", "move(2)x"],
      target: ["# primary", "move(1)", "", "# reserve", "move(2)"],
      optimal: "x}jxj$x",
      helper:
        "} crosses a blank-line section boundary; combine it with edge movement for distant repairs.",
      hints: [
        "One fault is under the cursor and one is in the next section.",
        "Cut the first, use } to cross the blank line, then $x.",
      ],
      scene: routeScene(robot, 3, "SCOUT-3 runs both approach sections."),
    },
  }),
  ...defineConceptPuzzles("character-seek", {
    introductory: {
      title: "Wrong Beacon",
      start: ["move(9)"],
      target: ["move(2)"],
      optimal: "f9r2",
      helper: "f{char} seeks the next character on the line; r replaces it.",
      hints: ["Seek the incorrect 9.", "Use f9, then replace it with 2."],
      scene: routeScene(robot, 2, "SCOUT-3 locks onto beacon two."),
    },
    integration: {
      title: "Paired Coordinates",
      start: ["set(nav.1, 11)"],
      target: ["set(nav.2, 22)"],
      optimal: "f1r2l;r2l;r2",
      helper:
        "; repeats the last character seek; combine it with r to repair repeated symbols.",
      hints: [
        "All three 1 characters must become 2.",
        "Use f1 and r2, then repeat the seek with ; before each replacement.",
      ],
      scene: {
        tiles: ["....", ".P..", "...."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [
          { kind: "device", name: "nav.2", value: 0, min: 0, max: 22 },
        ],
        objective: {
          text: "SCOUT-3 calibrates navigation channel two.",
          conditions: [{ device: { name: "nav.2", is: 22 } }],
        },
      },
    },
    advanced: {
      title: "Reverse Sweep",
      start: ["move(1)", "set(nav.3, 33)", "move(3)"],
      cursor: { line: 1, col: 13 },
      target: ["move(1)", "set(nav.2, 22)", "move(3)"],
      optimal: "F3r2;r2;r2",
      helper:
        "F seeks backward and ; repeats that direction, enabling a reverse repair sweep.",
      hints: [
        "Begin at the right edge and seek backward for 3.",
        "Use F3r2, then ;r2 twice more.",
      ],
      scene: {
        tiles: [".......", "......P", "......."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [
          { kind: "device", name: "nav.2", value: 0, min: 0, max: 22 },
        ],
        objective: {
          text: "SCOUT-3 recalibrates navigation before crossing the lane.",
          conditions: [
            { device: { name: "nav.2", is: 22 } },
            { robotAt: { x: 5, y: 1 } },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("bracket-jump", {
    introductory: {
      title: "Doubled Bracket",
      start: ["move(2))"],
      cursor: { line: 0, col: 4 },
      target: ["move(2)"],
      optimal: "%lx",
      helper: "% jumps between matching brackets.",
      hints: [
        "The cursor starts on the opening parenthesis.",
        "Use % to reach its partner, then l and x.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 restores the bracketed distance."),
    },
    integration: {
      title: "Sensor Gate",
      start: ["when sensor[1]] == 1 {", "  move(2)", "}"],
      cursor: { line: 0, col: 11 },
      target: ["when sensor[1] == 1 {", "  move(2)", "}"],
      optimal: "%lx",
      helper:
        "% handles square brackets as well as parentheses; earlier grid edits finish the repair.",
      hints: [
        "Start on [ and jump to its matching ].",
        "Move one cell right and cut the doubled bracket.",
      ],
      scene: {
        ...routeScene(robot, 2, "SCOUT-3 enters when sensor one is active."),
        entities: [{ kind: "sensor", index: 1, reads: 1 }],
      },
    },
    advanced: {
      title: "Nested Gate",
      start: ["repeat 2 {{", "  move(1)", "}", "x"],
      cursor: { line: 0, col: 9 },
      target: ["repeat 2 {", "  move(1)", "}"],
      optimal: "$xGdd",
      helper:
        "% can cross lines to a matching brace; combine that jump with line deletion and program movement.",
      hints: [
        "The first opening brace matches the closing brace below.",
        "Jump with %, delete the trailing x line, return with gg, then remove the extra opening brace at $.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 completes the nested docking loop."),
    },
  }),
];
