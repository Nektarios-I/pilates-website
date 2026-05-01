import { SiteNavigation } from "@/components/layout/site-navigation";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <Container className="flex flex-col gap-5 py-8 text-sm text-stone-600 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-semibold text-stone-950">{siteConfig.name}</p>
          <p className="mt-2">
            Placeholder contact details are used until final studio information is confirmed.
          </p>
        </div>
        <SiteNavigation className="md:flex md:justify-end" label="Footer navigation" />
      </Container>
    </footer>
  );
}
