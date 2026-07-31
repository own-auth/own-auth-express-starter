import { createOwnAuthReactClient } from "own-auth/react";

export const authClient = createOwnAuthReactClient({
  baseURL: "/api/auth"
});
