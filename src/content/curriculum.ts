import type { Concept } from "./types.ts";

const concept = (
  order: number,
  id: string,
  name: string,
  chapterId: string,
  commands: string[],
  advanced = false,
): Concept => ({
  order,
  id,
  name,
  chapterId,
  commands,
  advanced,
});

export const concepts: readonly Concept[] = [
  concept(1, "grid-moves", "Grid moves", "docking-ring", [
    "h",
    "j",
    "k",
    "l",
    "x",
  ]),
  concept(2, "word-hops", "Word hops", "docking-ring", [
    "w",
    "b",
    "e",
    "W",
    "B",
    "E",
  ]),
  concept(3, "line-ends", "Line ends", "docking-ring", ["0", "^", "$"]),
  concept(4, "program-ends", "Program ends", "docking-ring", [
    "gg",
    "G",
    "{",
    "}",
  ]),
  concept(
    5,
    "character-seek",
    "Character seek",
    "docking-ring",
    ["f", "t", "F", "T", ";", ","],
    true,
  ),
  concept(6, "bracket-jump", "Bracket jump", "docking-ring", ["%"]),
  concept(7, "overwrite", "Overwrite", "fabrication-deck", ["r", "~"]),
  concept(8, "insert", "Insert", "fabrication-deck", [
    "i",
    "a",
    "I",
    "A",
    "<Esc>",
    "<C-[>",
    "<BS>",
  ]),
  concept(9, "open-line", "Open line", "fabrication-deck", ["o", "O"]),
  concept(10, "line-delete-join", "Line delete & join", "fabrication-deck", [
    "dd",
    "D",
    "J",
  ]),
  concept(11, "undo-redo", "Undo and redo", "fabrication-deck", ["u", "<C-r>"]),
  concept(12, "change-line", "Change line", "fabrication-deck", [
    "cc",
    "C",
    "s",
    "S",
  ]),
  concept(13, "yank-put", "Yank and put", "fabrication-deck", ["yy", "p", "P"]),
  concept(14, "counts", "Counts", "airlock-network", ["count"], true),
  concept(
    15,
    "delete-motion",
    "Delete with motion",
    "airlock-network",
    ["d{motion}"],
    true,
  ),
  concept(
    16,
    "change-motion",
    "Change with motion",
    "airlock-network",
    ["c{motion}"],
    true,
  ),
  concept(17, "yank-motion", "Yank with motion", "airlock-network", [
    "y{motion}",
  ]),
  concept(18, "word-objects", "Word objects", "airlock-network", [
    "iw",
    "aw",
    "iW",
    "aW",
  ]),
  concept(
    19,
    "delimiter-objects",
    "Delimiter objects",
    "airlock-network",
    ["i(", "a(", "i{", "a{", "i[", "a[", 'i"', "i'"],
    true,
  ),
  concept(20, "number-tweak", "Number tweak", "airlock-network", [
    "<C-a>",
    "<C-x>",
  ]),
  concept(21, "repeat", "Repeat", "sensor-array", ["."], true),
  concept(
    22,
    "search",
    "Search",
    "sensor-array",
    ["/", "?", "n", "N", "<CR>"],
    true,
  ),
  concept(23, "word-search", "Word search", "sensor-array", ["*", "#"]),
  concept(24, "visual", "Visual", "sensor-array", ["v", "V", "o"]),
  concept(
    25,
    "visual-block",
    "Visual block",
    "sensor-array",
    ["<C-v>", "block-I", "block-A", "block-c"],
    true,
  ),
  concept(26, "indent", "Indent", "sensor-array", [">>", "<<", ">", "<", "="]),
  concept(27, "named-registers", "Named registers", "sensor-array", [
    "register",
  ]),
  concept(28, "macros", "Macros", "command-core", ["q", "@", "@@"], true),
  concept(
    29,
    "substitute",
    "Substitute",
    "command-core",
    [":s", ":%s", "&"],
    true,
  ),
  concept(30, "global", "Global", "command-core", [":g", ":v"], true),
  concept(31, "ex-lines", "Ex line operations", "command-core", [
    ":d",
    ":m",
    ":t",
    ":normal",
  ]),
];

export const conceptById = new Map(concepts.map((item) => [item.id, item]));
export const conceptByName = new Map(concepts.map((item) => [item.name, item]));

export function toolkitFor(conceptId: string): readonly string[] {
  const selected = conceptById.get(conceptId);
  if (!selected) return [];
  return concepts
    .filter((item) => item.order <= selected.order)
    .flatMap((item) => item.commands);
}
