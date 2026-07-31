import type { ReactNode } from "react";

import { Link } from "@/lib/router";

export function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">
          <span aria-hidden="true">oa</span>
          <strong>Own Auth</strong>
        </Link>
        <nav aria-label="Account">
          <Link to="/account">Account</Link>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
