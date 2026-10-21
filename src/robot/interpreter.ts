import type {
  Entity,
  Facing,
  ObjectiveCondition,
  SceneSpec,
} from "../content/types.ts";
import { parse } from "./reference.ts";
import type {
  SceneFailure,
  SimulationFrame,
  SimulationResult,
  WorldSnapshot,
} from "./types.ts";

type Door = Extract<Entity, { kind: "door" }>;
type Device = Extract<Entity, { kind: "device" }>;

type Statement =
  | { k: "move" | "wait"; n: number }
  | { k: "turn"; dir: "left" | "right" }
  | { k: "grab" | "say"; s: string }
  | { k: "drop" }
  | { k: "open" | "close"; dev: string }
  | { k: "set"; dev: string; n: number }
  | { k: "repeat"; n: number; body: Statement[] }
  | { k: "when"; sensor: number; n: number; body: Statement[] };

interface World {
  x: number;
  y: number;
  facing: Facing;
  holding: string | null;
  cargo: { name: string; x: number; y: number }[];
  doors: Map<string, Door>;
  devices: Map<string, Device>;
  sensors: Map<number, number | string>;
  said: string[];
  tick: number;
}

class Halt extends Error {
  readonly kind: SceneFailure["kind"];
  readonly sourceLine: number | undefined;

  constructor(
    message: string,
    kind: SceneFailure["kind"] = "runtime",
    sourceLine?: number,
  ) {
    super(message);
    this.kind = kind;
    this.sourceLine = sourceLine;
  }
}

const DELTA: Record<Facing, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};
const ORDER: Facing[] = ["N", "E", "S", "W"];
const TICK_CAP = 500;

function snapshot(world: World): WorldSnapshot {
  return {
    robot: { x: world.x, y: world.y, facing: world.facing },
    holding: world.holding,
    cargo: world.cargo.map((cargo) => ({ ...cargo })),
    doors: Object.fromEntries(
      [...world.doors.entries()].map(([name, door]) => [
        name,
        { open: door.open, tile: door.tile },
      ]),
    ),
    devices: Object.fromEntries(
      [...world.devices.entries()].map(([name, device]) => [
        name,
        device.value,
      ]),
    ),
    said: [...world.said],
    tick: world.tick,
  };
}

function worldFrom(scene: SceneSpec): World {
  const world: World = {
    x: scene.robotStart.x,
    y: scene.robotStart.y,
    facing: scene.robotStart.facing,
    holding: null,
    cargo: [],
    doors: new Map(),
    devices: new Map(),
    sensors: new Map(),
    said: [],
    tick: 0,
  };
  for (const entity of scene.entities ?? []) {
    if (entity.kind === "door")
      world.doors.set(entity.name, {
        ...entity,
        schedule: entity.schedule?.map((entry) => ({ ...entry })),
      });
    else if (entity.kind === "device")
      world.devices.set(entity.name, { ...entity });
    else if (entity.kind === "cargo") world.cargo.push({ ...entity });
    else world.sensors.set(entity.index, entity.reads);
  }
  return world;
}

function objectiveHolds(world: World, condition: ObjectiveCondition): boolean {
  if ("robotAt" in condition)
    return world.x === condition.robotAt.x && world.y === condition.robotAt.y;
  if ("robotFacing" in condition) return world.facing === condition.robotFacing;
  if ("cargoAt" in condition)
    return world.cargo.some(
      (cargo) =>
        cargo.name === condition.cargoAt.name &&
        cargo.x === condition.cargoAt.x &&
        cargo.y === condition.cargoAt.y,
    );
  if ("holding" in condition)
    return (world.holding ?? "none") === condition.holding;
  if ("device" in condition) {
    const door = world.doors.get(condition.device.name);
    if (door) return (door.open ? "open" : "closed") === condition.device.is;
    return (
      world.devices.get(condition.device.name)?.value === condition.device.is
    );
  }
  return world.said.includes(condition.said);
}

export function simulate(
  scene: SceneSpec,
  lines: readonly string[],
): SimulationResult {
  const world = worldFrom(scene);
  const frames: SimulationFrame[] = [
    { world: snapshot(world), event: "Program linked" },
  ];
  const tileAt = (x: number, y: number) => scene.tiles[y]?.[x];
  const doorOn = (tile: string | undefined) =>
    [...world.doors.values()].find((door) => door.tile === tile);
  const record = (event: string) =>
    frames.push({ world: snapshot(world), event });
  const halt = (
    message: string,
    kind: SceneFailure["kind"] = "runtime",
  ): never => {
    throw new Halt(message, kind);
  };
  const setDoor = (door: Door, open: boolean) => {
    door.open = open;
    if (!open && tileAt(world.x, world.y) === door.tile)
      halt(`is crushed by the ${door.name} door`);
    if (open && door.airlock) {
      const group = [...world.doors.values()].filter(
        (item) => item.airlock === door.airlock,
      );
      if (group.length > 1 && group.every((item) => item.open))
        halt("vents the airlock");
    }
  };
  const tick = (event: string, action: () => void) => {
    if (world.tick >= TICK_CAP) halt("overheats");
    for (const door of world.doors.values())
      for (const schedule of door.schedule ?? [])
        if (schedule.at === world.tick) setDoor(door, schedule.open);
    action();
    world.tick++;
    record(event);
  };

  const execute = (statements: Statement[]) => {
    for (const statement of statements) {
      switch (statement.k) {
        case "move":
          for (let index = 0; index < statement.n; index++)
            tick("moves", () => {
              const [dx, dy] = DELTA[world.facing];
              const tile = tileAt(world.x + dx, world.y + dy);
              if (tile === undefined || tile === "#")
                halt("crashes into the hull");
              const door = doorOn(tile);
              if (door && !door.open)
                halt(`is blocked by the closed ${door.name} door`);
              world.x += dx;
              world.y += dy;
            });
          break;
        case "wait":
          for (let index = 0; index < statement.n; index++)
            tick("waits", () => undefined);
          break;
        case "turn":
          tick(`turns ${statement.dir}`, () => {
            world.facing =
              ORDER[
                (ORDER.indexOf(world.facing) +
                  (statement.dir === "right" ? 1 : 3)) %
                  4
              ]!;
          });
          break;
        case "grab":
          tick(`grabs ${statement.s}`, () => {
            if (world.holding) halt("has full hands");
            const at = world.cargo.findIndex(
              (cargo) =>
                cargo.name === statement.s &&
                cargo.x === world.x &&
                cargo.y === world.y,
            );
            if (at < 0) halt(`finds no ${statement.s} here`);
            world.cargo.splice(at, 1);
            world.holding = statement.s;
          });
          break;
        case "drop":
          tick("drops its Cargo", () => {
            if (!world.holding) halt("has no Cargo to drop");
            const held = world.holding;
            if (!held) halt("has no Cargo to drop");
            world.cargo.push({ name: held!, x: world.x, y: world.y });
            world.holding = null;
          });
          break;
        case "open":
        case "close":
          tick(`${statement.k}s ${statement.dev}`, () => {
            const door = world.doors.get(statement.dev);
            if (!door)
              halt(
                world.devices.has(statement.dev)
                  ? `cannot ${statement.k} ${statement.dev}`
                  : `finds no device ${statement.dev}`,
              );
            setDoor(door!, statement.k === "open");
          });
          break;
        case "set":
          tick(`sets ${statement.dev}`, () => {
            const device = world.devices.get(statement.dev);
            if (!device)
              halt(
                world.doors.has(statement.dev)
                  ? `${statement.dev} is not settable`
                  : `finds no device ${statement.dev}`,
              );
            if (statement.n < device!.min || statement.n > device!.max)
              halt(`${statement.dev} rejects ${statement.n}`);
            device!.value = statement.n;
          });
          break;
        case "say":
          tick(`says “${statement.s}”`, () => world.said.push(statement.s));
          break;
        case "repeat":
          for (let index = 0; index < statement.n; index++)
            execute(statement.body);
          break;
        case "when": {
          const reads = world.sensors.get(statement.sensor);
          if (reads === undefined) halt(`finds no sensor ${statement.sensor}`);
          const value =
            typeof reads === "number"
              ? reads
              : world.devices.get(reads!)?.value;
          if (value === statement.n) execute(statement.body);
          break;
        }
      }
    }
  };

  let failure: SceneFailure | null = null;
  try {
    if (scene.maxLines !== undefined && lines.length > scene.maxLines)
      halt("has no memory for this Program", "memory");
    const parsed = parse([...lines]);
    execute(parsed.program as Statement[]);
    if (parsed.errorLine !== null)
      throw new Halt(
        "can't parse its Program and halts here",
        "parse",
        parsed.errorLine,
      );
  } catch (error) {
    if (!(error instanceof Halt)) throw error;
    failure = {
      kind: error.kind,
      caption: error.message,
      at: { x: world.x, y: world.y },
      ...(error.sourceLine === undefined
        ? {}
        : { sourceLine: error.sourceLine }),
    };
  }
  const objectiveMet =
    !failure &&
    scene.objective.conditions.every((condition) =>
      objectiveHolds(world, condition),
    );
  if (!failure && !objectiveMet)
    failure = {
      kind: "objective",
      caption: "stops here, Objective not complete",
      at: { x: world.x, y: world.y },
    };
  return {
    frames,
    world: snapshot(world),
    success: objectiveMet,
    objectiveMet,
    failure,
  };
}
