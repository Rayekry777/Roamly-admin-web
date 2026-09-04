import { expect, test } from "@playwright/test";

test("显示 Roamly 运营工作台基线", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "运营工作台" })).toBeVisible();
  await expect(page.getByText("Roamly", { exact: true })).toBeVisible();
});
