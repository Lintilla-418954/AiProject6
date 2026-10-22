import { Link } from "@tanstack/react-router";
import { useAppSnapshot } from "../../app/store-context.tsx";
import { chapters } from "../../content/chapters.ts";
import { parsePuzzleId, puzzlesForChapter } from "../../content/index.ts";
import { chapterUnlocked, puzzleUnlocked } from "../../game/progression.ts";

export function ChaptersScreen() {
  const { save } = useAppSnapshot();

  return (
    <main className="map-screen">
      <header className="screen-header">
        <Link to="/" className="back-link">
          ← Station
        </Link>
        <p className="eyebrow">STATION MAP</p>
        <h1 className="screen-title">Repair route</h1>
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
                  {unlocked ? chapter.region : "UPLINK LOCKED"}
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
                    const className = `puzzle-chip${result ? " complete" : ""}`;
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
