import {
  createOwnAuth,
  InMemoryAuthStorage,
  OwnAuthManagedEmailProvider,
  type EmailProvider
} from "own-auth";

import { getServerEnv } from "./env.js";
import { testEmailProvider } from "./test-email-provider.js";

const env = getServerEnv();

void env.databaseUrl;

export const auth = createOwnAuth({
  baseUrl: env.appUrl,
  redirectAllowlist: [env.appUrl],
  tokenPepper: env.tokenPepper,
  emailProvider: env.testMode
    ? testEmailProvider
    : createEmailProvider(env.emailDeliveryKey),
  storage: env.testMode ? new InMemoryAuthStorage() : undefined,
  session: {
    ttlMs: 30 * 24 * 60 * 60 * 1000
  },
  tokenTtlMs: {
    email_verification: 24 * 60 * 60 * 1000,
    magic_link: 15 * 60 * 1000,
    password_reset: 60 * 60 * 1000
  }
});

function createEmailProvider(deliveryKey: string | undefined): EmailProvider {
  if (deliveryKey) {
    return new OwnAuthManagedEmailProvider({ deliveryKey });
  }
  return {
    async send(): Promise<void> {
      throw new Error(
        "Email delivery is not configured. Set OWN_AUTH_EMAIL_DELIVERY_KEY."
      );
    }
  };
}
