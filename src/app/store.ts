import { AudioController } from "../audio/audio.ts";
import type { PuzzleDef } from "../content/types.ts";
import { createSession, type PuzzleSession } from "../game/session.ts";
import {
  recordSolve,
  SaveRepository,
  type SaveV1,
} from "../game/persistence.ts";

export interface AppSnapshot {
  save: SaveV1;
  session: PuzzleSession | null;
}

export interface AppStore {
  readonly repository: SaveRepository;
  readonly audio: AudioController;
  getSnapshot: () => AppSnapshot;
  subscribe: (listener: () => void) => () => void;
  openPuzzle: (puzzle: PuzzleDef) => PuzzleSession;
  updateSession: (session: PuzzleSession) => void;
  updateSave: (save: SaveV1) => void;
  commitSolve: () => void;
  reset: () => void;
  reloadFromRepository: () => void;
}

export function createStore(): AppStore {
  const repository = new SaveRepository();
  const initialSave = repository.load();
  let snapshot: AppSnapshot = { save: initialSave, session: null };
  const listeners = new Set<() => void>();

  const publish = (next: AppSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const persistSave = (save: SaveV1) => {
    repository.save(save);
    store.audio.update(save.settings);
    publish({ ...snapshot, save });
  };

  const store: AppStore = {
    repository,
    audio: new AudioController(initialSave.settings),
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    openPuzzle(puzzle) {
      if (snapshot.session?.puzzle.id === puzzle.id) return snapshot.session;
      const session = createSession(puzzle);
      const save = { ...snapshot.save, lastPuzzleId: puzzle.id };
      repository.save(save);
      publish({ save, session });
      return session;
    },
    updateSession(session) {
      publish({ ...snapshot, session });
    },
    updateSave(save) {
      persistSave(save);
    },
    commitSolve() {
      const { save, session } = snapshot;
      if (!session?.solved || !session.stars) return;
      persistSave(
        recordSolve(
          save,
          session.puzzle.id,
          session.keystrokes,
          session.stars,
          session.hintCount > 0,
          session.puzzle.role === "test-out"
            ? session.puzzle.chapter
            : undefined,
        ),
      );
    },
    reset() {
      const save = repository.clear();
      store.audio.update(save.settings);
      publish({ save, session: null });
    },
    reloadFromRepository() {
      const save = repository.load();
      store.audio.update(save.settings);
      publish({ ...snapshot, save });
    },
  };

  return store;
}
