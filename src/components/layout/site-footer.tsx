import Link from "next/link";

import { CorehouseLogo } from "@/components/brand/corehouse-logo";
import { site_content } from "@/config/site_content";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <rect height="18" rx="5" width="18" x="3" y="3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" strokeWidth={2.5} />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function is_instagram_link(href: string, label: string) {
  return label.toLowerCase() === 'instagram' || href.includes('instagram.com');
}

function is_phone_link(href: string) {
  return href.startsWith('tel:');
}

export function SiteFooter() {
  const { footer_content } = site_content;

  return (
    <footer className="w-full max-w-full bg-inverse text-primary-foreground px-4 pt-16 pb-6 md:px-8 md:pt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 mb-10">
        <div>
          <Link
            className="inline-flex min-h-11 items-center text-primary-foreground hover:text-primary-foreground/80 transition-colors duration-200"
            href="/"
          >
            <CorehouseLogo showTagline size="md" />
          </Link>
          {footer_content.social_links.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {footer_content.social_links.map((link) => (
                <Link
                  key={link.href}
                  aria-label={is_instagram_link(link.href, link.label) ? 'Instagram' : link.label}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-primary-foreground hover:text-accent transition-colors duration-200"
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {is_instagram_link(link.href, link.label) ? (
                    <InstagramIcon className="h-5 w-5" />
                  ) : (
                    link.label
                  )}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {footer_content.navigation_groups.map((group) => (
          <div key={group.title}>
            <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-accent mb-3">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.href}`}>
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 font-sans text-sm leading-normal text-primary-foreground hover:text-accent transition-colors duration-200"
                    href={link.href}
                  >
                    {is_phone_link(link.href) ? (
                      <PhoneIcon className="h-4 w-4 shrink-0 opacity-80" />
                    ) : null}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto border-t border-primary-foreground/20 pt-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <p className="font-sans text-[11px] opacity-70 text-primary-foreground">
          © {new Date().getFullYear()} corehouse Pilates Studio
        </p>
        {footer_content.legal_links.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {footer_content.legal_links.map((link) => (
              <Link
                key={link.href}
                className="font-sans text-sm leading-normal text-primary-foreground hover:text-accent transition-colors duration-200"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
