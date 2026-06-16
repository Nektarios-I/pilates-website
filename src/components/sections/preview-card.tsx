import { ButtonLink } from "@/components/ui/button-link";

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
};

export function PreviewCard({ title, description, eyebrow, meta, cta }: PreviewCardProps) {
  return (
    <article className="flex h-full flex-col rounded-md border border-border bg-surface p-6">
      <div className="flex-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-3 text-xl font-semibold tracking-normal text-stone-950">{title}</h3>
        {meta ? <p className="mt-2 text-sm font-medium text-stone-600">{meta}</p> : null}
        <p className="mt-4 text-sm leading-6 text-stone-700">{description}</p>
      </div>
      {cta ? (
        <div className="mt-6">
          <ButtonLink href={cta.href} variant="secondary">
            {cta.label}
          </ButtonLink>
        </div>
      ) : null}
    </article>
  );
}

type PreviewCardGridProps = {
  items: readonly PreviewCardProps[];
};

export function PreviewCardGrid({ items }: PreviewCardGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <PreviewCard key={`${item.title}-${item.description}`} {...item} />
      ))}
    </div>
  );
}
