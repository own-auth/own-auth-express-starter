import { expect, test } from "@playwright/test";

import { latestEmail, password, uniqueEmail } from "../support";

const origin = "http://localhost:3200";

test("Express bridge creates, reads, and clears a cookie session", async ({
  request
}) => {
  const email = uniqueEmail("api");
  const signUp = await request.post("/api/auth/sign-up/email", {
    data: { email, name: "API User", password },
    headers: { origin }
  });
  expect(signUp.ok()).toBe(true);
  expect(signUp.headers()["set-cookie"]).toContain("HttpOnly");

  await expect((await request.get("/api/auth/session")).json()).resolves.toMatchObject({
    session: { user: { email } }
  });
  expect(
    (await request.post("/api/auth/sign-out", { headers: { origin } })).ok()
  ).toBe(true);
  await expect((await request.get("/api/auth/session")).json()).resolves.toEqual({
    session: null
  });
});

test("Express bridge preserves CSRF and validation behavior", async ({
  request
}) => {
  const malformed = await request.post("/api/auth/sign-up/email", {
    data: { email: "invalid" },
    headers: { origin }
  });
  expect(malformed.status()).toBe(400);
  await expect(malformed.json()).resolves.toMatchObject({
    error: { code: "validation_error" }
  });

  const crossSite = await request.post("/api/auth/sign-up/email", {
    data: { email: uniqueEmail("csrf"), password },
    headers: { origin: "https://attacker.example" }
  });
  expect(crossSite.status()).toBe(403);
  await expect(crossSite.json()).resolves.toMatchObject({
    error: { code: "csrf_failed" }
  });
});

test("magic links pass through Express and remain single-use", async ({
  request
}) => {
  const email = uniqueEmail("magic-api");
  await request.post("/api/auth/sign-up/email", {
    data: { email, name: "Magic User", password },
    headers: { origin }
  });
  await request.post("/api/auth/sign-out", { headers: { origin } });
  await request.post("/api/auth/magic-link/request", {
    data: { email },
    headers: { origin }
  });
  const message = await latestEmail(request, email, "magic_link");
  expect(
    (
      await request.post("/api/auth/magic-link/verify", {
        data: { token: message.token },
        headers: { origin }
      })
    ).ok()
  ).toBe(true);
  const replay = await request.post("/api/auth/magic-link/verify", {
    data: { token: message.token },
    headers: { origin }
  });
  expect(replay.status()).toBe(401);
  await expect(replay.json()).resolves.toMatchObject({
    error: { code: "token_already_used" }
  });
});

test("account mutations reject cross-site requests", async ({ request }) => {
  const email = uniqueEmail("account-csrf");
  await request.post("/api/auth/sign-up/email", {
    data: { email, name: "Account User", password },
    headers: { origin }
  });
  const account = (await (
    await request.get("/api/account")
  ).json()) as {
    session: { id: string };
  };
  const rejected = await request.post(
    `/api/account/sessions/${account.session.id}/revoke`,
    { headers: { origin: "https://attacker.example" } }
  );
  expect(rejected.status()).toBe(403);
  expect((await request.get("/api/account")).ok()).toBe(true);
});
