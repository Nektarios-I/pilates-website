import Link from 'next/link';

import { CorehouseLogo } from '@/components/brand/corehouse-logo';

type StudioLogoProps = {
  className?: string;
};

export function StudioLogo({ className }: StudioLogoProps) {
  return (
    <Link
      aria-label="corehouse Pilates Studio home"
      className={['inline-flex min-h-11 items-center text-foreground', className].filter(Boolean).join(' ')}
      href="/"
    >
      <CorehouseLogo showTagline={false} size="sm" />
    </Link>
  );
}
