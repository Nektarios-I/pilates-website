import Link from "next/link";

import { site_content } from "@/config/site_content";

export function SiteFooter() {
  const { footer_content } = site_content;

  return (
    <footer className="w-full bg-[#2D3A1F] text-[#F4F1E8] pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div>
          <Link
            aria-label="corehouse Pilates Studio home"
            className="inline-flex min-h-11 items-center font-serif font-medium text-xl text-[#F4F1E8]"
            href="/"
          >
            corehouse
          </Link>
          <p className="mt-4 font-sans text-sm leading-normal text-[#F4F1E8]">
            {footer_content.brand_line}
          </p>
          {footer_content.social_links.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-4">
              {footer_content.social_links.map((link) => (
                <Link
                  key={link.href}
                  className="inline-flex min-h-11 items-center font-sans text-sm leading-normal text-[#F4F1E8] hover:text-[#B8A678] transition-colors"
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {footer_content.navigation_groups.map((group) => (
          <div key={group.title}>
            <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#B8A678] mb-4">
              {group.title}
            </p>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.href}`}>
                  <Link
                    className="inline-flex min-h-11 items-center font-sans text-sm leading-normal text-[#F4F1E8] hover:text-[#B8A678] transition-colors"
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

      <div className="max-w-7xl mx-auto border-t border-[#F4F1E8]/20 pt-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mt-8">
        <p className="font-sans text-[11px] opacity-70 text-[#F4F1E8]">
          © {new Date().getFullYear()} corehouse Pilates Studio
        </p>
        {footer_content.legal_links.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {footer_content.legal_links.map((link) => (
              <Link
                key={link.href}
                className="font-sans text-sm leading-normal text-[#F4F1E8] hover:text-[#B8A678] transition-colors"
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
