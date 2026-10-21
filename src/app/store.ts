import { AudioController } from "../audio/audio.ts";
import type { PuzzleDef } from "../content/types.ts";
import { createSession, type PuzzleSession } from "../game/session.ts";
import {
  recordSolve,
  SaveRepository,
  type SaveV1,
} from "../game/persistence.ts";

export interface AppStore {
  save: SaveV1;
  repository: SaveRepository;
  audio: AudioController;
  session: PuzzleSession | null;
  openPuzzle: (puzzle: PuzzleDef) => PuzzleSession;
  updateSession: (session: PuzzleSession) => void;
  updateSave: (save: SaveV1) => void;
  commitSolve: () => void;
}

export function createStore(): AppStore {
  const repository = new SaveRepository();
  const save = repository.load();
  const store: AppStore = {
    save,
    repository,
    audio: new AudioController(save.settings),
    session: null,
    openPuzzle(puzzle) {
      const session = createSession(puzzle);
      store.session = session;
      store.updateSave({ ...store.save, lastPuzzleId: puzzle.id });
      return session;
    },
    updateSession(session) {
      store.session = session;
    },
    updateSave(next) {
      store.save = next;
      store.repository.save(next);
      store.audio.update(next.settings);
    },
    commitSolve() {
      const session = store.session;
      if (!session?.solved || !session.stars) return;
      const next = recordSolve(
        store.save,
        session.puzzle.id,
        session.keystrokes,
        session.stars,
        session.hintCount > 0,
        session.puzzle.role === "test-out" ? session.puzzle.chapter : undefined,
      );
      store.updateSave(next);
    },
  };
  return store;
}
