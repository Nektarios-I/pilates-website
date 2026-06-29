type CorehouseLogoSize = 'sm' | 'md';

type CorehouseLogoProps = {
  className?: string;
  showTagline?: boolean;
  size?: CorehouseLogoSize;
};

const size_styles: Record<CorehouseLogoSize, { core: string; tagline: string; tagline_gap: string }> = {
  sm: {
    core: 'text-[1.35rem] md:text-[1.55rem]',
    tagline: 'text-[0.5rem] md:text-[0.5625rem]',
    tagline_gap: 'mt-1',
  },
  md: {
    core: 'text-[1.65rem] md:text-[1.85rem]',
    tagline: 'text-[0.5625rem] md:text-[0.625rem]',
    tagline_gap: 'mt-1.5',
  },
};

export function CorehouseLogo({
  className,
  showTagline = true,
  size = 'md',
}: CorehouseLogoProps) {
  const styles = size_styles[size];

  return (
    <span
      className={['inline-flex flex-col items-start text-current', className].filter(Boolean).join(' ')}
    >
      <span
        className={[
          'inline-flex items-baseline font-serif font-medium leading-none tracking-tight',
          styles.core,
        ].join(' ')}
      >
        <span>core</span>
        <span className="text-[0.5em]">house</span>
      </span>
      {showTagline ? (
        <span
          className={[
            'w-full text-center font-sans font-semibold uppercase tracking-[0.32em] leading-none',
            styles.tagline,
            styles.tagline_gap,
          ].join(' ')}
        >
          Pilates Studio
        </span>
      ) : null}
    </span>
  );
}
