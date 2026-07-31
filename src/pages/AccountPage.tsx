import { type FormEvent, useCallback, useEffect, useState } from "react";

import { PasswordField } from "@/components/PasswordField";
import { authClient } from "@/lib/auth-client";
import { isAuthError } from "@/lib/errors";
import { useRouter } from "@/lib/router";
import { formatLastActive, formatSessionLabel } from "@/lib/session-display";

type AccountData = Readonly<{
  session: { expiresAt: string; id: string };
  sessions: Array<{
    id: string;
    isCurrent: boolean;
    lastActiveAt: string;
    userAgent: string | null;
  }>;
  user: {
    email: string | null;
    emailVerifiedAt: string | null;
    id: string;
    name: string | null;
  };
}>;

export function AccountPage() {
  const { navigate } = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const loadAccount = useCallback(async () => {
    const response = await fetch("/api/account");
    if (response.status === 401) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (!response.ok) {
      setLoadError(true);
      return;
    }
    setAccount((await response.json()) as AccountData);
  }, [navigate]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  if (loadError) {
    return (
      <div className="shell">
        <p className="form-error" role="alert">
          We could not load your account. Please refresh and try again.
        </p>
      </div>
    );
  }
  if (!account) {
    return (
      <div aria-label="Loading account" className="shell account-skeleton">
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <div className="shell account-layout">
      <header className="account-heading">
        <p className="eyebrow">Account</p>
        <h1>
          {account.user.name
            ? `Welcome, ${account.user.name}`
            : "Your account"}
        </h1>
        <p>Your sign-in session is active.</p>
      </header>

      <section className="account-card" aria-labelledby="account-details">
        <div className="card-header">
          <h2 id="account-details">Account details</h2>
          <span className="verified-badge">✓ Active</span>
        </div>
        <dl className="detail-list">
          <div><dt>Email</dt><dd>{account.user.email ?? "Not set"}</dd></div>
          <div><dt>User ID</dt><dd className="mono">{account.user.id}</dd></div>
          <div>
            <dt>Session expires</dt>
            <dd>{new Date(account.session.expiresAt).toLocaleString("en-GB")}</dd>
          </div>
        </dl>
        <div className="card-footer">
          <p>Sign out of this device.</p>
          <SignOut onComplete={() => navigate("/sign-in", { replace: true })} />
        </div>
      </section>

      {account.user.email && (
        <EmailVerification
          email={account.user.email}
          verified={Boolean(account.user.emailVerifiedAt)}
        />
      )}
      <Sessions
        onChanged={loadAccount}
        sessions={account.sessions}
      />
      <ChangePassword />
    </div>
  );
}

function SignOut({ onComplete }: Readonly<{ onComplete: () => void }>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      {error && <p className="inline-error" role="alert">Could not sign out.</p>}
      <button
        className="button button-secondary"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void authClient
            .signOut()
            .then(onComplete)
            .catch(() => {
              setError(true);
              setPending(false);
            });
        }}
        type="button"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

function EmailVerification({
  email,
  verified
}: Readonly<{ email: string; verified: boolean }>) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="settings-card" aria-labelledby="verification-heading">
      <div className="settings-row">
        <div>
          <p className="overline">Email</p>
          <h2 id="verification-heading">
            {verified ? "Email verified" : "Verify your email"}
          </h2>
          <p>
            {verified
              ? email
              : sent
                ? `A verification link was sent to ${email}.`
                : `Confirm that ${email} belongs to you.`}
          </p>
        </div>
        {verified ? (
          <span className="verified-badge">✓ Verified</span>
        ) : (
          <button
            className="button button-secondary"
            disabled={pending}
            onClick={() => {
              setPending(true);
              setError(null);
              void authClient
                .requestEmailVerification({ email })
                .then(() => setSent(true))
                .catch((caught: unknown) =>
                  setError(
                    isAuthError(caught, "rate_limited")
                      ? "Too many requests. Try again later."
                      : "We could not send the verification email."
                  )
                )
                .finally(() => setPending(false));
            }}
            type="button"
          >
            {pending ? "Sending…" : sent ? "Resend email" : "Send email"}
          </button>
        )}
      </div>
      {error && <p className="settings-error" role="alert">{error}</p>}
    </section>
  );
}

function Sessions({
  onChanged,
  sessions
}: Readonly<{
  onChanged: () => Promise<void>;
  sessions: AccountData["sessions"];
}>) {
  const [selected, setSelected] = useState<(typeof sessions)[number] | null>(
    null
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return (
    <section className="settings-card" aria-labelledby="sessions-heading">
      <div className="settings-card-header">
        <p className="overline">Security</p>
        <h2 id="sessions-heading">Active sessions</h2>
      </div>
      <ul className="settings-list">
        {sessions.map((session) => (
          <li key={session.id}>
            <div>
              <strong>{formatSessionLabel(session.userAgent)}</strong>
              <span>
                {session.isCurrent
                  ? "This device"
                  : `Active ${formatLastActive(session.lastActiveAt)}`}
              </span>
            </div>
            {session.isCurrent ? (
              <span className="current-label">Current</span>
            ) : (
              <button
                className="text-button danger-button"
                onClick={() => setSelected(session)}
                type="button"
              >
                Revoke
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="settings-error" role="alert">Could not revoke that session.</p>}
      {selected && (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-labelledby="revoke-title"
            aria-modal="true"
            className="confirmation-dialog"
            role="dialog"
          >
            <h2 id="revoke-title">Revoke this session?</h2>
            <p>{formatSessionLabel(selected.userAgent)} will need to sign in again.</p>
            <div className="dialog-actions">
              <button
                className="button button-secondary"
                disabled={pending}
                onClick={() => setSelected(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                disabled={pending}
                onClick={() => {
                  setPending(true);
                  setError(false);
                  void fetch(`/api/account/sessions/${selected.id}/revoke`, {
                    method: "POST"
                  })
                    .then((response) => {
                      if (!response.ok) throw new Error("revoke failed");
                      return onChanged();
                    })
                    .then(() => setSelected(null))
                    .catch(() => setError(true))
                    .finally(() => setPending(false));
                }}
                type="button"
              >
                {pending ? "Revoking…" : "Revoke session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ChangePassword() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword !== String(data.get("confirmation") ?? "")) {
      setError("The new passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await authClient.changePassword({ currentPassword, newPassword });
      form.reset();
      setMessage("Your password has been updated.");
    } catch (caught) {
      setError(
        isAuthError(caught, "invalid_credentials")
          ? "Your current password is incorrect."
          : isAuthError(caught, "weak_password")
            ? "Choose a stronger password."
            : "We could not update your password."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="settings-card">
      <summary className="settings-summary">
        <div><p className="overline">Password</p><h2>Change password</h2></div>
        <span aria-hidden="true">›</span>
      </summary>
      <form className="settings-form" onSubmit={submit}>
        <PasswordField autoComplete="current-password" label="Current password" name="currentPassword" required />
        <PasswordField autoComplete="new-password" label="New password" name="newPassword" required />
        <PasswordField autoComplete="new-password" label="Confirm new password" name="confirmation" required />
        {error && <p className="settings-error" role="alert">{error}</p>}
        {message && <p className="settings-success" role="status">{message}</p>}
        <button className="button button-secondary" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </details>
  );
}
