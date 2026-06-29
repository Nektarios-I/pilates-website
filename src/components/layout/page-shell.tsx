import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden">{children}</main>
      <SiteFooter />
    </>
  );
}
