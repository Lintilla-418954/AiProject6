import { Link } from "@tanstack/react-router";
import { parsePuzzleId, puzzleById } from "../../content/index.ts";
import { useAppSnapshot } from "../../app/store-context.tsx";

const features = [
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
] as const;

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
      <p className="eyebrow">REMOTE OPERATIONS // VIM STATION</p>
      <h1 className="hero-title">Repair the station. Learn Vim for real.</h1>
      <p className="hero-copy">
        An ion storm corrupted every Robot Program. Restore the exact code with
        Vim keys and watch each repair change the Robot&apos;s predicted route.
      </p>
      <div className="hero-actions flex gap-3">
        {continuePuzzle ? (
          <Link
            to="/puzzle/$puzzleId"
            params={{ puzzleId: continuePuzzleId! }}
            className="primary-action"
          >
            Continue uplink
          </Link>
        ) : null}
        <Link
          to="/chapters"
          className={continuePuzzle ? "secondary-action" : "primary-action"}
        >
          Open Chapter map
        </Link>
      </div>
      <div className="feature-grid grid grid-cols-3 gap-px">
        {features.map(([number, heading, copy]) => (
          <section className="feature-card" key={heading}>
            <strong className="feature-number">{number}</strong>
            <h2 className="feature-heading">{heading}</h2>
            <p className="feature-copy">{copy}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
