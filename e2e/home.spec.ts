import { test, expect } from "@playwright/test";

test("landing page shows Rally branding and sign-in options", async ({
  page,
}) => {
  await page.goto("/");

  // Rally logo/title is visible
  await expect(page.locator("text=Rally").first()).toBeVisible();

  // Tagline is present
  await expect(page.locator("text=Find your people.")).toBeVisible();

  // Auth form is present
  await expect(
    page.locator("text=By continuing, you agree"),
  ).toBeVisible();
});
