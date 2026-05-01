import Link from "next/link";

import { primaryNavigation } from "@/config/navigation";

type SiteNavigationProps = {
  label: string;
  className?: string;
};

export function SiteNavigation({ label, className }: SiteNavigationProps) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-stone-700">
        {primaryNavigation.map((item) => (
          <li key={item.href}>
            <Link className="transition-colors hover:text-stone-950" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
