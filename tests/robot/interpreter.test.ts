import { describe, expect, it } from "vitest";
import type { SceneSpec } from "../../src/content/types.ts";
import { simulate } from "../../src/robot/index.ts";

const scene: SceneSpec = {
  tiles: [".....", "....P", "....."],
  robotStart: { x: 1, y: 1, facing: "E" },
  objective: {
    text: "Reach the pad",
    conditions: [{ robotAt: { x: 4, y: 1 } }],
  },
};

describe("Robot interpreter", () => {
  it("emits world frames and satisfies the Objective", () => {
    const result = simulate(scene, ["move(3)"]);
    expect(result.success).toBe(true);
    expect(result.frames).toHaveLength(4);
    expect(result.world.robot).toMatchObject({ x: 4, y: 1 });
  });

  it("returns world-only parse feedback", () => {
    const result = simulate(scene, ["movex(3)"]);
    expect(result.failure?.kind).toBe("parse");
    expect(result.failure?.caption).not.toContain("line");
  });
});
