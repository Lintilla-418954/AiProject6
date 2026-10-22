import { Link } from "@tanstack/react-router";
import { useAppSnapshot } from "../../app/store-context.tsx";
import {
  parsePuzzleId,
  puzzleById,
  type PuzzleId,
} from "../../content/index.ts";

interface HomeActionsProps {
  continuePuzzleId: PuzzleId | null;
}

export function HomeScreen() {
  const { save } = useAppSnapshot();
  const continuePuzzleId = save.lastPuzzleId
    ? parsePuzzleId(save.lastPuzzleId)
    : null;
  const continuePuzzle = continuePuzzleId
    ? puzzleById.get(continuePuzzleId)
    : undefined;

  return (
    <main className="home-screen">
      <header className="home-header">
        <a className="home-wordmark" href="#home-title">
          <span>VIM</span> STATION
        </a>
        <span className="home-status">
          <i /> UPLINK READY
        </span>
      </header>

      <div className="home-grid">
        <section className="home-intro">
          <p className="eyebrow">REMOTE OPERATIONS // TRAINING CHANNEL</p>
          <h1 id="home-title">Repair the station. Learn Vim for real.</h1>
          <p className="home-copy">
            Restore corrupted Robot Programs with real Vim commands. Every key
            redraws the Robot&apos;s route through the station.
          </p>
          <HomeActions
            continuePuzzleId={continuePuzzle ? continuePuzzleId : null}
          />
          <dl className="home-readouts">
            <div>
              <dt>Concepts</dt>
              <dd>31</dd>
            </div>
            <div>
              <dt>Puzzles</dt>
              <dd>78</dd>
            </div>
            <div>
              <dt>Feedback</dt>
              <dd>Live</dd>
            </div>
          </dl>
        </section>

        <section className="home-console" aria-label="Robot Program preview">
          <div className="home-console-bar">
            <span>UPLINK ▸ PATCH-5.prog</span>
            <span>NORMAL</span>
          </div>
          <div className="home-program">
            <ol>
              <li>
                <code>robot PATCH-5</code>
              </li>
              <li>
                <code>move east 3</code>
              </li>
              <li className="home-corrupt">
                <code>open AIRLOCK_</code>
                <span>FAULT</span>
              </li>
              <li>
                <code>collect CELL</code>
              </li>
            </ol>
          </div>
          <div className="home-scene" aria-hidden="true">
            <div className="home-route route-one" />
            <div className="home-route route-two" />
            <span className="home-beacon beacon-one">+</span>
            <span className="home-beacon beacon-two">◆</span>
            <div className="home-robot">
              <span>▴</span>
            </div>
            <span className="home-sector-label">MAINTENANCE DECK 04</span>
          </div>
          <div className="home-console-footer">
            <span>GHOST ROUTE: 08 TICKS</span>
            <span>OBJECTIVE PENDING</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function HomeActions({ continuePuzzleId }: HomeActionsProps) {
  return (
    <div className="home-actions">
      {continuePuzzleId ? (
        <Link
          to="/puzzle/$puzzleId"
          params={{ puzzleId: continuePuzzleId }}
          className="primary-action"
        >
          Continue Uplink <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <Link to="/chapters" className="primary-action">
          Begin repairs <span aria-hidden="true">→</span>
        </Link>
      )}
      <Link to="/chapters" className="secondary-action">
        Open Chapter Menu
      </Link>
    </div>
  );
}
