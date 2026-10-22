import { Link } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useAppSnapshot, useAppStore } from "../../app/store-context.tsx";
import { parsePuzzleId } from "../../content/index.ts";
import type { PuzzleDef } from "../../content/types.ts";
import { bindInput, type InputResult } from "../../game/input-adapter.ts";
import { nextPuzzle } from "../../game/progression.ts";
import { budgetFor } from "../../game/scoring.ts";
import {
  createSession,
  revealHint,
  sendToken,
  withNudge,
  type PuzzleSession,
} from "../../game/session.ts";
import { renderScene } from "../../scene/renderer.ts";

export function PuzzleScreen({ puzzle }: { puzzle: PuzzleDef }) {
  const store = useAppStore();
  const { save, session: activeSession } = useAppSnapshot();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const handlerRef = useRef<(input: InputResult) => void>(() => undefined);
  const [animationNonce, setAnimationNonce] = useState(0);
  const session = activeSession?.puzzle.id === puzzle.id ? activeSession : null;
  const followingPuzzle = session?.solved ? nextPuzzle(puzzle, save) : null;
  const followingPuzzleId = followingPuzzle
    ? parsePuzzleId(followingPuzzle.id)
    : null;

  useLayoutEffect(() => {
    store.openPuzzle(puzzle);
  }, [puzzle, store]);

  useLayoutEffect(() => {
    if (!session || !canvasRef.current) return;
    renderScene(canvasRef.current, puzzle.scene, session.simulation);
  }, [puzzle, session]);

  useEffect(() => {
    if (!session) return;
    const capture = document.getElementById(
      "key-capture",
    ) as HTMLTextAreaElement;
    capture.focus({ preventScroll: true });
  }, [session]);

  const handleInput = useCallback(
    (input: InputResult) => {
      const current = store.getSnapshot().session;
      if (!current || current.puzzle.id !== puzzle.id) return;

      if (input.kind === "reset") {
        store.updateSession(createSession(puzzle));
        return;
      }
      if (input.kind === "hint") {
        store.updateSession(revealHint(current));
        return;
      }
      if (input.kind === "blocked") {
        store.updateSession(
          withNudge(current, `${input.label} is offline. Use vim!`),
        );
        store.audio.play("blocked");
        return;
      }
      if (input.kind !== "token") return;

      const next = sendToken(current, input.token);
      store.updateSession(next);
      store.audio.play(next.bell ? "bell" : "key");
      if (!current.solved && next.solved) {
        store.commitSolve();
        store.audio.play("solve");
        setAnimationNonce((value) => value + 1);
      }
    },
    [puzzle, store],
  );

  handlerRef.current = handleInput;

  useEffect(() => {
    const capture = document.getElementById(
      "key-capture",
    ) as HTMLTextAreaElement;
    return bindInput({
      capture,
      onInput: (input) => handlerRef.current(input),
    });
  }, [puzzle.id]);

  useEffect(() => {
    if (!animationNonce || !canvasRef.current) return;
    const solvedSession = store.getSnapshot().session;
    if (!solvedSession?.solved || solvedSession.puzzle.id !== puzzle.id) return;
    const canvas = canvasRef.current;
    const reduced =
      save.settings.reducedMotion === true ||
      (save.settings.reducedMotion === "system" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced) {
      renderScene(
        canvas,
        puzzle.scene,
        solvedSession.simulation,
        solvedSession.simulation.frames.length - 1,
      );
      return;
    }

    let frame = 0;
    animationRef.current = window.setInterval(() => {
      renderScene(canvas, puzzle.scene, solvedSession.simulation, frame++);
      if (frame >= solvedSession.simulation.frames.length) {
        if (animationRef.current !== null) {
          window.clearInterval(animationRef.current);
          animationRef.current = null;
        }
      }
    }, 220);
    return () => {
      if (animationRef.current !== null) {
        window.clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [animationNonce, puzzle, save.settings.reducedMotion, store]);

  if (!session) return null;

  const requestHint = () => {
    const current = store.getSnapshot().session;
    if (!current || current.puzzle.id !== puzzle.id) return;
    store.updateSession(revealHint(current));
    store.audio.play("hint");
  };

  return (
    <main className="puzzle-screen">
      <nav className="puzzle-nav grid grid-cols-[1fr_auto_1fr] items-center">
        <Link to="/chapters" className="back-link">
          ← Chapters
        </Link>
        <span className="puzzle-role">
          {puzzle.role.replace("-", " ").toUpperCase()}
        </span>
        <span aria-hidden="true" />
      </nav>
      <section className="scene-layout grid items-stretch gap-6">
        <div className="scene-column grid place-items-center">
          <canvas
            ref={canvasRef}
            className="scene-canvas max-w-full"
            aria-label={`Scene for ${puzzle.robotName}: ${puzzle.scene.objective.text}`}
          />
          <p
            className={`scene-caption${session.simulation.success ? " success" : ""}`}
            aria-live="polite"
          >
            {sceneCaption(session)}
          </p>
        </div>
        <aside className="brief-panel">
          <p className="eyebrow">
            {puzzle.robotName} // {puzzle.title}
          </p>
          <h1 className="objective-title">{puzzle.scene.objective.text}</h1>
          {puzzle.helper ? (
            <div className="helper-text">{puzzle.helper}</div>
          ) : null}
          {puzzle.role !== "test-out" &&
          session.hintCount < puzzle.hints.length ? (
            <button type="button" className="hint-action" onClick={requestHint}>
              {session.hintCount
                ? "Request second Hint"
                : "Request Hint · max ★★"}
            </button>
          ) : null}
          {puzzle.hints.slice(0, session.hintCount).map((hint, index) => (
            <p className="hint-text" key={hint}>
              HINT {index + 1}: {hint}
            </p>
          ))}
          {session.nudge ? <p className="nudge">{session.nudge}</p> : null}
        </aside>
      </section>
      <section className="uplink-console relative">
        <div className="console-title">UPLINK ▸ {puzzle.robotName}.prog</div>
        <Buffer session={session} />
        <Status session={session} />
        {session.locked ? (
          <div
            className="lock-message flex items-center justify-between"
            role="alert"
          >
            OUT OF KEYSTROKES — uplink lost.
            <button
              type="button"
              onClick={() => store.updateSession(createSession(puzzle))}
            >
              Reconnect · F2
            </button>
          </div>
        ) : null}
        {session.solved && session.stars ? (
          <div
            className="completion-card grid items-center"
            aria-live="assertive"
          >
            <p className="eyebrow">PROGRAM VERIFIED</p>
            <h2 className="completion-title">
              {"★".repeat(session.stars)}
              {"☆".repeat(3 - session.stars)} Repair complete
            </h2>
            <div className="optimal-solution">
              <span>Optimal Solution</span>
              <code className="optimal-code">{puzzle.optimal}</code>
            </div>
            <div className="completion-actions">
              {followingPuzzle && followingPuzzleId ? (
                <Link
                  to="/puzzle/$puzzleId"
                  params={{ puzzleId: followingPuzzleId }}
                  className="primary-action"
                >
                  Next Uplink
                </Link>
              ) : null}
              <Link to="/chapters" className="secondary-action">
                Return to Chapters
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Buffer({ session }: { session: PuzzleSession }) {
  return (
    <div
      className="vim-buffer"
      role="textbox"
      aria-label="Robot Program Vim buffer"
    >
      {session.vim.lines.map((line, lineIndex) => {
        const display = line.length ? [...line] : [" "];
        return (
          <div className="buffer-line flex" key={lineIndex}>
            <span className="line-number">{lineIndex + 1}</span>
            <span className="line-content">
              {display.map((char, colIndex) => {
                const cursor =
                  lineIndex === session.vim.cursor.line &&
                  colIndex === session.vim.cursor.col;
                const cursorClass = cursor
                  ? ` cursor ${session.vim.mode === "insert" ? "insert-cursor" : "normal-cursor"}`
                  : "";
                return (
                  <span className={`buffer-cell${cursorClass}`} key={colIndex}>
                    {char === " " ? " " : char}
                  </span>
                );
              })}
              {session.vim.mode === "insert" &&
              lineIndex === session.vim.cursor.line &&
              session.vim.cursor.col >= line.length ? (
                <span className="buffer-cell cursor insert-cursor"> </span>
              ) : null}
            </span>
          </div>
        );
      })}
      {session.vim.mode === "command" ? (
        <div className="command-line">
          {session.vim.message}
          {session.vim.commandLine}
        </div>
      ) : null}
    </div>
  );
}

function Status({ session }: { session: PuzzleSession }) {
  const budget = budgetFor(session.puzzle);
  const stars =
    session.keystrokes <= budget.three
      ? "★★★"
      : session.keystrokes <= budget.two
        ? "★★☆"
        : "★☆☆";
  const fillStyle = {
    "--meter-position": `${Math.min(100, (session.keystrokes / budget.pass) * 100)}%`,
  } as CSSProperties;

  return (
    <div className="vim-status grid items-center">
      <span className="mode-label">-- {session.vim.mode.toUpperCase()} --</span>
      <span className="pending-keys">{session.vim.pending.join("")}</span>
      <span className="key-count">
        {session.keystrokes} / {budget.pass} keys
      </span>
      <span className="star-label">{stars}</span>
      <div className="budget-meter relative">
        <span className="budget-fill" style={fillStyle} />
        <Marker value={budget.three} pass={budget.pass} />
        <Marker value={budget.two} pass={budget.pass} />
      </div>
    </div>
  );
}

function Marker({ value, pass }: { value: number; pass: number }) {
  const style = {
    "--meter-position": `${(value / pass) * 100}%`,
  } as CSSProperties;
  return <i className="budget-marker" style={style} />;
}

function sceneCaption(session: PuzzleSession): string {
  if (session.solved) return "EXECUTING: exact repair accepted";
  if (session.simulation.success)
    return "Works, but Ops expects the original repair.";
  return `PREDICTED: ${session.puzzle.robotName} ${session.simulation.failure?.caption ?? "halts"}`;
}
