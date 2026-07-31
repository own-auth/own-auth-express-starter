import { expect, test } from "@playwright/test";

import { createUser, latestEmail, password, uniqueEmail } from "../support";

test("password sign-up, sign-out, invalid credentials, and sign-in work", async ({
  page
}) => {
  const email = uniqueEmail("browser");
  await createUser(page, email);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/u);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "Invalid email or password."
  );
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/u);
});

test("magic-link sign-in is optimistic and single-use", async ({
  page,
  request
}) => {
  const email = uniqueEmail("magic-browser");
  await createUser(page, email);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/magic-link");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  const message = await latestEmail(request, email, "magic_link");
  await page.goto(`/auth/magic?token=${message.token}`);
  await expect(page).toHaveURL(/\/account$/u);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto(`/auth/magic?token=${message.token}`);
  await expect(page.locator('p[role="alert"]')).toContainText("already been used");
});

test("password reset changes credentials and revokes the session", async ({
  page,
  request
}) => {
  const email = uniqueEmail("reset-browser");
  await createUser(page, email);
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  const message = await latestEmail(request, email, "password_reset");
  await page.goto(`/auth/reset?token=${message.token}`);
  const replacement = "replacement password suitable for testing";
  await page.getByLabel("New password", { exact: true }).fill(replacement);
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill(replacement);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(replacement);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/u);
});

test("account page fits a narrow viewport and exposes password controls", async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await createUser(page, uniqueEmail("mobile"));
  expect(
    await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)
  ).toBe(true);
  await page.getByText("Change password", { exact: true }).click();
  const field = page.getByLabel("Current password", { exact: true });
  await expect(field).toHaveAttribute("type", "password");
  await page
    .getByRole("button", { name: "Show current password" })
    .click();
  await expect(field).toHaveAttribute("type", "text");
});
