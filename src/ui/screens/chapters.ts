import type { AppStore } from "../../app/store.ts";
import { chapters } from "../../content/chapters.ts";
import { puzzlesForChapter } from "../../content/index.ts";
import { chapterUnlocked, puzzleUnlocked } from "../../game/progression.ts";
import { el, replace, routeLink } from "../dom.ts";

export function renderChapters(root: HTMLElement, store: AppStore): void {
  const page = el("main", "map-screen");
  const header = el("header", "screen-header");
  header.append(
    routeLink("← Station", "/", "back-link"),
    el("p", "eyebrow", "STATION MAP"),
    el("h1", "screen-title", "Repair route"),
  );
  const list = el("div", "chapter-list");
  chapters.forEach((chapter, chapterIndex) => {
    const unlocked = chapterUnlocked(chapter.id, store.save);
    const card = el("section", `chapter-card${unlocked ? "" : " locked"}`);
    const number = el(
      "div",
      "chapter-number",
      String(chapterIndex + 1).padStart(2, "0"),
    );
    const body = el("div", "chapter-body");
    body.append(
      el("p", "chapter-status", unlocked ? chapter.region : "UPLINK LOCKED"),
      el("h2", "chapter-title", chapter.name),
      el("p", "chapter-intro", chapter.intro),
    );
    const puzzleGrid = el("div", "puzzle-grid");
    for (const puzzle of puzzlesForChapter(chapter.id)) {
      const available = unlocked && puzzleUnlocked(puzzle, store.save);
      const result = store.save.puzzleResults[puzzle.id];
      const item = available
        ? routeLink(
            puzzle.title,
            `/puzzle/${puzzle.id}`,
            `puzzle-chip${result ? " complete" : ""}`,
          )
        : el("span", "puzzle-chip disabled", puzzle.title);
      const role =
        puzzle.role === "test-out" ? "TEST-OUT" : puzzle.role.toUpperCase();
      item.setAttribute("data-role", role);
      if (result)
        item.setAttribute(
          "aria-label",
          `${puzzle.title}, ${result.bestStars} Stars`,
        );
      puzzleGrid.append(item);
    }
    body.append(puzzleGrid);
    card.append(number, body);
    list.append(card);
  });
  page.append(header, list);
  replace(root, page);
}
