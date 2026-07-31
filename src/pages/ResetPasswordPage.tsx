import { type FormEvent, useEffect, useState } from "react";

import { PasswordField } from "@/components/PasswordField";
import { authClient } from "@/lib/auth-client";
import { tokenError } from "@/lib/errors";
import { Link, useRouter } from "@/lib/router";

export function ResetPasswordPage() {
  const { pathname, search } = useRouter();
  const token = new URLSearchParams(search).get("token");
  const [error, setError] = useState<string | null>(
    token ? null : "This password reset link is missing its token."
  );
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) window.history.replaceState(null, "", pathname);
  }, [pathname, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword !== String(data.get("confirmation") ?? "")) {
      setError("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authClient.resetPassword({ newPassword, token });
      setComplete(true);
    } catch (caught) {
      setError(tokenError(caught, "reset"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        {complete ? (
          <div className="verification-state">
            <span className="delivery-icon" aria-hidden="true">✓</span>
            <h1>Password updated</h1>
            <p>Sign in again with your new password.</p>
            <Link className="button button-primary" to="/sign-in">Sign in</Link>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <p className="eyebrow">Account recovery</p>
              <h1>Choose a new password</h1>
              <p>Your existing sessions will be signed out after the reset.</p>
            </div>
            <form className="auth-form" onSubmit={submit}>
              <PasswordField
                autoComplete="new-password"
                disabled={!token}
                label="New password"
                name="newPassword"
                required
              />
              <PasswordField
                autoComplete="new-password"
                disabled={!token}
                label="Confirm new password"
                name="confirmation"
                required
              />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button
                className="button button-primary"
                disabled={!token || submitting}
              >
                {submitting ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
