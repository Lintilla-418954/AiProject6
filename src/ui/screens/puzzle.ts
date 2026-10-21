import type { AppStore } from "../../app/store.ts";
import type { PuzzleDef } from "../../content/types.ts";
import { budgetFor } from "../../game/scoring.ts";
import { bindInput, type InputResult } from "../../game/input-adapter.ts";
import {
  createSession,
  revealHint,
  sendToken,
  withNudge,
  type PuzzleSession,
} from "../../game/session.ts";
import { renderScene } from "../../scene/renderer.ts";
import { button, el, replace, routeLink } from "../dom.ts";

let releaseInput: (() => void) | null = null;
let animation: number | null = null;

export function renderPuzzle(
  root: HTMLElement,
  store: AppStore,
  puzzle: PuzzleDef,
): void {
  releaseInput?.();
  if (animation !== null) window.clearInterval(animation);
  let session =
    store.session?.puzzle.id === puzzle.id
      ? store.session
      : store.openPuzzle(puzzle);
  const draw = (animateSolve = false) => {
    store.updateSession(session);
    const page = buildPage(
      session,
      () => {
        session = revealHint(session);
        store.audio.play("hint");
        draw();
      },
      () => {
        session = createSession(puzzle);
        draw();
      },
    );
    replace(root, page);
    const canvas = page.querySelector("canvas")!;
    renderScene(canvas, puzzle.scene, session.simulation);
    const capture = document.getElementById(
      "key-capture",
    ) as HTMLTextAreaElement;
    releaseInput?.();
    releaseInput = bindInput({ capture, onInput: handleInput });
    capture.focus({ preventScroll: true });
    if (animateSolve) playSolve(canvas);
  };

  const handleInput = (input: InputResult) => {
    if (input.kind === "reset") {
      session = createSession(puzzle);
      draw();
      return;
    }
    if (input.kind === "hint") {
      session = revealHint(session);
      draw();
      return;
    }
    if (input.kind === "blocked") {
      session = withNudge(session, `${input.label} is offline. Use vim!`);
      store.audio.play("blocked");
      draw();
      return;
    }
    if (input.kind !== "token") return;
    const wasSolved = session.solved;
    session = sendToken(session, input.token);
    store.audio.play(session.bell ? "bell" : "key");
    if (!wasSolved && session.solved) {
      store.updateSession(session);
      store.commitSolve();
      store.audio.play("solve");
      draw(true);
    } else draw();
  };

  const playSolve = (canvas: HTMLCanvasElement) => {
    let frame = 0;
    const reduced =
      store.save.settings.reducedMotion === true ||
      (store.save.settings.reducedMotion === "system" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced) {
      renderScene(
        canvas,
        puzzle.scene,
        session.simulation,
        session.simulation.frames.length - 1,
      );
      return;
    }
    animation = window.setInterval(() => {
      renderScene(canvas, puzzle.scene, session.simulation, frame++);
      if (frame >= session.simulation.frames.length) {
        if (animation !== null) window.clearInterval(animation);
        animation = null;
      }
    }, 220);
  };

  draw();
}

function buildPage(
  session: PuzzleSession,
  onHint: () => void,
  onReset: () => void,
): HTMLElement {
  const { puzzle } = session;
  const page = el("main", "puzzle-screen");
  const topbar = el("nav", "puzzle-nav");
  topbar.append(
    routeLink("← Chapter map", "/chapters", "back-link"),
    el("span", "puzzle-role", puzzle.role.replace("-", " ").toUpperCase()),
    routeLink("Settings", "/settings", "nav-link"),
  );

  const sceneArea = el("section", "scene-layout");
  const sceneColumn = el("div", "scene-column");
  const canvas = el("canvas", "scene-canvas");
  canvas.setAttribute(
    "aria-label",
    `Scene for ${puzzle.robotName}: ${puzzle.scene.objective.text}`,
  );
  const caption = el(
    "p",
    `scene-caption${session.simulation.success ? " success" : ""}`,
  );
  caption.setAttribute("aria-live", "polite");
  caption.textContent = sceneCaption(session);
  sceneColumn.append(canvas, caption);
  const brief = el("aside", "brief-panel");
  brief.append(
    el("p", "eyebrow", `${puzzle.robotName} // ${puzzle.title}`),
    el("h1", "objective-title", puzzle.scene.objective.text),
  );
  if (puzzle.helper) brief.append(el("div", "helper-text", puzzle.helper));
  if (puzzle.role !== "test-out" && session.hintCount < puzzle.hints.length)
    brief.append(
      button(
        session.hintCount ? "Request second Hint" : "Request Hint · max ★★",
        onHint,
        "hint-action",
      ),
    );
  for (let index = 0; index < session.hintCount; index++)
    brief.append(
      el("p", "hint-text", `HINT ${index + 1}: ${puzzle.hints[index]}`),
    );
  if (session.nudge) brief.append(el("p", "nudge", session.nudge));
  sceneArea.append(sceneColumn, brief);

  const console = el("section", "uplink-console");
  console.append(
    el("div", "console-title", `UPLINK ▸ ${puzzle.robotName}.prog`),
    renderBuffer(session),
    renderStatus(session),
  );
  if (session.locked) {
    const locked = el(
      "div",
      "lock-message",
      "OUT OF KEYSTROKES — uplink lost.",
    );
    locked.setAttribute("role", "alert");
    locked.append(button("Reconnect · F2", onReset));
    console.append(locked);
  }
  if (session.solved && session.stars) {
    const completion = el("div", "completion-card");
    completion.setAttribute("aria-live", "assertive");
    completion.append(
      el("p", "eyebrow", "PROGRAM VERIFIED"),
      el(
        "h2",
        "completion-title",
        `${"★".repeat(session.stars)}${"☆".repeat(3 - session.stars)} Repair complete`,
      ),
      el("p", undefined, `${session.keystrokes} keystrokes · Optimal Solution`),
      el("code", "optimal-code", puzzle.optimal),
      routeLink("Return to Chapter map", "/chapters", "primary-action"),
    );
    console.append(completion);
  }
  page.append(topbar, sceneArea, console);
  return page;
}

function renderBuffer(session: PuzzleSession): HTMLElement {
  const container = el("div", "vim-buffer");
  container.setAttribute("role", "textbox");
  container.setAttribute("aria-label", "Robot Program Vim buffer");
  session.vim.lines.forEach((line, lineIndex) => {
    const row = el("div", "buffer-line");
    row.append(el("span", "line-number", String(lineIndex + 1)));
    const content = el("span", "line-content");
    const display = line.length ? [...line] : [" "];
    display.forEach((char, colIndex) => {
      const cell = el("span", "buffer-cell", char === " " ? " " : char);
      if (
        lineIndex === session.vim.cursor.line &&
        colIndex === session.vim.cursor.col
      )
        cell.classList.add(
          "cursor",
          session.vim.mode === "insert" ? "insert-cursor" : "normal-cursor",
        );
      content.append(cell);
    });
    if (
      session.vim.mode === "insert" &&
      lineIndex === session.vim.cursor.line &&
      session.vim.cursor.col >= line.length
    )
      content.append(el("span", "buffer-cell cursor insert-cursor", " "));
    row.append(content);
    container.append(row);
  });
  if (session.vim.mode === "command")
    container.append(
      el(
        "div",
        "command-line",
        `${session.vim.message}${session.vim.commandLine}`,
      ),
    );
  return container;
}

function renderStatus(session: PuzzleSession): HTMLElement {
  const budget = budgetFor(session.puzzle);
  const status = el("div", "vim-status");
  const mode = el(
    "span",
    "mode-label",
    `-- ${session.vim.mode.toUpperCase()} --`,
  );
  const pending = el("span", "pending-keys", session.vim.pending.join(""));
  const keys = el(
    "span",
    "key-count",
    `${session.keystrokes} / ${budget.pass} keys`,
  );
  const stars =
    session.keystrokes <= budget.three
      ? "★★★"
      : session.keystrokes <= budget.two
        ? "★★☆"
        : "★☆☆";
  const starLabel = el("span", "star-label", stars);
  const meter = el("div", "budget-meter");
  const fill = el("span", "budget-fill");
  fill.style.width = `${Math.min(100, (session.keystrokes / budget.pass) * 100)}%`;
  meter.append(
    fill,
    marker(budget.three, budget.pass),
    marker(budget.two, budget.pass),
  );
  status.append(mode, pending, keys, starLabel, meter);
  return status;
}

function marker(value: number, pass: number): HTMLElement {
  const element = el("i", "budget-marker");
  element.style.left = `${(value / pass) * 100}%`;
  return element;
}

function sceneCaption(session: PuzzleSession): string {
  if (session.solved) return "EXECUTING: exact repair accepted";
  if (session.simulation.success)
    return "Works, but Ops expects the original repair.";
  return `PREDICTED: ${session.puzzle.robotName} ${session.simulation.failure?.caption ?? "halts"}`;
}
