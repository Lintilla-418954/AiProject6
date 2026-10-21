import type { Chapter } from "./types.ts";

export const chapters: readonly Chapter[] = [
  {
    id: "docking-ring",
    name: "Docking Ring",
    region: "Docking Ring",
    robotName: "SCOUT-3",
    conceptIds: [
      "grid-moves",
      "word-hops",
      "line-ends",
      "program-ends",
      "character-seek",
      "bracket-jump",
    ],
    intro: "Trace the storm damage and restore the station's approach lanes.",
  },
  {
    id: "fabrication-deck",
    name: "Fabrication Deck",
    region: "Fabrication Deck",
    robotName: "PATCH-5",
    conceptIds: [
      "overwrite",
      "insert",
      "open-line",
      "line-delete-join",
      "undo-redo",
      "change-line",
      "yank-put",
    ],
    intro: "Repair the Programs controlling fabrication and cargo handling.",
  },
  {
    id: "airlock-network",
    name: "Airlock Network",
    region: "Airlock Network",
    robotName: "HAULER-7",
    conceptIds: [
      "counts",
      "delete-motion",
      "change-motion",
      "yank-motion",
      "word-objects",
      "delimiter-objects",
      "number-tweak",
    ],
    intro: "Recover environmental routing without venting the station.",
  },
  {
    id: "sensor-array",
    name: "Sensor Array",
    region: "Sensor Array",
    robotName: "TRACE-4",
    conceptIds: [
      "repeat",
      "search",
      "word-search",
      "visual",
      "visual-block",
      "indent",
      "named-registers",
    ],
    intro:
      "Reconnect the station's repeated, selected, and registered signals.",
  },
  {
    id: "command-core",
    name: "Command Core",
    region: "Command Core",
    robotName: "RELAY-0",
    conceptIds: ["macros", "substitute", "global", "ex-lines"],
    intro: "Automate the final repairs and bring the station back online.",
  },
];

export const chapterById = new Map(
  chapters.map((chapter) => [chapter.id, chapter]),
);
