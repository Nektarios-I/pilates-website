'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { site_content } from '@/config/site_content';

type SiteNavigationProps = {
  label: string;
  className?: string;
  listClassName?: string;
  linkClassName?: string;
  onNavigate?: () => void;
};

const navLinkDefault =
  'font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-80 hover:opacity-100 transition-opacity duration-200';

const navLinkActive =
  "font-sans font-semibold text-[13px] uppercase tracking-widest text-foreground opacity-100 relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-accent after:rounded-full";

export function SiteNavigation({
  label,
  className,
  listClassName,
  linkClassName,
  onNavigate,
}: SiteNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={className}>
      <ul
        className={['hidden md:flex items-center gap-8', listClassName].filter(Boolean).join(' ')}
      >
        {site_content.navigation_items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname != null &&
                (pathname === item.href || pathname.startsWith(`${item.href}/`));

          return (
            <li key={item.href}>
              <Link
                className={[isActive ? navLinkActive : navLinkDefault, linkClassName]
                  .filter(Boolean)
                  .join(' ')}
                href={item.href}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
