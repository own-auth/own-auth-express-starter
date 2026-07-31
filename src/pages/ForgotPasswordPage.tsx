import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Link } from "@/lib/router";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await authClient.requestPasswordReset({ email });
    } catch {
      // Keep the response identical so account existence is never revealed.
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow">Account recovery</p>
          <h1>Reset your password</h1>
          <p>Enter your email and we will send you a secure reset link.</p>
        </div>
        {sent ? (
          <div className="delivery-confirmation" role="status">
            <span className="delivery-icon" aria-hidden="true">✓</span>
            <h2>Check your inbox</h2>
            <p>
              If an account exists for that email, a password reset link is on
              its way.
            </p>
            <button
              className="text-button"
              onClick={() => setSent(false)}
              type="button"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email address
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <button
              className="button button-primary"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="form-switch">
          Remembered it? <Link to="/sign-in">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
