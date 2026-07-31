import { type FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { isAuthError } from "@/lib/errors";
import { Link } from "@/lib/router";

export function MagicLinkPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void fetch("/api/config")
      .then((response) => response.json())
      .then((body: { emailDeliveryConfigured: boolean }) => {
        setConfigured(body.emailDeliveryConfigured);
      })
      .catch(() => setConfigured(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(true);
    try {
      await authClient.requestMagicLink({ email });
    } catch (caught) {
      setSent(false);
      setError(
        isAuthError(caught, "rate_limited")
          ? "Too many requests. Wait a moment before trying again."
          : "We could not send the link. Please try again."
      );
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow">Passwordless sign in</p>
          <h1>Email me a secure link</h1>
          <p>
            We will send a single-use link through{" "}
            <a href="https://own-auth.com" rel="noreferrer" target="_blank">
              Own Auth Delivery
            </a>
            . It expires after 15 minutes.
          </p>
        </div>

        {configured === null ? (
          <div aria-label="Checking email delivery" className="form-skeleton" />
        ) : !configured ? (
          <div className="configuration-warning" role="status">
            <strong>OWN_AUTH_EMAIL_DELIVERY_KEY is missing from .env.</strong>
            <p>Add a Delivery app key to enable magic-link sign in.</p>
            <a href="https://own-auth.com" rel="noreferrer" target="_blank">
              Open Own Auth Delivery
            </a>
          </div>
        ) : sent ? (
          <div className="delivery-confirmation" role="status">
            <span className="delivery-icon" aria-hidden="true">✓</span>
            <h2>Check your inbox</h2>
            <p>
              If this address can receive a sign-in link, one is on its way.
              It expires in 15 minutes and can only be used once.
            </p>
            <button
              className="text-button"
              onClick={() => {
                setEmail("");
                setSent(false);
              }}
              type="button"
            >
              Use another email
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email address
              <input
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary">Send magic link</button>
          </form>
        )}
        <p className="form-switch">
          Prefer a password? <Link to="/sign-in">Sign in normally</Link>
        </p>
      </section>
    </div>
  );
}
