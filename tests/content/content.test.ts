import { describe, expect, it } from "vitest";
import { puzzles } from "../../src/content/index.ts";
import { validateContent } from "../../src/content/validate.ts";

describe("production content", () => {
  it("contains the complete inventory", () => {
    expect(puzzles).toHaveLength(78);
  });

  it("passes structural and Scene validation", () => {
    expect(validateContent(puzzles)).toEqual([]);
  });
});
