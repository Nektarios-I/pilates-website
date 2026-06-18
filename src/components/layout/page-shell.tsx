import type { ReactNode } from "react";
import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteHeaderView } from "@/components/layout/site-header-view";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <>
      <Suspense fallback={<SiteHeaderView auth={{ is_signed_in: false, is_staff: false, is_admin_or_owner: false, display_name: null }} />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
