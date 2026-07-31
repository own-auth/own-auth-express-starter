import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { tokenError } from "@/lib/errors";
import { Link, useRouter } from "@/lib/router";

export function TokenVerificationPage({
  kind
}: Readonly<{ kind: "magic" | "verification" }>) {
  const { navigate, pathname, search } = useRouter();
  const token = new URLSearchParams(search).get("token");
  const started = useRef(false);
  const [state, setState] = useState<
    "pending" | "complete" | { error: string }
  >(token ? "pending" : { error: "This link is missing its token." });

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    window.history.replaceState(null, "", pathname);

    const request =
      kind === "magic"
        ? authClient.verifyMagicLink({ token })
        : authClient.verifyEmail({ token });

    void request
      .then((result) => {
        if ("status" in result && result.status === "mfa_required") {
          setState({ error: "This starter does not include an MFA challenge screen." });
        } else if (kind === "magic") {
          navigate("/account", { replace: true });
        } else {
          setState("complete");
        }
      })
      .catch((error: unknown) => setState({ error: tokenError(error, kind) }));
  }, [kind, navigate, pathname, token]);

  return (
    <div className="auth-shell">
      <section className="auth-card verification-state">
        {state === "pending" ? (
          <>
            <span className="spinner" aria-hidden="true" />
            <h1>{kind === "magic" ? "Signing you in" : "Verifying your email"}</h1>
            <p>We are securely checking this one-time link.</p>
          </>
        ) : state === "complete" ? (
          <>
            <span className="delivery-icon" aria-hidden="true">✓</span>
            <h1>Email verified</h1>
            <p>Your email address has been confirmed.</p>
            <Link className="button button-primary" to="/account">
              Continue to account
            </Link>
          </>
        ) : (
          <>
            <span className="error-icon" aria-hidden="true">!</span>
            <h1>Link not accepted</h1>
            <p role="alert">{state.error}</p>
            <Link
              className="button button-primary"
              to={kind === "magic" ? "/magic-link" : "/account"}
            >
              {kind === "magic" ? "Request a new link" : "Return to account"}
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
