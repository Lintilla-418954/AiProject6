import { chapters } from "./chapters.ts";
import { concepts } from "./curriculum.ts";
import {
  definePuzzle,
  type PuzzleDef,
  type Role,
  type SceneSpec,
} from "./types.ts";

interface Template {
  start: string[];
  cursor?: { line: number; col: number };
  target: string[];
  optimal: string;
}

const templates: Record<string, Template> = {
  "grid-moves": {
    start: ["movex(1)"],
    cursor: { line: 0, col: 4 },
    target: ["move(1)"],
    optimal: "x",
  },
  "word-hops": { start: ["move(1)junk"], target: ["move(1)"], optimal: "7l4x" },
  "line-ends": { start: ["move(1)x"], target: ["move(1)"], optimal: "$x" },
  "program-ends": {
    start: ["# diagnostic", "move(1)x"],
    target: ["# diagnostic", "move(1)"],
    optimal: "G$x",
  },
  "character-seek": {
    start: ["move(X)"],
    target: ["move(1)"],
    optimal: "fXr1",
  },
  "bracket-jump": {
    start: ["move(1))"],
    cursor: { line: 0, col: 4 },
    target: ["move(1)"],
    optimal: "%lx",
  },
  overwrite: {
    start: ["move(9)"],
    cursor: { line: 0, col: 5 },
    target: ["move(1)"],
    optimal: "r1",
  },
  insert: {
    start: ["move()"],
    cursor: { line: 0, col: 5 },
    target: ["move(1)"],
    optimal: "i1<Esc>",
  },
  "open-line": {
    start: ["# restored route"],
    target: ["# restored route", "move(1)"],
    optimal: "omove(1)<Esc>",
  },
  "line-delete-join": {
    start: ["bad()", "move(1)"],
    target: ["move(1)"],
    optimal: "dd",
  },
  "undo-redo": { start: ["move(1)x"], target: ["move(1)"], optimal: "$x" },
  "change-line": {
    start: ["wait(9)"],
    target: ["move(1)"],
    optimal: "ccmove(1)<Esc>",
  },
  "yank-put": {
    start: ["move(1)", "# replace"],
    target: ["move(1)", "move(1)"],
    optimal: "yyjp",
  },
  counts: { start: ["xxxmove(1)"], target: ["move(1)"], optimal: "3x" },
  "delete-motion": {
    start: ["junk move(1)"],
    target: ["move(1)"],
    optimal: "dw",
  },
  "change-motion": {
    start: ["wait(1)"],
    target: ["move(1)"],
    optimal: "cwmove<Esc>",
  },
  "yank-motion": {
    start: ["move(1)"],
    target: ["move(1)", "move(1)"],
    optimal: "y$o<Esc>P",
  },
  "word-objects": {
    start: ["junk move(1)"],
    target: ["move(1)"],
    optimal: "daw",
  },
  "delimiter-objects": {
    start: ["move(9)"],
    cursor: { line: 0, col: 5 },
    target: ["move(1)"],
    optimal: "ci(1<Esc>",
  },
  "number-tweak": {
    start: ["move(0)"],
    cursor: { line: 0, col: 5 },
    target: ["move(1)"],
    optimal: "<C-a>",
  },
  repeat: {
    start: ["movx(1)", "movx(1)"],
    cursor: { line: 0, col: 3 },
    target: ["move(1)", "move(1)"],
    optimal: "rej0lllre",
  },
  search: {
    start: ["# status", "move(X)"],
    target: ["# status", "move(1)"],
    optimal: "/X<CR>r1",
  },
  "word-search": {
    start: ["move move(1)"],
    cursor: { line: 0, col: 6 },
    target: ["move(1)"],
    optimal: "0dw",
  },
  visual: { start: ["xxmove(1)"], target: ["move(1)"], optimal: "vlx" },
  "visual-block": {
    start: ["xmove(1)", "x# ok"],
    target: ["move(1)", "# ok"],
    optimal: "<C-v>jx",
  },
  indent: {
    start: ["repeat 1 {", "move(1)", "}"],
    cursor: { line: 1, col: 0 },
    target: ["repeat 1 {", "  move(1)", "}"],
    optimal: ">>",
  },
  "named-registers": {
    start: ["move(1)", "# replace"],
    target: ["move(1)", "move(1)"],
    optimal: '"ayyj"ap',
  },
  macros: {
    start: ["move(0)", "move(0)"],
    cursor: { line: 0, col: 5 },
    target: ["move(1)", "move(1)"],
    optimal: "qa<C-a>j0f0q@a",
  },
  substitute: {
    start: ["move(9)"],
    target: ["move(1)"],
    optimal: ":s/9/1/<CR>",
  },
  global: {
    start: ["bad()", "move(1)"],
    target: ["move(1)"],
    optimal: ":g/^bad/d<CR>",
  },
  "ex-lines": {
    start: ["bad()", "move(1)"],
    target: ["move(1)"],
    optimal: ":1d<CR>",
  },
};

const advancedIds = new Set(
  concepts.filter((concept) => concept.advanced).map((concept) => concept.id),
);
const represented = new Set([
  "grid-moves:introductory",
  "word-hops:integration",
  "character-seek:advanced",
  "bracket-jump:integration",
  "insert:introductory",
  "line-delete-join:integration",
  "delete-motion:advanced",
  "delimiter-objects:introductory",
  "number-tweak:integration",
  "repeat:introductory",
  "search:integration",
  "visual-block:advanced",
  "indent:introductory",
  "macros:introductory",
  "substitute:integration",
  "global:advanced",
]);

function sceneFor(template: Template, robotName: string): SceneSpec {
  const moves = template.target.filter(
    (line) => line.trim() === "move(1)",
  ).length;
  return {
    tiles: ["........", `.${".".repeat(moves)}P.....`.slice(0, 8), "........"],
    robotStart: { x: 1, y: 1, facing: "E" },
    objective: {
      text: `${robotName} follows the restored route to the pad.`,
      conditions: [{ robotAt: { x: 1 + Math.max(1, moves), y: 1 } }],
    },
  };
}

function generatedPuzzle(conceptId: string, role: Role): PuzzleDef {
  const concept = concepts.find((item) => item.id === conceptId)!;
  const chapter = chapters.find((item) => item.id === concept.chapterId)!;
  const template = templates[conceptId]!;
  const suffix =
    role === "introductory"
      ? "Signal Primer"
      : role === "integration"
        ? "Route Integration"
        : "Deep Diagnostic";
  return definePuzzle({
    id: `${String(concept.order).padStart(2, "0")}-${concept.id}-${role}`,
    title: `${concept.name}: ${suffix}`,
    robotName: chapter.robotName,
    concept: concept.name,
    role,
    start: [...template.start],
    cursor: template.cursor ?? { line: 0, col: 0 },
    target: [...template.target],
    optimal: template.optimal,
    helper: `${concept.name} repairs this corruption. Use the current Toolkit and watch the predicted route update.`,
    hints: [
      `Use ${concept.commands.slice(0, 3).join(", ")} to address the damaged text.`,
      `Begin from the highlighted cursor and work toward ${role === "integration" ? "the earlier motion before the final edit" : "the smallest direct repair"}.`,
    ],
    scene: sceneFor(template, chapter.robotName),
  });
}

export const generatedPuzzles: readonly PuzzleDef[] = concepts.flatMap(
  (concept) => {
    const roles: Role[] = [
      "introductory",
      "integration",
      ...(advancedIds.has(concept.id) ? (["advanced"] as const) : []),
    ];
    return roles
      .filter((role) => !represented.has(`${concept.id}:${role}`))
      .map((role) => generatedPuzzle(concept.id, role));
  },
);

export const generatedTestOuts: readonly PuzzleDef[] = chapters
  .filter((chapter) => chapter.id !== "airlock-network")
  .map((chapter, index) => {
    const distance = index + 2;
    const optimal = `i${distance}<Esc>`;
    return definePuzzle({
      id: `test-out-${chapter.id}`,
      title: `${chapter.name} Full Diagnostic`,
      robotName: chapter.robotName,
      role: "test-out",
      chapter: chapter.id,
      start: ["move()"],
      cursor: { line: 0, col: 5 },
      target: [`move(${distance})`],
      optimal,
      budget: { two: optimal.length + 3, pass: optimal.length + 7 },
      helper: "",
      hints: [],
      scene: {
        tiles: [
          "..........",
          `.${".".repeat(distance - 1)}P${".".repeat(9 - distance)}`,
          "..........",
        ],
        robotStart: { x: 1, y: 1, facing: "E" },
        objective: {
          text: `${chapter.robotName} completes the Chapter diagnostic.`,
          conditions: [{ robotAt: { x: 1 + distance, y: 1 } }],
        },
      },
    });
  });
