import { expect, test } from "@playwright/test";

import { createUser, latestEmail, password, uniqueEmail } from "../support";

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  credential = password
) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(credential);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/u);
}

test("email verification completes once and updates the account", async ({
  page,
  request
}) => {
  const email = uniqueEmail("verification");
  await createUser(page, email);
  const message = await latestEmail(request, email, "email_verification");
  await page.goto(`/auth/verify?token=${message.token}`);
  await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
  await page.getByRole("link", { name: "Continue to account" }).click();
  await expect(
    page.locator(".verified-badge").filter({ hasText: "Verified" })
  ).toBeVisible();
  await page.goto(`/auth/verify?token=${message.token}`);
  await expect(page.locator('p[role="alert"]')).toContainText(
    "already been used"
  );
});

test("password change validates the current password and revokes another device", async ({
  browser,
  page
}) => {
  const email = uniqueEmail("change");
  const replacement = "replacement password suitable for testing";
  await createUser(page, email);
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await signIn(otherPage, email);

  await page.reload();
  await page.getByText("Change password", { exact: true }).click();
  await page
    .getByLabel("Current password", { exact: true })
    .fill("incorrect password");
  await page.getByLabel("New password", { exact: true }).fill(replacement);
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill(replacement);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "Your current password is incorrect."
  );

  await page
    .getByLabel("Current password", { exact: true })
    .fill(password);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Your password has been updated."
  );
  await otherPage.goto("/account");
  await expect(otherPage).toHaveURL(/\/sign-in$/u);
  await otherContext.close();
});

test("session revocation uses confirmation and signs out the selected device", async ({
  browser,
  page
}) => {
  const email = uniqueEmail("sessions");
  await createUser(page, email);
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await signIn(otherPage, email);
  await page.reload();

  await page.getByRole("button", { name: "Revoke" }).click();
  const dialog = page.getByRole("dialog", { name: "Revoke this session?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();

  await page.getByRole("button", { name: "Revoke" }).click();
  await dialog.getByRole("button", { name: "Revoke session" }).click();
  await expect(page.getByRole("button", { name: "Revoke" })).toHaveCount(0);
  await otherPage.goto("/account");
  await expect(otherPage).toHaveURL(/\/sign-in$/u);
  await otherContext.close();
});
