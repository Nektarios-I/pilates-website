import Link from "next/link";

import { StudioLogo } from "@/components/layout/studio-logo";
import { Container } from "@/components/ui/container";
import { site_content } from "@/config/site_content";

export function SiteFooter() {
  const { footer_content } = site_content;

  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <Container className="py-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <StudioLogo />
            <p className="mt-3 text-sm leading-6 text-stone-600">{footer_content.brand_line}</p>
            {footer_content.social_links.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-4">
                {footer_content.social_links.map((link) => (
                  <Link
                    key={link.href}
                    className="text-sm text-stone-600 transition-colors hover:text-stone-950"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {footer_content.navigation_groups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-stone-950">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}`}>
                    <Link
                      className="text-sm text-stone-600 transition-colors hover:text-stone-950"
                      href={link.href}
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
          <p className="text-sm text-stone-600">
            © {new Date().getFullYear()} corehouse Pilates Studio
          </p>
        </div>
      </Container>
    </footer>
  );
}
