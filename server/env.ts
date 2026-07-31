type ServerEnv = Readonly<{
  appUrl: string;
  databaseUrl: string;
  emailDeliveryKey?: string;
  port: number;
  production: boolean;
  testMode: boolean;
  tokenPepper: string;
}>;

let cachedEnv: ServerEnv | undefined;

function requireValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and set it.`);
  }
  return value;
}

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const appUrl = new URL(requireValue("OWN_AUTH_APP_URL"));
  const databaseUrl = requireValue("DATABASE_URL");
  const production = process.env.NODE_ENV === "production";
  const testMode = !production && process.env.OWN_AUTH_TEST_MODE === "1";

  if (!/^postgres(ql)?:\/\//u.test(databaseUrl)) {
    throw new Error("DATABASE_URL must use postgres:// or postgresql://.");
  }
  if (
    appUrl.username ||
    appUrl.password ||
    appUrl.pathname !== "/" ||
    appUrl.search ||
    appUrl.hash ||
    (appUrl.protocol !== "https:" &&
      !(
        appUrl.protocol === "http:" &&
        ["localhost", "127.0.0.1", "::1"].includes(appUrl.hostname)
      ))
  ) {
    throw new Error(
      "OWN_AUTH_APP_URL must be an HTTPS origin or local HTTP origin."
    );
  }

  const port = Number(process.env.PORT ?? (production ? 3000 : 3001));
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  cachedEnv = Object.freeze({
    appUrl: appUrl.origin,
    databaseUrl,
    emailDeliveryKey:
      process.env.OWN_AUTH_EMAIL_DELIVERY_KEY?.trim() || undefined,
    port,
    production,
    testMode,
    tokenPepper: requireValue("OWN_AUTH_TOKEN_PEPPER")
  });
  return cachedEnv;
}
