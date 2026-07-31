import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const password = "correct horse battery staple";
let sequence = 0;

export function uniqueEmail(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}@example.com`;
}

export async function createUser(page: Page, email: string): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/u);
  await expect(page.getByRole("heading", { name: "Account details" })).toBeVisible();
}

export async function latestEmail(
  request: APIRequestContext,
  email: string,
  type: "email_verification" | "magic_link" | "password_reset"
) {
  let latest: { token: string; url: string } | null = null;
  await expect
    .poll(async () => {
      const response = await request.get(
        `/api/test/emails?to=${encodeURIComponent(email)}&type=${type}`
      );
      const body = (await response.json()) as {
        count: number;
        latest: { token: string; url: string } | null;
      };
      latest = body.latest;
      return body.count;
    })
    .toBeGreaterThan(0);
  return latest as unknown as { token: string; url: string };
}
