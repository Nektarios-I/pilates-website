import Link from 'next/link';

type StudioLogoProps = {
  className?: string;
};

export function StudioLogo({ className }: StudioLogoProps) {
  return (
    <Link
      aria-label="corehouse Pilates Studio home"
      className={['inline-flex min-h-11 items-center', className].filter(Boolean).join(' ')}
      href="/"
    >
      <span className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F]">
        corehouse
      </span>
    </Link>
  );
}
