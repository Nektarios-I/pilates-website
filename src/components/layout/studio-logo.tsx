import Link from 'next/link';

type StudioLogoProps = {
  className?: string;
};

export function StudioLogo({ className }: StudioLogoProps) {
  return (
    <Link
      aria-label="corehouse Pilates Studio home"
      className={className}
      href="/"
    >
      <span className="inline-flex flex-col leading-none">
        <span className="inline-flex items-baseline gap-0.5">
          <span className="text-2xl font-bold tracking-tight text-stone-950">core</span>
          <span className="text-lg font-bold tracking-tight text-stone-950">house</span>
        </span>
        <span className="mt-1 text-[10px] font-medium tracking-[0.22em] text-stone-600">
          PILATES STUDIO
        </span>
      </span>
    </Link>
  );
}
