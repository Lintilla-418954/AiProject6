export interface PuzzleResult {
  passedAt: string;
  bestKeystrokes: number;
  bestStars: 1 | 2 | 3;
  solvedWithoutHint: boolean;
}

export interface Settings {
  soundEnabled: boolean;
  soundVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  reducedMotion: boolean | "system";
}

export interface SaveV1 {
  version: 1;
  puzzleResults: Record<string, PuzzleResult>;
  passedTestOuts: string[];
  lastPuzzleId?: string;
  settings: Settings;
}

const KEY = "vim-station.save.v1";
const RECOVERY_KEY = `${KEY}.recovery`;

export const defaultSettings: Settings = {
  soundEnabled: true,
  soundVolume: 0.55,
  musicEnabled: false,
  musicVolume: 0.2,
  reducedMotion: "system",
};

export function freshSave(): SaveV1 {
  return {
    version: 1,
    puzzleResults: {},
    passedTestOuts: [],
    settings: { ...defaultSettings },
  };
}

function validNumber(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

export function parseSave(raw: string): SaveV1 | null {
  try {
    const value = JSON.parse(raw) as Partial<SaveV1>;
    if (
      value.version !== 1 ||
      typeof value.puzzleResults !== "object" ||
      !value.puzzleResults ||
      !Array.isArray(value.passedTestOuts)
    )
      return null;
    const settings = value.settings;
    if (
      !settings ||
      typeof settings.soundEnabled !== "boolean" ||
      !validNumber(settings.soundVolume, 0, 1) ||
      typeof settings.musicEnabled !== "boolean" ||
      !validNumber(settings.musicVolume, 0, 1) ||
      ![true, false, "system"].includes(settings.reducedMotion)
    )
      return null;
    const puzzleResults: Record<string, PuzzleResult> = {};
    for (const [id, result] of Object.entries(value.puzzleResults)) {
      if (
        typeof result === "object" &&
        result &&
        typeof result.passedAt === "string" &&
        validNumber(result.bestKeystrokes, 0, Number.MAX_SAFE_INTEGER) &&
        [1, 2, 3].includes(result.bestStars) &&
        typeof result.solvedWithoutHint === "boolean"
      )
        puzzleResults[id] = result;
    }
    return {
      version: 1,
      puzzleResults,
      passedTestOuts: value.passedTestOuts.filter(
        (id): id is string => typeof id === "string",
      ),
      ...(typeof value.lastPuzzleId === "string"
        ? { lastPuzzleId: value.lastPuzzleId }
        : {}),
      settings,
    };
  } catch {
    return null;
  }
}

export class SaveRepository {
  private memory = freshSave();
  readonly persistent: boolean;

  constructor(
    private readonly storage: Storage | null = typeof localStorage ===
    "undefined"
      ? null
      : localStorage,
  ) {
    this.persistent = this.canWrite();
    this.memory = this.load();
  }

  load(): SaveV1 {
    if (!this.storage) return this.memory;
    const raw = this.storage.getItem(KEY);
    if (!raw) return freshSave();
    const parsed = parseSave(raw);
    if (parsed) return parsed;
    try {
      this.storage.setItem(RECOVERY_KEY, raw);
    } catch {
      return freshSave();
    }
    return freshSave();
  }

  save(value: SaveV1): void {
    this.memory = value;
    if (!this.persistent || !this.storage) return;
    this.storage.setItem(KEY, JSON.stringify(value));
  }

  clear(): SaveV1 {
    const next = freshSave();
    this.save(next);
    return next;
  }

  private canWrite(): boolean {
    if (!this.storage) return false;
    try {
      const probe = `${KEY}.probe`;
      this.storage.setItem(probe, "1");
      this.storage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }
}

export function recordSolve(
  save: SaveV1,
  puzzleId: string,
  keystrokes: number,
  stars: 1 | 2 | 3,
  hintUsed: boolean,
  testOutChapter?: string,
): SaveV1 {
  const previous = save.puzzleResults[puzzleId];
  const result: PuzzleResult = {
    passedAt: previous?.passedAt ?? new Date().toISOString(),
    bestKeystrokes: Math.min(
      previous?.bestKeystrokes ?? Number.MAX_SAFE_INTEGER,
      keystrokes,
    ),
    bestStars: Math.max(previous?.bestStars ?? 1, stars) as 1 | 2 | 3,
    solvedWithoutHint: (previous?.solvedWithoutHint ?? false) || !hintUsed,
  };
  return {
    ...save,
    puzzleResults: { ...save.puzzleResults, [puzzleId]: result },
    passedTestOuts:
      testOutChapter && !save.passedTestOuts.includes(testOutChapter)
        ? [...save.passedTestOuts, testOutChapter]
        : save.passedTestOuts,
    lastPuzzleId: puzzleId,
  };
}
