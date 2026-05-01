import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";

type MarketingLayoutProps = {
  children: ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return <PageShell>{children}</PageShell>;
}
