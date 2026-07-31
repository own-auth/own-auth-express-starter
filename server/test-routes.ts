import type { Express } from "express";

import { getServerEnv } from "./env.js";
import { listTestEmails } from "./test-email-provider.js";

export function registerTestRoutes(app: Express): void {
  if (!getServerEnv().testMode) return;

  app.get("/api/test/emails", (request, response) => {
    const recipient =
      typeof request.query.to === "string"
        ? request.query.to.toLowerCase()
        : undefined;
    const type =
      typeof request.query.type === "string"
        ? request.query.type
        : undefined;
    const matching = listTestEmails().filter(
      (message) =>
        (!recipient || message.to.toLowerCase() === recipient) &&
        (!type || message.type === type)
    );
    const latest = matching.at(-1);
    response.json({
      count: matching.length,
      latest: latest
        ? {
            expiresAt: latest.expiresAt.toISOString(),
            to: latest.to,
            token: latest.token,
            type: latest.type,
            url: latest.url
          }
        : null
    });
  });
}
