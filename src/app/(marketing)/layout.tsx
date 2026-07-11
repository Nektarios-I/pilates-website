import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { LocalBusinessJsonLd } from "@/components/seo/local-business-json-ld";

type MarketingLayoutProps = {
  children: ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <>
      <LocalBusinessJsonLd />
      <PageShell>{children}</PageShell>
    </>
  );
}
