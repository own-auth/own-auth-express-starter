import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import express from "express";

import { registerAccountRoutes } from "./account-routes.js";
import { registerAuthRoutes } from "./auth-routes.js";
import { getServerEnv } from "./env.js";
import { registerTestRoutes } from "./test-routes.js";

const env = getServerEnv();
const app = express();
app.disable("x-powered-by");

registerAuthRoutes(app);
registerAccountRoutes(app);
registerTestRoutes(app);

if (env.production) {
  const clientRoot = fileURLToPath(new URL("../dist/client", import.meta.url));
  if (!existsSync(clientRoot)) {
    throw new Error("Client build not found. Run npm run build first.");
  }
  app.use(express.static(clientRoot, { index: false }));
  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) {
      next();
      return;
    }
    response.sendFile("index.html", { root: clientRoot });
  });
}

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Own Auth Express starter listening on ${env.port}`);
});
