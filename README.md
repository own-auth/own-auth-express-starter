# Own Auth + Express starter

A production-minded starting point for using
[Own Auth](https://own-auth.com) with Express 5 and React.

The starter includes:

- email/password sign-up and sign-in
- passwordless magic-link sign-in
- forgot-password and single-use password reset
- email verification with resend support
- authenticated password changes
- active-session listing and confirmed session revocation
- managed email delivery through Own Auth Delivery
- direct and Own Auth hosted-link routes
- `HttpOnly` cookie sessions
- request validation, CSRF protection, and bounded auth request bodies
- trusted Express client IP and user-agent request context
- centralized server-only environment validation
- accessible password controls and password-manager metadata
- unit, HTTP integration, and browser tests

## Requirements

- Node.js 20.9 or later
- PostgreSQL

## Start locally

Install dependencies and create the environment file:

```bash
npm install
cp .env.example .env
```

Generate a token pepper:

```bash
openssl rand -base64 32
```

Put it in `OWN_AUTH_TOKEN_PEPPER`, configure `DATABASE_URL`, and add the
server-only Delivery key created in the Own Auth dashboard as
`OWN_AUTH_EMAIL_DELIVERY_KEY`.

Create the Own Auth tables:

```bash
npm run auth:migrate
npm run auth:status
```

Start Express and Vite:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Vite proxies `/api` to
Express on port `3001`, so authentication cookies remain same-origin in the
browser.

## Production

Build the React client:

```bash
npm run build
```

Start Express:

```bash
npm start
```

In production, Express serves the compiled client from `dist/client` and
handles the application and auth APIs from the same origin.

Set `OWN_AUTH_APP_URL` to the exact public browser origin. Configure Express's
`trust proxy` only for infrastructure you actually control. The starter leaves
it disabled, so arbitrary forwarding headers are not trusted.

## Configure Delivery and hosted links

In the Own Auth dashboard:

1. Create or select a Delivery app.
2. Create a key and save it as `OWN_AUTH_EMAIL_DELIVERY_KEY`.
3. Select either **My URLs** or **Own Auth hosted** link mode.
4. For hosted links, set the destination to
   `http://localhost:3000/auth` locally or
   `https://your-app.example.com/auth` in production.
5. Add the application origin to the Delivery app's allowed URLs.

Both delivery modes work without code changes:

- magic links: `/auth/magic` and `/auth/magic-link/verify`
- email verification: `/auth/verify` and `/auth/email/verify`
- password reset: `/auth/reset` and `/auth/password/reset`

The hosted page only forwards the one-time token. Express sends it to the
framework-neutral Own Auth handler, which consumes it and creates or updates
the session.

## Architecture

```text
React client
  -> Vite development proxy / Express production static files
  -> Express adapter
  -> Own Auth Web handler
  -> Own Auth service and repository
  -> PostgreSQL
```

The scoped middleware in `server/auth-routes.ts` keeps the Express integration
thin:

- applies bounded raw-body parsing only inside `/api/auth`
- preserves the original request bytes for Own Auth
- converts Express requests to standard Web `Request` objects
- translates standard Web responses, including multiple cookies, back to Express
- passes Express's resolved IP address and user agent as trusted context
- delegates validation, cookies, CSRF, MFA, and error formatting to Own Auth

Application-specific account endpoints remain outside the auth handler.
Session revocation verifies both the current session and the request origin.

## Tests

Tests use `InMemoryAuthStorage` and a test-only email inbox. They never connect
to PostgreSQL or send real email. The inbox endpoint exists only when
`OWN_AUTH_TEST_MODE=1` outside production.

Install Chromium once:

```bash
npx playwright install chromium
```

Run the suites:

```bash
npm test
npm run test:integration
npm run test:e2e
npm run test:all
```

Coverage includes the Express request/response bridge, secure session cookies,
CSRF rejection, request validation, token replay protection, password flows,
magic links, responsive layout, and password controls.

## Security notes

- Never expose `DATABASE_URL`, `OWN_AUTH_TOKEN_PEPPER`, or
  `OWN_AUTH_EMAIL_DELIVERY_KEY` to the React bundle.
- Never enable `OWN_AUTH_TEST_MODE` in production.
- Never log passwords, session cookies, delivery keys, or complete email links.
- Run migrations as a release step rather than at application startup.
- Use HTTPS in production so session cookies receive the `Secure` attribute.
- Keep provider calls behind Own Auth provider interfaces.

See the [Own Auth documentation](https://own-auth.com/docs) for migrations,
providers, organizations, OAuth, MFA, and deployment guidance.
