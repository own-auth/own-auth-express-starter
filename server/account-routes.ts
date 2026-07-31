import type { Express, Request } from "express";
import { readSessionToken } from "own-auth/http";

import { auth } from "./auth.js";
import { getServerEnv } from "./env.js";
import { toWebRequest } from "./web-request.js";

export function registerAccountRoutes(app: Express): void {
  app.get("/api/config", (_request, response) => {
    response.json({
      emailDeliveryConfigured:
        Boolean(getServerEnv().emailDeliveryKey) || getServerEnv().testMode
    });
  });

  app.get("/api/account", async (request, response) => {
    const current = await currentSession(request);
    if (!current) {
      response.status(401).json({ error: "unauthorized" });
      return;
    }

    const now = new Date();
    const sessions = (await auth.listSessions({
      actorUserId: current.user.id
    }))
      .filter(
        (session) =>
          !session.revokedAt &&
          session.expiresAt > now &&
          session.idleExpiresAt > now
      )
      .map((session) => ({
        id: session.id,
        isCurrent: session.id === current.session.id,
        lastActiveAt: session.lastActiveAt.toISOString(),
        userAgent: session.userAgent
      }))
      .sort((left, right) => Number(right.isCurrent) - Number(left.isCurrent));

    response.json({
      session: {
        expiresAt: current.session.expiresAt.toISOString(),
        id: current.session.id
      },
      sessions,
      user: {
        email: current.user.email,
        emailVerifiedAt: current.user.emailVerifiedAt?.toISOString() ?? null,
        id: current.user.id,
        name: current.user.name
      }
    });
  });

  app.post(
    "/api/account/sessions/:sessionId/revoke",
    async (request: Request<{ sessionId: string }>, response) => {
      if (!hasTrustedOrigin(request)) {
        response.status(403).json({ error: "csrf_failed" });
        return;
      }
      const webRequest = toWebRequest(request);
      const { token } = readSessionToken(webRequest);
      if (!token) {
        response.status(401).json({ error: "unauthorized" });
        return;
      }

      await auth.revokeSession({
        sessionId: request.params.sessionId,
        sessionToken: token
      });
      response.json({ success: true });
    }
  );
}

async function currentSession(request: Request) {
  const { token } = readSessionToken(toWebRequest(request));
  return token ? auth.getCurrentSession(token) : null;
}

function hasTrustedOrigin(request: Request): boolean {
  const origin = request.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === getServerEnv().appUrl;
  } catch {
    return false;
  }
}
