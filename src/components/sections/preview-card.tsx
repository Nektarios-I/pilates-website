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
};

export function PreviewCard({ title, description, eyebrow, meta }: PreviewCardProps) {
  return (
    <article className="flex flex-col bg-[#E8E2D0] rounded-2xl overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-1">
      <div className="w-full aspect-[16/9] bg-[#CDD2C9] rounded-t-2xl overflow-hidden">
        <ImagePlaceholder className="h-full w-full rounded-t-2xl rounded-b-none transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="p-6 md:p-8 flex flex-col gap-3">
        {eyebrow ? (
          <p className="font-sans font-medium text-xs tracking-wide text-[#2D3A1F] opacity-70">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="font-serif font-medium text-xl md:text-2xl leading-normal text-[#2D3A1F] transition-colors group-hover:text-[#B8A678]">
          {title}
        </h3>
        {meta ? (
          <p className="font-sans font-medium text-xs tracking-wide text-[#2D3A1F] opacity-70">
            {meta}
          </p>
        ) : null}
        <p className="font-sans text-sm leading-normal text-[#2D3A1F]">{description}</p>
      </div>
    </article>
  );
}

type PreviewCardGridProps = {
  items: readonly PreviewCardProps[];
};

export function PreviewCardGrid({ items }: PreviewCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {items.map((item) => (
        <PreviewCard key={`${item.title}-${item.description}`} {...item} />
      ))}
    </div>
  );
}
