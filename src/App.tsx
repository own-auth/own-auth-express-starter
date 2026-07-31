import { useEffect } from "react";

import { Layout } from "@/components/Layout";
import { useRouter } from "@/lib/router";
import { AccountPage } from "@/pages/AccountPage";
import { AuthPage } from "@/pages/AuthPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { MagicLinkPage } from "@/pages/MagicLinkPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { TokenVerificationPage } from "@/pages/TokenVerificationPage";

export function App() {
  const { navigate, pathname } = useRouter();
  const page = route(pathname);

  useEffect(() => {
    if (!page) navigate("/sign-in", { replace: true });
  }, [navigate, page]);

  return <Layout>{page ?? null}</Layout>;
}

function route(pathname: string) {
  if (pathname === "/sign-in") return <AuthPage mode="sign-in" />;
  if (pathname === "/sign-up") return <AuthPage mode="sign-up" />;
  if (pathname === "/magic-link") return <MagicLinkPage />;
  if (pathname === "/forgot-password") return <ForgotPasswordPage />;
  if (pathname === "/account") return <AccountPage />;
  if (
    pathname === "/auth/magic" ||
    pathname === "/auth/magic-link/verify"
  ) {
    return <TokenVerificationPage kind="magic" />;
  }
  if (
    pathname === "/auth/verify" ||
    pathname === "/auth/email/verify"
  ) {
    return <TokenVerificationPage kind="verification" />;
  }
  if (
    pathname === "/auth/reset" ||
    pathname === "/auth/password/reset"
  ) {
    return <ResetPasswordPage />;
  }
  return null;
}
