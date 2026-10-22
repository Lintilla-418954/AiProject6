import { expect, test } from "@playwright/test";

test("opens the station map and first Puzzle", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Repair the station/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open Chapter Menu" }).click();
  await expect(page.getByRole("heading", { name: "Chapters" })).toBeVisible();
  await page.locator(".puzzle-chip").first().click();
  await expect(page.getByLabel(/Robot Program Vim buffer/)).toBeVisible();
  await expect(page.locator(".key-count")).toHaveText("0 / 11 keys");
  await page.keyboard.press("j");
  await expect(page.locator(".key-count")).toHaveText("1 / 11 keys");
});
