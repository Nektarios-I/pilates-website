import Link from "next/link";

import { SiteNavigation } from "@/components/layout/site-navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { site_content } from "@/config/site_content";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-background">
      <Container className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-base font-semibold tracking-wide text-stone-950" href="/">
          {site_content.studio_info.studio_name}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SiteNavigation label="Primary navigation" />
          <ButtonLink href={site_content.primary_cta.href}>{site_content.primary_cta.label}</ButtonLink>
        </div>
      </Container>
    </header>
  );
}
