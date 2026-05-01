import Link from "next/link";

import { SiteNavigation } from "@/components/layout/site-navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-background">
      <Container className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-base font-semibold tracking-wide text-stone-950" href="/">
          {siteConfig.name}
        </Link>
        <div className="flex flex-col gap-4 sm:items-end">
          <SiteNavigation label="Primary navigation" />
          <ButtonLink className="w-fit" href="/contact" variant="secondary">
            Contact
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
