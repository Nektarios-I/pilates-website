import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

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
    <Section>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">{description}</p>
          <div className="mt-8">
            <ButtonLink href={nextStep.href}>{nextStep.label}</ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
