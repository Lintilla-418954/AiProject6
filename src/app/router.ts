import type { AppStore } from "./store.ts";
import { puzzleById } from "../content/index.ts";
import { el, replace } from "../ui/dom.ts";
import { renderChapters } from "../ui/screens/chapters.ts";
import { renderHome } from "../ui/screens/home.ts";
import { renderPuzzle } from "../ui/screens/puzzle.ts";
import { renderSettings } from "../ui/screens/settings.ts";

export function createRouter(root: HTMLElement, store: AppStore): () => void {
  const render = () => {
    const path = location.hash.slice(1) || "/";
    if (path === "/") renderHome(root, store);
    else if (path === "/chapters") renderChapters(root, store);
    else if (path === "/settings") renderSettings(root, store);
    else if (path.startsWith("/puzzle/")) {
      const puzzle = puzzleById.get(
        decodeURIComponent(path.slice("/puzzle/".length)),
      );
      if (puzzle) renderPuzzle(root, store, puzzle);
      else notFound(root);
    } else notFound(root);
  };
  window.addEventListener("hashchange", render);
  render();
  return render;
}

function notFound(root: HTMLElement): void {
  const page = el("main", "not-found");
  page.append(
    el("p", "eyebrow", "UPLINK LOST"),
    el("h1", undefined, "Route not found"),
  );
  const link = el("a", "primary-action", "Return to station");
  link.href = "#/";
  page.append(link);
  replace(root, page);
}
