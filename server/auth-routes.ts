import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler
} from "express";
import { createOwnAuthHandler } from "own-auth/http";

import { auth } from "./auth.js";
import { getServerEnv } from "./env.js";
import { sendWebResponse, toWebRequest } from "./web-request.js";

const maxAuthBodyBytes = 64 * 1024;
const requestContexts = new WeakMap<
  Request,
  { ipAddress?: string; userAgent?: string }
>();
const authHandler = createOwnAuthHandler(auth, {
  getRequestContext: (request) => requestContexts.get(request) ?? {},
  maxRequestBodyBytes: maxAuthBodyBytes,
  trustedOrigins: [getServerEnv().appUrl]
});

export function registerAuthRoutes(app: Express): void {
  const rawBody = express.raw({
    limit: maxAuthBodyBytes,
    type: () => true
  });

  const handleAuth: RequestHandler = async (request, response, next) => {
    try {
      const webRequest = toWebRequest(request);
      requestContexts.set(webRequest, {
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      });
      await sendWebResponse(await authHandler(webRequest), response);
    } catch (error) {
      next(error);
    }
  };

  app.use("/api/auth", rawBody, handleAuth);

  const handleBodyError: ErrorRequestHandler = (
    error,
    _request,
    response,
    next
  ) => {
    const type =
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      typeof error.type === "string"
        ? error.type
        : null;
    if (type === "entity.too.large") {
      response.status(413).json({
        error: {
          code: "invalid_request",
          message: "Request body is too large"
        }
      });
      return;
    }
    if (type === "request.size.invalid") {
      response.status(400).json({
        error: {
          code: "invalid_request",
          message: "Invalid Content-Length"
        }
      });
      return;
    }
    next(error);
  };

  app.use("/api/auth", handleBodyError);
}
