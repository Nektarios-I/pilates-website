import { ContentImage } from "@/components/ui/content-image";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

type PreviewCardCta = {
  label: string;
  href: "/" | `/${string}`;
};

type PreviewCardProps = {
  title: string;
  description: string;
  eyebrow?: string;
  meta?: string;
  cta?: PreviewCardCta;
  compact?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  graphicCard?: boolean;
};

export function PreviewCard({
  title,
  description,
  eyebrow,
  meta,
  compact = false,
  imageSrc,
  imageAlt,
  graphicCard = false,
}: PreviewCardProps) {
  return (
    <article className="flex flex-col bg-surface rounded-2xl overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
      <div
        className={[
          'relative w-full bg-surface-2 rounded-t-2xl overflow-hidden',
          graphicCard ? 'aspect-[3/4]' : compact ? 'aspect-[4/3]' : 'aspect-[16/9]',
        ].join(' ')}
      >
        {imageSrc && imageAlt ? (
          <ContentImage
            alt={imageAlt}
            imageClassName={[
              'transition-transform duration-500 group-hover:scale-105',
              graphicCard ? 'object-contain bg-background' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            sizes={compact ? '(max-width: 768px) 100vw, 33vw' : '(max-width: 768px) 100vw, 50vw'}
            src={imageSrc}
          />
        ) : (
          <ImagePlaceholder className="h-full w-full rounded-t-2xl rounded-b-none transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className={compact ? 'p-5 md:p-6 flex flex-col gap-2' : 'p-6 md:p-8 flex flex-col gap-3'}>
        {graphicCard ? (
          <h3 className="sr-only">{title}</h3>
        ) : (
          <>
            {eyebrow ? (
              <p className="font-sans font-medium text-xs tracking-wide text-foreground opacity-70">
                {eyebrow}
              </p>
            ) : null}
            <h3
              className={[
                'font-serif font-medium leading-normal text-foreground transition-colors group-hover:text-accent',
                compact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl',
              ].join(' ')}
            >
              {title}
            </h3>
          </>
        )}
        {meta ? (
          <p className="font-sans font-medium text-xs tracking-wide text-foreground opacity-70">
            {meta}
          </p>
        ) : null}
        <p className={compact ? 'font-sans text-sm leading-snug text-foreground' : 'font-sans text-sm leading-normal text-foreground'}>
          {description}
        </p>
      </div>
    </article>
  );
}

type PreviewCardGridProps = {
  items: readonly PreviewCardProps[];
  columns?: 2 | 3;
};

export function PreviewCardGrid({ items, columns = 2 }: PreviewCardGridProps) {
  const compact = columns === 3;

  return (
    <div
      className={
        columns === 3
          ? 'grid grid-cols-1 md:grid-cols-3 gap-6'
          : 'grid grid-cols-1 md:grid-cols-2 gap-8'
      }
    >
      {items.map((item) => (
        <PreviewCard key={`${item.title}-${item.description}`} compact={compact} {...item} />
      ))}
    </div>
  );
}
