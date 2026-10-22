import { defineConceptPuzzles, routeScene } from "./shared.ts";

const robot = "RELAY-0";

export const commandCorePuzzles = [
  ...defineConceptPuzzles("macros", {
    introductory: {
      title: "Record the Repair",
      start: ["move(0)", "move(0)", "move(0)"],
      cursor: { line: 0, col: 5 },
      target: ["move(1)", "move(1)", "move(1)"],
      optimal: "qa<C-a>j0f0q2@a",
      helper:
        "q{register} records keys until q; @{register} replays the recording.",
      hints: [
        "Record incrementing the digit and moving to the next line.",
        "Use qa, <C-a>, j0f0, q, then 2@a.",
      ],
      scene: routeScene(robot, 3, "RELAY-0 replays the movement repair."),
    },
    integration: {
      title: "Reprogram the Relays",
      start: ["set(core, 0)", "set(core, 0)", "set(core, 0)", 'say("ready")'],
      cursor: { line: 0, col: 10 },
      target: ["set(core, 2)", "set(core, 2)", "set(core, 2)", 'say("ready")'],
      optimal: "qa2<C-a>j0f0q2@a",
      helper:
        "A macro can combine counted number edits with earlier navigation before replay.",
      hints: [
        "Each core value needs the same +2 repair.",
        "Record 2<C-a> plus movement to the next zero, then replay twice.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "device", name: "core", value: 0, min: 0, max: 2 }],
        objective: {
          text: "RELAY-0 programs and announces the core.",
          conditions: [{ device: { name: "core", is: 2 } }, { said: "ready" }],
        },
      },
    },
    advanced: {
      title: "Alternating Automation",
      start: [
        "xopen(bay1)",
        "xclose(bay1)",
        "xopen(bay1)",
        "xclose(bay1)",
        "xopen(bay1)",
      ],
      cursor: { line: 0, col: 0 },
      target: [
        "open(bay1)",
        "close(bay1)",
        "open(bay1)",
        "close(bay1)",
        "open(bay1)",
      ],
      optimal: "qaxjq4@a",
      helper:
        "Macros can encode a multi-line pattern and replay it over repeating groups rather than single lines.",
      hints: [
        "One repetition should repair two adjacent lines and land on the next pair.",
        "Record deleting a trailing x, descending to delete the next, then descending again; replay twice.",
      ],
      scene: {
        tiles: ["...", ".B.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "door", name: "bay1", tile: "B", open: false }],
        objective: {
          text: "RELAY-0 completes the automated bay cycle.",
          conditions: [{ device: { name: "bay1", is: "open" } }],
        },
      },
    },
  }),
  ...defineConceptPuzzles("substitute", {
    introductory: {
      title: "Local Replacement",
      start: ["set(core, 9)"],
      target: ["set(core, 2)"],
      optimal: ":s/9/2/<CR>",
      helper:
        ":s/pattern/replacement/ substitutes the first match on the current line.",
      hints: ["Replace 9 with 2 on this line.", "Use :s/9/2/<CR>."],
      scene: routeScene(
        robot,
        2,
        "RELAY-0 applies the local route replacement.",
      ),
    },
    integration: {
      title: "Global Bay Rename",
      start: ["open(bay9)", "move(2)", "close(bay9)"],
      target: ["open(bay2)", "move(2)", "close(bay2)"],
      optimal: ":%s/bay9/bay2/g<CR>",
      helper: "% ranges over every line and the g flag replaces every match.",
      hints: [
        "The wrong bay name appears twice on separate lines.",
        "Use :%s/bay9/bay2/g<CR>.",
      ],
      scene: routeScene(robot, 2, "RELAY-0 renames both bay references."),
    },
    advanced: {
      title: "Scoped Signal Rewrite",
      start: [
        "set(core, 9) # old",
        'say("core 9")',
        "set(core, 9) # old",
        'say("done")',
      ],
      target: [
        "set(core, 2) # old",
        'say("core 9")',
        "set(core, 2) # old",
        'say("done")',
      ],
      optimal: ":g/^set/s/9/2/<CR>",
      helper:
        "A whole-program substitute can update related numeric references across code and messages while preserving context.",
      hints: [
        "Every 9 in the program belongs to the same stale signal value.",
        "Use a percent-range substitution from 9 to 2 with the g flag.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [{ kind: "device", name: "core", value: 0, min: 0, max: 2 }],
        objective: {
          text: "RELAY-0 rewrites and reports the core signal.",
          conditions: [
            { device: { name: "core", is: 2 } },
            { said: "core 2" },
            { said: "done" },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("global", {
    introductory: {
      title: "Delete Debug Lines",
      start: ["# debug", "move(2)", "# trace"],
      target: ["move(2)"],
      optimal: ":g/^#/d<CR>",
      helper: ":g/pattern/command runs an Ex command on every matching line.",
      hints: ["Both unwanted lines begin with #.", "Use :g/^#/d<CR>."],
      scene: routeScene(robot, 2, "RELAY-0 removes all debug records."),
    },
    integration: {
      title: "Keep Executable Lines",
      start: [
        "# boot",
        "open(bay1)",
        "# transit",
        "move(2)",
        "# seal",
        "close(bay1)",
      ],
      target: ["open(bay1)", "move(2)", "close(bay1)"],
      optimal: ":v/^[a-z]/d<CR>",
      helper:
        ":v selects lines that do not match, allowing inverse filtering with an earlier Ex delete.",
      hints: [
        "Every executable line starts with a lowercase letter; comments do not.",
        "Use :v/^[a-z]/d<CR>.",
      ],
      scene: routeScene(
        robot,
        2,
        "RELAY-0 keeps only executable bay commands.",
      ),
    },
    advanced: {
      title: "Targeted Fleet Rewrite",
      start: [
        "set(core, 9)",
        "set(aux, 9)",
        'say("core 9")',
        "set(core, 9)",
        'say("ready")',
      ],
      target: [
        "set(core, 2)",
        "set(aux, 9)",
        'say("core 9")',
        "set(core, 2)",
        'say("ready")',
      ],
      optimal: ":g/core,/s/9/2/<CR>",
      helper:
        ":g can run a substitute only on matching lines, preserving unrelated values and messages.",
      hints: [
        "Only lines containing core as code should change; the core message also matches, so its 9 would change too.",
        "Use a more specific global pattern matching set(core before applying s/9/2/.",
      ],
      scene: {
        tiles: ["...", ".P.", "..."],
        robotStart: { x: 1, y: 1, facing: "E" },
        entities: [
          { kind: "device", name: "core", value: 0, min: 0, max: 2 },
          { kind: "device", name: "aux", value: 0, min: 0, max: 9 },
        ],
        objective: {
          text: "RELAY-0 updates only the core relays.",
          conditions: [
            { device: { name: "core", is: 2 } },
            { device: { name: "aux", is: 9 } },
            { said: "core 9" },
            { said: "ready" },
          ],
        },
      },
    },
  }),
  ...defineConceptPuzzles("ex-lines", {
    introductory: {
      title: "Delete by Address",
      start: ["# obsolete", "move(2)"],
      target: ["move(2)"],
      optimal: ":1d<CR>",
      helper: ":{line}d deletes a line by its address.",
      hints: ["The obsolete line is line one.", "Use :1d<CR>."],
      scene: routeScene(robot, 2, "RELAY-0 deletes the addressed record."),
    },
    integration: {
      title: "Move Shutdown Last",
      start: ["close(bay1)", "open(bay1)", "move(2)"],
      target: ["open(bay1)", "move(2)", "close(bay1)"],
      optimal: ":1m$<CR>",
      helper:
        ":m moves an addressed line to a destination while preserving its text.",
      hints: [
        "The close command belongs after every other line.",
        "Use :1m$<CR>.",
      ],
      scene: routeScene(robot, 2, "RELAY-0 reorders the bay shutdown."),
    },
    advanced: {
      title: "Assemble the Final Program",
      start: ['say("ready")', "move(2)", "open(bay1)", "close(bay1)"],
      target: ["open(bay1)", "move(2)", "close(bay1)", 'say("ready")'],
      optimal: ":3m0<CR>:1m$<CR>",
      helper:
        "Compose addressed line moves to reorder a multiline program without retyping any instruction.",
      hints: [
        "Move the open command to the top, then move the displaced ready message to the bottom.",
        "Use :3m0<CR>, followed by :1m$<CR>.",
      ],
      scene: routeScene(
        robot,
        2,
        "RELAY-0 assembles the final command sequence.",
      ),
    },
  }),
];
