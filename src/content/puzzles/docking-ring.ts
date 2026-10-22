import { defineConceptPuzzles, routeScene } from "./shared.ts";

const robot = "SCOUT-3";

export const dockingRingPuzzles = [
  ...defineConceptPuzzles("grid-moves", {
    introductory: {
      title: "Loose Coupling",
      start: ["moxve(2)"],
      target: ["move(2)"],
      optimal: "llx",
      helper:
        "Use h to move left, j to move down, k to move up, l to move right and x to remove",
      hints: [
        "You need to move right and then remove the x that is in the way",
        "Move right until the cursor reaches x, then cut it.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 reaches the docking beacon."),
    },
    integration: {
      title: "Split Couplings",
      start: ["mxove(1)", "movex(2)"],
      target: ["move(1)", "move(2)"],
      optimal: "lxjlllx",
      helper:
        "Move horizontally and vertically to remove faults on different lines.",
      hints: [
        "Each line has one extra x at a different column.",
        "Repair the first line, move down, then travel right to the second fault.",
      ],
      scene: routeScene(robot, 3, "SCOUT-3 crosses the outer approach lane."),
    },
    advanced: {
      title: "Three Loose Leads",
      start: ["movex(2)", "turxn(right)", "mxove(2)"],
      target: ["move(2)", "turn(right)", "move(2)"],
      optimal: "jjlxkllxklx",
      helper:
        "Plan a route with hjkl and use x to fix the faulty lines in the code",
      hints: [
        "The three faults occupy different columns.",
        "Start with the lower fault, then work upward through the remaining lines.",
      ],
      scene: {
        tiles: [".....", ".....", ".....", "...P.", "....."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "SCOUT-3 follows the bent approach into dock.",
          conditions: [{ robotAt: { x: 3, y: 3 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("word-hops", {
    introductory: {
      title: "Trailing Static",
      start: ["move(2)xx"],
      target: ["move(2)"],
      optimal: "Exx",
      helper:
        "E hops to the end of the current nonblank string; x removes trailing faults.",
      hints: [
        "Treat the Robot statement as one nonblank string.",
        "Hop to the statement's end, then cut both extra characters.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 clears the short approach."),
    },
    integration: {
      title: "Paired Static",
      start: ["move(1)x", "move(2)x"],
      target: ["move(1)", "move(2)"],
      optimal: "ExjEx",
      helper:
        "Use word-end hops with earlier line movement and x to repair separate statements.",
      hints: [
        "Each statement has one fault just beyond its final word.",
        "Repair the first end, move down, and use the same word hop again.",
      ],
      scene: routeScene(robot, 3, "SCOUT-3 restores both approach pulses."),
    },
    advanced: {
      title: "Telemetry Tails",
      start: ["move(2)xx", "turn(right)xx", "move(2)xx"],
      target: ["move(2)", "turn(right)", "move(2)"],
      optimal: "ExxjExxjExx",
      helper:
        "Repeated word-end hops reach trailing faults efficiently across a multiline Program.",
      hints: [
        "Every line has two bad characters after its final word.",
        "Repair one line at a time, descending without walking each column.",
      ],
      scene: {
        tiles: [".....", ".....", ".....", "...P.", "....."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "SCOUT-3 turns through the telemetry approach.",
          conditions: [{ robotAt: { x: 3, y: 3 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("line-ends", {
    introductory: {
      title: "End Marker",
      start: ["move (2)xx"],
      target: ["move (2)"],
      optimal: "$xx",
      helper: "$ jumps directly to the final character on the current line.",
      hints: [
        "The faults are at the far edge of the statement.",
        "Jump to the line end, then remove both markers.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 reaches marker two."),
    },
    integration: {
      title: "Indented Boundary",
      start: ["repeat 2 {x", "  xmove(1)xx", "}"],
      target: ["repeat 2 {", "  move(1)", "}"],
      optimal: "$xj^x$xx",
      helper:
        "$ reaches trailing faults while ^ finds the first nonblank character on an indented line.",
      hints: [
        "One fault is at the first line's end; the indented line has faults at both edges.",
        "Repair the header, descend past the spaces, then inspect the body line's far edge.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 repeats the docking pulse."),
    },
    advanced: {
      title: "Edge Calibration",
      start: [
        "xmove (1)xx",
        "# route",
        "xturn(right)xx",
        "# finish",
        "xmove (3)xx",
      ],
      target: ["move (1)", "# route", "turn(right)", "# finish", "move (3)"],
      optimal: "x$xxjj0x$xxjj0x$xx",
      helper:
        "0 and $ alternate between opposite line edges while j crosses the Program.",
      hints: [
        "The executable lines have faults at both edges; comments separate them.",
        "Clear each left edge, jump to its right edge, then descend to the next statement.",
      ],
      scene: {
        tiles: ["......", "......", "......", "....P.", "......"],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "SCOUT-3 calibrates both route boundaries.",
          conditions: [{ robotAt: { x: 2, y: 4 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("program-ends", {
    introductory: {
      title: "Last Instruction",
      start: ["# route", "# check", "move (2)x"],
      target: ["# route", "# check", "move (2)"],
      optimal: "G$x",
      helper: "G jumps to the final line of the Program; $ reaches its end.",
      hints: [
        "The fault is on the final instruction.",
        "Jump to the Program's last line before moving to its right edge.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 executes the final instruction."),
    },
    integration: {
      title: "Header and Footer",
      start: ["x# route", "# check", "move (1)", "# finish", "move (2)xx"],
      target: ["# route", "# check", "move (1)", "# finish", "move (2)"],
      optimal: "xG$xx",
      helper:
        "G combines with earlier edge movement to repair opposite ends of a longer Program.",
      hints: [
        "Start by clearing the bad header character.",
        "Jump to the final line and inspect its far edge for the remaining faults.",
      ],
      scene: routeScene(robot, 3, "SCOUT-3 accepts the verified route."),
    },
    advanced: {
      title: "Section Boundaries",
      start: [
        "x# primary",
        "move(2)",
        "",
        "x# turn",
        "turn(right)",
        "",
        "move(2)x",
      ],
      target: [
        "# primary",
        "move(2)",
        "",
        "# turn",
        "turn(right)",
        "",
        "move(2)",
      ],
      optimal: "x}jx}j$x",
      helper:
        "} crosses blank-line section boundaries; combine section jumps with precise edge repairs.",
      hints: [
        "Each section boundary leads to another distant fault.",
        "Repair the header, jump section by section, and finish at the final line's edge.",
      ],
      scene: {
        tiles: [".....", ".....", ".....", "...P.", "....."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "SCOUT-3 runs all three approach sections.",
          conditions: [{ robotAt: { x: 3, y: 3 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("character-seek", {
    introductory: {
      title: "Hidden Marker",
      start: ["move(2)xxxxx # route"],
      target: ["move(2) # route"],
      optimal: "fxxxxxx",
      helper:
        "f{char} seeks the next occurrence of a character; x can remove the character it finds.",
      hints: [
        "The bad x appears before a trailing comment.",
        "Seek x directly instead of walking across the statement.",
      ],
      scene: routeScene(robot, 2, "SCOUT-3 locks onto route two."),
    },
    integration: {
      title: "Paired Markers",
      start: ["move(1) x# first", "move(2) x# second"],
      target: ["move(1) # first", "move(2) # second"],
      optimal: "fxxjfxx",
      helper:
        "Use f with earlier line movement and x to find the same fault on multiple statements.",
      hints: [
        "Each line contains an x before its comment.",
        "Seek and cut the first marker, descend, then seek again.",
      ],
      scene: routeScene(robot, 3, "SCOUT-3 follows both marked vectors."),
    },
    advanced: {
      title: "Repeated Signal",
      start: ["move(x2)x x# route", "turn(right)", "move(2)"],
      target: ["move(2) # route", "turn(right)", "move(2)"],
      optimal: "fxx;x;x",
      helper:
        "; repeats the last character seek, allowing a sweep through repeated faults on one line.",
      hints: [
        "All three x markers are on the first line.",
        "Seek the first x, then repeat that seek before each remaining cut.",
      ],
      scene: {
        tiles: [".....", ".....", ".....", "...P.", "....."],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: "SCOUT-3 follows the recovered route signal.",
          conditions: [{ robotAt: { x: 3, y: 3 } }, { robotFacing: "S" }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("bracket-jump", {
    introductory: {
      title: "Doubled Bracket",
      start: ["move(1))) # junk"],
      cursor: { line: 0, col: 4 },
      target: ["move(1) # junk"],
      optimal: "%xx",
      helper:
        "% jumps between matching brackets, even when text follows the fault.",
      hints: [
        "The cursor starts on the opening parenthesis.",
        "Jump to its partner, then cut both doubled brackets.",
      ],
      scene: routeScene(robot, 1, "SCOUT-3 restores the bracketed distance."),
    },
    integration: {
      title: "Sensor Gate",
      start: ["when sensor[1]] == 1 { # gate", "  xmove(2)", "}"],
      cursor: { line: 0, col: 11 },
      target: ["when sensor[1] == 1 { # gate", "  move(2)", "}"],
      optimal: "%lxj^x",
      helper:
        "% handles square brackets; earlier line and edge movement finish a second repair.",
      hints: [
        "Jump across the sensor index to reach the doubled bracket.",
        "After cutting it, descend and use indentation-aware movement for the other fault.",
      ],
      scene: {
        ...routeScene(robot, 2, "SCOUT-3 enters when sensor one is active."),
        entities: [{ kind: "sensor", index: 1, reads: 1 }],
      },
    },
    advanced: {
      title: "Nested Gate",
      start: [
        "repeat 2 {",
        "  when sensor[1]] == 1 {",
        "    move(2)",
        "  }} # gate",
        "}x # end",
      ],
      cursor: { line: 1, col: 13 },
      target: [
        "repeat 2 {",
        "  when sensor[1] == 1 {",
        "    move(2)",
        "  } # gate",
        "} # end",
      ],
      optimal: "%lxf{%lxG0lx",
      helper:
        "% crosses nested bracket pairs; combine those jumps with earlier seeking and Program movement.",
      hints: [
        "The sensor bracket and both closing braces have doubled partners.",
        "Repair the square bracket, seek the inner brace, then finish at the Program's final brace.",
      ],
      scene: {
        ...routeScene(robot, 8, "SCOUT-3 completes the nested docking loop."),
        entities: [{ kind: "sensor", index: 1, reads: 1 }],
        objective: {
          text: "SCOUT-3 completes the nested docking loop.",
          conditions: [{ robotAt: { x: 5, y: 1 } }],
        },
      },
    },
  }),
];
