import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

type PageHeroCta = {
  label: string;
  href: "/" | `/${string}`;
};

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta: PageHeroCta;
  secondaryCta?: PageHeroCta;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: PageHeroProps) {
  return (
    <Section aria-labelledby="home-hero-heading" className="bg-background">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:items-center">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="home-hero-heading"
            >
              {title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
              {secondaryCta ? (
                <ButtonLink href={secondaryCta.href} variant="secondary">
                  {secondaryCta.label}
                </ButtonLink>
              ) : null}
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface p-6">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Homepage shell
            </p>
            <dl className="mt-5 grid gap-4 text-sm text-stone-700">
              <div>
                <dt className="font-semibold text-stone-950">Content status</dt>
                <dd className="mt-1">Final copy, imagery, and business details pending approval.</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-950">Primary path</dt>
                <dd className="mt-1">Contact route first, future booking integration later.</dd>
              </div>
            </dl>
          </div>
        </div>
      </Container>
    </Section>
  );
}
