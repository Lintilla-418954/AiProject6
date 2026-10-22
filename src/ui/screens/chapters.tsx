import { Link } from "@tanstack/react-router";
import { useAppSnapshot } from "../../app/store-context.tsx";
import { chapters } from "../../content/chapters.ts";
import {
  parsePuzzleId,
  puzzles,
  puzzlesForChapter,
} from "../../content/index.ts";
import { chapterUnlocked, puzzleUnlocked } from "../../game/progression.ts";

export function ChaptersScreen() {
  const { save } = useAppSnapshot();
  const nextPuzzleId = puzzles.find(
    (puzzle) => puzzleUnlocked(puzzle, save) && !save.puzzleResults[puzzle.id],
  )?.id;

  return (
    <main className="map-screen">
      <header className="screen-header">
        <div className="map-nav">
          <Link to="/" className="back-link">
            ← Home
          </Link>
          <Link to="/settings" className="nav-link">
            Settings
          </Link>
        </div>
        <h1 className="screen-title">Chapters</h1>
      </header>
      <div className="chapter-list grid gap-4">
        {chapters.map((chapter, chapterIndex) => {
          const unlocked = chapterUnlocked(chapter.id, save);
          return (
            <section
              className={`chapter-card${unlocked ? "" : " locked"}`}
              key={chapter.id}
            >
              <div className="chapter-number">
                {String(chapterIndex + 1).padStart(2, "0")}
              </div>
              <div className="chapter-body">
                <p className="chapter-status">
                  {unlocked ? "UPLINK ACTIVE" : "UPLINK LOCKED"}
                </p>
                <h2 className="chapter-title">{chapter.name}</h2>
                <p className="chapter-intro">{chapter.intro}</p>
                <div className="puzzle-grid grid grid-cols-3 gap-2">
                  {puzzlesForChapter(chapter.id).map((puzzle) => {
                    const available = unlocked && puzzleUnlocked(puzzle, save);
                    const result = save.puzzleResults[puzzle.id];
                    const puzzleId = parsePuzzleId(puzzle.id)!;
                    const role =
                      puzzle.role === "test-out"
                        ? "TEST-OUT"
                        : puzzle.role.toUpperCase();
                    const highlighted =
                      puzzle.id === nextPuzzleId || puzzle.role === "test-out";
                    const className = `puzzle-chip${
                      result ? " complete" : highlighted ? " next" : ""
                    }`;
                    return available ? (
                      <Link
                        to="/puzzle/$puzzleId"
                        params={{ puzzleId }}
                        className={className}
                        data-role={role}
                        aria-label={
                          result
                            ? `${puzzle.title}, ${result.bestStars} Stars`
                            : undefined
                        }
                        key={puzzle.id}
                      >
                        {puzzle.title}
                      </Link>
                    ) : (
                      <span
                        className="puzzle-chip disabled"
                        data-role={role}
                        key={puzzle.id}
                      >
                        {puzzle.title}
                      </span>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
