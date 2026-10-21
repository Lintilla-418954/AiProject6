import type { SceneSpec } from "../content/types.ts";
import type { SimulationResult, WorldSnapshot } from "../robot/index.ts";

const TILE = 32;
const FACING: Record<string, [number, number]> = {
  N: [0, -7],
  E: [7, 0],
  S: [0, 7],
  W: [-7, 0],
};

export function renderScene(
  canvas: HTMLCanvasElement,
  scene: SceneSpec,
  simulation: SimulationResult,
  solvedFrame?: number,
): void {
  const width = Math.max(...scene.tiles.map((row) => row.length));
  canvas.width = width * TILE;
  canvas.height = scene.tiles.length * TILE;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.imageSmoothingEnabled = false;
  context.fillStyle = "#08111f";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < scene.tiles.length; y++) {
    for (let x = 0; x < scene.tiles[y]!.length; x++) {
      const tile = scene.tiles[y]![x]!;
      context.fillStyle =
        tile === "#" ? "#344258" : tile === "P" ? "#153e46" : "#111f32";
      context.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
      if (tile === "P") {
        context.strokeStyle = "#4de2a8";
        context.strokeRect(x * TILE + 6, y * TILE + 6, TILE - 12, TILE - 12);
      }
    }
  }

  const world =
    solvedFrame === undefined
      ? initialWorld(scene, simulation.world)
      : simulation.frames[Math.min(solvedFrame, simulation.frames.length - 1)]!
          .world;
  drawEntities(context, scene, world);
  if (solvedFrame === undefined) drawGhost(context, simulation);
  drawRobot(context, world);
  if (solvedFrame === undefined && simulation.failure)
    drawFailure(context, simulation.failure.at.x, simulation.failure.at.y);
}

function initialWorld(
  scene: SceneSpec,
  finalWorld: WorldSnapshot,
): WorldSnapshot {
  return {
    ...finalWorld,
    robot: { ...scene.robotStart },
    holding: null,
    cargo: (scene.entities ?? [])
      .filter((entity) => entity.kind === "cargo")
      .map((entity) => ({ name: entity.name, x: entity.x, y: entity.y })),
    doors: Object.fromEntries(
      (scene.entities ?? [])
        .filter((entity) => entity.kind === "door")
        .map((entity) => [
          entity.name,
          { open: entity.open, tile: entity.tile },
        ]),
    ),
    devices: Object.fromEntries(
      (scene.entities ?? [])
        .filter((entity) => entity.kind === "device")
        .map((entity) => [entity.name, entity.value]),
    ),
    said: [],
    tick: 0,
  };
}

function drawEntities(
  context: CanvasRenderingContext2D,
  scene: SceneSpec,
  world: WorldSnapshot,
): void {
  for (const cargo of world.cargo) {
    context.fillStyle = "#db9f48";
    context.fillRect(cargo.x * TILE + 9, cargo.y * TILE + 9, 14, 14);
    context.strokeStyle = "#593b1d";
    context.strokeRect(cargo.x * TILE + 9, cargo.y * TILE + 9, 14, 14);
  }
  for (const [name, door] of Object.entries(world.doors)) {
    for (let y = 0; y < scene.tiles.length; y++)
      for (let x = 0; x < scene.tiles[y]!.length; x++)
        if (scene.tiles[y]![x] === door.tile) {
          context.fillStyle = door.open ? "#f1be5140" : "#f1be51";
          context.fillRect(
            x * TILE + (door.open ? 4 : 10),
            y * TILE + 3,
            door.open ? 5 : 12,
            TILE - 6,
          );
          context.fillStyle = "#08111f";
          context.font = "8px monospace";
          context.fillText(
            name[0]?.toUpperCase() ?? "D",
            x * TILE + 3,
            y * TILE + 10,
          );
        }
  }
}

function drawGhost(
  context: CanvasRenderingContext2D,
  simulation: SimulationResult,
): void {
  context.beginPath();
  simulation.frames.forEach((frame, index) => {
    const x = frame.world.robot.x * TILE + TILE / 2;
    const y = frame.world.robot.y * TILE + TILE / 2;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = simulation.success ? "#4de2a8" : "#63b3ff";
  context.lineWidth = 2;
  context.setLineDash([5, 5]);
  context.stroke();
  context.setLineDash([]);
}

function drawRobot(
  context: CanvasRenderingContext2D,
  world: WorldSnapshot,
): void {
  const x = world.robot.x * TILE + TILE / 2;
  const y = world.robot.y * TILE + TILE / 2;
  context.fillStyle = "#dce8f5";
  context.fillRect(x - 10, y - 10, 20, 20);
  context.fillStyle = "#31d5f4";
  const eye = FACING[world.robot.facing]!;
  context.fillRect(x + eye[0] - 3, y + eye[1] - 3, 6, 6);
}

function drawFailure(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  context.strokeStyle = "#ff667d";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x * TILE + 7, y * TILE + 7);
  context.lineTo((x + 1) * TILE - 7, (y + 1) * TILE - 7);
  context.moveTo((x + 1) * TILE - 7, y * TILE + 7);
  context.lineTo(x * TILE + 7, (y + 1) * TILE - 7);
  context.stroke();
}
