import { ButtonLink } from "@/components/ui/button-link";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep?: {
    label: string;
    href: string;
  };
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  nextStep = {
    label: "Contact the studio",
    href: "/contact",
  },
}: PagePlaceholderProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <div className="max-w-3xl">
        <p className="font-sans font-semibold text-[13px] uppercase tracking-widest text-[#2D3A1F] opacity-80">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-serif font-semibold text-3xl md:text-5xl leading-tight tracking-tight text-[#2D3A1F]">
          {title}
        </h1>
        <p className="mt-6 font-sans text-lg md:text-xl leading-relaxed text-[#2D3A1F]">
          {description}
        </p>
        <div className="mt-8">
          <ButtonLink href={nextStep.href}>{nextStep.label}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
