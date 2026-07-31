import { type FormEvent, useState } from "react";

import { PasswordField } from "@/components/PasswordField";
import { authClient } from "@/lib/auth-client";
import { isAuthError } from "@/lib/errors";
import { Link, useRouter } from "@/lib/router";

export function AuthPage({ mode }: Readonly<{ mode: "sign-in" | "sign-up" }>) {
  const { navigate } = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const signUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    try {
      if (signUp) {
        const name = String(data.get("name") ?? "").trim();
        await authClient.signUpEmailPassword({
          email,
          password,
          ...(name ? { name } : {})
        });
        void authClient.requestEmailVerification({ email }).catch(() => {});
      } else {
        const result = await authClient.signInEmailPassword({ email, password });
        if (result.status === "mfa_required") {
          setError("This starter does not include an MFA challenge screen.");
          return;
        }
      }
      navigate("/account", { replace: true });
    } catch (caught) {
      if (isAuthError(caught, "email_already_exists")) {
        setError("An account with this email already exists.");
      } else if (isAuthError(caught, "weak_password")) {
        setError("Choose a stronger password.");
      } else if (isAuthError(caught, "invalid_credentials")) {
        setError("Invalid email or password.");
      } else {
        setError("We could not complete that request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow">{signUp ? "Get started" : "Welcome back"}</p>
          <h1>{signUp ? "Create your account" : "Sign in to your account"}</h1>
          <p>
            {signUp
              ? "Your password is hashed by Own Auth before storage."
              : "Use the email and password associated with your account."}
          </p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {signUp && (
            <label>
              Name
              <input autoComplete="name" name="name" type="text" />
            </label>
          )}
          <label>
            Email address
            <input
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              name="email"
              required
              spellCheck={false}
              type="email"
            />
          </label>
          <PasswordField
            autoComplete={signUp ? "new-password" : "current-password"}
            label="Password"
            name="password"
            required
          />
          {!signUp && (
            <Link className="form-help" to="/forgot-password">
              Forgot password?
            </Link>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={submitting}>
            {submitting
              ? signUp
                ? "Creating account…"
                : "Signing in…"
              : signUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
        {!signUp && (
          <Link className="button button-secondary full-width" to="/magic-link">
            Sign in with magic link
          </Link>
        )}
        <p className="form-switch">
          {signUp ? "Already have an account? " : "New here? "}
          <Link to={signUp ? "/sign-in" : "/sign-up"}>
            {signUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </div>
  );
}
