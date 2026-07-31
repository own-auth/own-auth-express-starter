import { OwnAuthClientError } from "own-auth/client";

export function isAuthError(
  error: unknown,
  code: OwnAuthClientError["code"]
): boolean {
  return error instanceof OwnAuthClientError && error.code === code;
}

export function tokenError(
  error: unknown,
  kind: "magic" | "verification" | "reset"
): string {
  if (!(error instanceof OwnAuthClientError)) {
    return kind === "reset"
      ? "We could not reset your password. Please try again."
      : "We could not verify this link. Request a new one and try again.";
  }
  if (error.code === "expired_token") {
    return kind === "reset"
      ? "This reset link has expired. Request a new one."
      : "This link has expired. Request a new one to continue.";
  }
  if (error.code === "token_already_used") {
    return kind === "reset"
      ? "This reset link has already been used."
      : "This link has already been used.";
  }
  if (error.code === "weak_password") return "Choose a stronger password.";
  return kind === "reset"
    ? "This password reset link is invalid."
    : "This link is invalid. Request a new one to continue.";
}
