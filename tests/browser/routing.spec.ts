import { expect, test } from "@playwright/test";

const puzzlePath = "#/puzzle/01-grid-moves-introductory";

test.describe("application routing", () => {
  test("loads and refreshes every named route", async ({ page }) => {
    for (const [path, heading] of [
      ["#/", /Repair the station/],
      ["#/chapters", "Chapters"],
      ["#/settings", "Settings"],
      [puzzlePath, /SCOUT-3 reaches the docking beacon/],
    ] as const) {
      await page.goto(`/${path}`);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("shows not found for unknown routes and puzzle IDs", async ({
    page,
  }) => {
    await page.goto("/#/missing");
    await expect(
      page.getByRole("heading", { name: "Route not found" }),
    ).toBeVisible();

    await page.goto("/#/puzzle/not-a-puzzle");
    await expect(
      page.getByRole("heading", { name: "Route not found" }),
    ).toBeVisible();
  });

  test("uses hash history for back and forward navigation", async ({
    page,
  }) => {
    await page.goto("/#/");
    await page.getByRole("link", { name: "Open Chapter Menu" }).click();
    await page.locator(".puzzle-chip").first().click();
    await page.keyboard.press("j");
    await expect(page.locator(".key-count")).toHaveText("1 / 7 keys");

    await page.getByRole("link", { name: "Chapters" }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Chapters" })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    expect(new URL(page.url()).hash).toBe("#/settings");
  });

  test("stops puzzle input after navigation", async ({ page }) => {
    await page.goto(`/${puzzlePath}`);
    await page.getByRole("link", { name: "Chapters" }).click();
    await page.keyboard.press("j");
    await page.goBack();
    await expect(page.locator(".key-count")).toHaveText("0 / 7 keys");
  });
});
