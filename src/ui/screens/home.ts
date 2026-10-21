import { puzzleById } from "../../content/index.ts";
import type { AppStore } from "../../app/store.ts";
import { el, replace, routeLink } from "../dom.ts";

export function renderHome(root: HTMLElement, store: AppStore): void {
  const page = el("main", "home-screen");
  const eyebrow = el("p", "eyebrow", "REMOTE OPERATIONS // VIM STATION");
  const title = el(
    "h1",
    "hero-title",
    "Repair the station. Learn Vim for real.",
  );
  const intro = el(
    "p",
    "hero-copy",
    "An ion storm corrupted every Robot Program. Restore the exact code with Vim keys and watch each repair change the Robot's predicted route.",
  );
  const actions = el("div", "hero-actions");
  const continuePuzzle = store.save.lastPuzzleId
    ? puzzleById.get(store.save.lastPuzzleId)
    : undefined;
  if (continuePuzzle)
    actions.append(
      routeLink(
        "Continue uplink",
        `/puzzle/${continuePuzzle.id}`,
        "primary-action",
      ),
    );
  actions.append(
    routeLink(
      "Open Chapter map",
      "/chapters",
      continuePuzzle ? "secondary-action" : "primary-action",
    ),
  );
  const features = el("div", "feature-grid");
  for (const [number, heading, copy] of [
    ["31", "Vim Concepts", "From h j k l through macros and Ex operations."],
    [
      "78",
      "Authored Puzzles",
      "Introductory, Integration, Advanced, and Test-Out repairs.",
    ],
    [
      "LIVE",
      "Scene prediction",
      "Every key redraws the Robot's ghost path through the station.",
    ],
  ]) {
    const card = el("section", "feature-card");
    card.append(
      el("strong", "feature-number", number),
      el("h2", "feature-heading", heading),
      el("p", "feature-copy", copy),
    );
    features.append(card);
  }
  page.append(eyebrow, title, intro, actions, features);
  replace(root, page);
}
