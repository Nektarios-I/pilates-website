import Link from "next/link";

import { Container } from "@/components/ui/container";
import { site_content } from "@/config/site_content";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <Container className="py-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="text-base font-semibold text-stone-950">
              {site_content.studio_info.studio_name}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {site_content.footer_content.brand_line}
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              {site_content.footer_content.social_links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-stone-600 transition-colors hover:text-stone-950"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {site_content.footer_content.navigation_groups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-stone-950">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-600 transition-colors hover:text-stone-950"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-stone-200 pt-6">
          <div className="flex flex-col gap-3 text-sm text-stone-600 sm:flex-row sm:justify-between">
            <p>© {new Date().getFullYear()} {site_content.studio_info.studio_name}</p>
            <div className="flex flex-wrap gap-4">
              {site_content.footer_content.legal_links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-stone-950"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
