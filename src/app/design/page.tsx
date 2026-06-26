import type { Metadata } from 'next';

import { ThemeTokenSwatches } from '@/components/design/theme-token-swatches';

type Swatch = {
  token: string;
  value: string;
  note: string;
  className: string;
};

type SampleLabel = {
  label: string;
  token: string;
  value: string;
};

const semanticSwatches: Array<{ name: string; items: Swatch[] }> = [
  {
    name: 'Success',
    items: [
      {
        token: 'success-surface',
        value: 'globals.css',
        note: 'Success background',
        className: 'bg-success-surface text-success',
      },
      {
        token: 'success',
        value: 'globals.css',
        note: 'Success text',
        className: 'bg-success text-primary-foreground',
      },
    ],
  },
  {
    name: 'Warning',
    items: [
      {
        token: 'warning-surface',
        value: 'globals.css',
        note: 'Warning background',
        className: 'bg-warning-surface text-warning-foreground border border-warning-border',
      },
      {
        token: 'warning',
        value: 'globals.css',
        note: 'Warning emphasis',
        className: 'bg-warning text-primary-foreground',
      },
    ],
  },
  {
    name: 'Error',
    items: [
      {
        token: 'destructive-surface',
        value: 'globals.css',
        note: 'Error background',
        className: 'bg-destructive-surface text-destructive border border-destructive-border',
      },
      {
        token: 'destructive',
        value: 'globals.css',
        note: 'Error emphasis',
        className: 'bg-destructive text-destructive-foreground',
      },
    ],
  },
  {
    name: 'Info',
    items: [
      {
        token: 'info-surface',
        value: 'globals.css',
        note: 'Info background',
        className: 'bg-info-surface text-info',
      },
      {
        token: 'info',
        value: 'globals.css',
        note: 'Info emphasis',
        className: 'bg-info text-primary-foreground',
      },
    ],
  },
];

const typographySamples: SampleLabel[] = [
  { label: 'H1', token: 'text-h1', value: '52px / 600 / 1.1' },
  { label: 'H2', token: 'text-h2', value: '44px / 600 / 1.15' },
  { label: 'H3', token: 'text-h3', value: '32px / 600 / 1.2' },
  { label: 'H4', token: 'text-h4', value: '24px / 600 / 1.25' },
  { label: 'H5', token: 'text-h5', value: '20px / 600 / 1.3' },
  { label: 'H6', token: 'text-h6', value: '18px / 600 / 1.35' },
  { label: 'Body LG', token: 'text-body-lg', value: '18px / 400 / 1.6' },
  { label: 'Body MD', token: 'text-body-md', value: '16px / 400 / 1.6' },
  { label: 'Body SM', token: 'text-body-sm', value: '14px / 400 / 1.5' },
  { label: 'Button', token: 'text-button', value: '16px / 500 / 1.5' },
  { label: 'Label', token: 'text-label', value: '12px / 600 / 1.4' },
  { label: 'Caption', token: 'text-caption', value: '12px / 400 / 1.4' },
];

const surfaceSamples = [
  {
    title: 'Surface default',
    note: 'Base card surface with a border and subtle structure.',
    className: 'border-border bg-surface',
  },
  {
    title: 'Surface elevated',
    note: 'Slightly lifted surface for featured content.',
    className: 'border-transparent bg-background shadow-sm',
  },
  {
    title: 'Surface overlay',
    note: 'Overlay or modal-like treatment with stronger elevation.',
    className: 'border-border bg-background shadow-lg',
  },
  {
    title: 'Surface accent',
    note: 'Highlighted surface for tonal emphasis.',
    className: 'border-accent bg-muted',
  },
  {
    title: 'Surface disabled',
    note: 'Muted surface for non-interactive states.',
    className: 'border-border bg-muted opacity-70',
  },
] as const;

const buttonSamples = [
  {
    title: 'Primary',
    note: 'Filled CTA with strong contrast.',
    className: 'border-0 bg-primary text-primary-foreground',
  },
  {
    title: 'Secondary',
    note: 'Outlined or softer CTA.',
    className: 'border border-border bg-transparent text-foreground',
  },
  {
    title: 'Ghost',
    note: 'Minimal emphasis for lower-priority actions.',
    className:
      'border-transparent bg-transparent text-foreground border-b border-accent underline-offset-4 hover:underline',
  },
  {
    title: 'Disabled',
    note: 'Muted and non-interactive.',
    className: 'border-border bg-muted text-foreground/50',
  },
] as const;

const cardSamples = [
  {
    title: 'Default card',
    note: 'Standard content container with clear hierarchy.',
    className: 'border-border bg-surface',
  },
  {
    title: 'Elevated card',
    note: 'Used when the surface needs extra emphasis.',
    className: 'border-transparent bg-background shadow-md',
  },
  {
    title: 'Accent card',
    note: 'Tonal treatment for a highlighted block.',
    className: 'border-accent bg-muted',
  },
] as const;

const badgeSamples = [
  { title: 'Default', className: 'bg-muted text-foreground/80' },
  { title: 'Success', className: 'bg-success-surface text-success' },
  { title: 'Warning', className: 'bg-warning-surface text-warning-foreground' },
  { title: 'Error', className: 'bg-destructive-surface text-destructive' },
  { title: 'Info', className: 'bg-info-surface text-info' },
] as const;

const spacingScale = [
  ['xs', '4px'],
  ['sm', '8px'],
  ['md', '16px'],
  ['lg', '24px'],
  ['xl', '32px'],
  ['2xl', '48px'],
  ['3xl', '64px'],
  ['4xl', '80px'],
  ['5xl', '96px'],
  ['6xl', '128px'],
] as const;

const radiusScale = [
  ['none', '0px'],
  ['sm', '4px'],
  ['md', '8px'],
  ['lg', '12px'],
  ['xl', '16px'],
  ['2xl', '24px'],
  ['full', '9999px'],
] as const;

const motionScale = [
  ['fast', '150ms ease-in-out'],
  ['base', '200ms ease-in-out'],
  ['standard', '300ms ease-in-out'],
  ['slow', '400ms ease-in-out'],
] as const;

export const metadata: Metadata = {
  title: 'Design System Showcase',
  description:
    'Internal Corehouse Pilates Studio sandbox for token, surface, and component validation.',
  alternates: {
    canonical: '/design',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      <p className="text-sm leading-7 text-foreground/70 sm:text-base">{description}</p>
    </div>
  );
}

export default function DesignShowcasePage() {
  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-transparent to-foreground/5"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-background/85 shadow-sm backdrop-blur-sm">
          <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:p-10">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">
                <span className="rounded-full border border-border bg-surface px-3 py-1">
                  Internal sandbox
                </span>
                <span className="rounded-full border border-border bg-surface px-3 py-1">
                  Noindex
                </span>
                <span className="rounded-full border border-border bg-surface px-3 py-1">
                  Theme-ready
                </span>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-foreground/60">
                  Design System Showcase
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Corehouse Pilates Studio token and component sandbox
                </h1>
                <p className="max-w-2xl text-base leading-8 text-foreground/70 sm:text-lg">
                  This internal page validates the current token model, theme readiness, and core
                  component patterns before the design system is rolled into the rest of the site.
                </p>
              </div>
            </div>

            <aside className="grid gap-3 rounded-[1.5rem] border border-border bg-surface p-5 text-sm text-foreground/80">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
                Review notes
              </p>
              <p>
                Use this page to compare values visually, not to finalize copy or production
                messaging.
              </p>
              <p>
                Light-first is acceptable, but the structure should remain ready for a future dark
                theme mapping.
              </p>
              <p>All examples use placeholder content or token labels only.</p>
            </aside>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="01 / Typography"
            title="Typographic scale"
            description="Show each text style at its actual scale so spacing, weight, and hierarchy can be reviewed without context switching."
          />

          <div className="grid gap-4 rounded-[1.5rem] border border-border bg-background p-6 shadow-sm lg:grid-cols-2 xl:grid-cols-3">
            {typographySamples.map((sample) => (
              <div
                key={sample.label}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
                  {sample.label} · {sample.token}
                </p>
                <p
                  className="mt-3 text-foreground"
                  style={{ fontSize: sample.value.split(' /')[0] }}
                >
                  Sample text for {sample.label}
                </p>
                <p className="mt-2 text-xs text-foreground/70">{sample.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="02 / Color"
            title="Core, semantic, and theme tokens"
            description="Display the current candidate palette, semantic aliases, and a clear note that theme structure is ready even if only light is rendered first."
          />

          <div className="space-y-8 rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Active site tokens</h3>
              <p className="text-sm text-foreground/70">
                Values are read live from <code className="font-mono">src/app/globals.css</code>.
                Edit the CSS variables there to preview palette changes across the marketing site.
              </p>
              <ThemeTokenSwatches />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Semantic states</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {semanticSwatches.map((group) => (
                  <article
                    key={group.name}
                    className="rounded-2xl border border-border bg-surface p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{group.name}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {group.items.map((item) => (
                        <div key={item.token} className={`rounded-xl px-3 py-4 ${item.className}`}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                            {item.token}
                          </p>
                          <p className="mt-2 text-xs">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-foreground/80">
              <p className="font-semibold text-foreground">Theme readiness</p>
              <p className="mt-2">
                Semantic token names stay stable across light and future dark mappings. This page
                should help verify that structure rather than forcing a final visual mode decision.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="03 / Surfaces"
            title="Surface hierarchy"
            description="Compare the main surface treatments that the system will reuse across pages and future components."
          />

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {surfaceSamples.map((surface) => (
              <article
                key={surface.title}
                className={`rounded-[1.5rem] border p-5 shadow-sm ${surface.className}`}
              >
                <p className="text-sm font-semibold text-foreground">{surface.title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/70">{surface.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="04 / Actions"
            title="Button tokens"
            description="Show the primary, secondary, and ghost action tokens in a form that makes hierarchy and contrast easy to compare."
          />

          <div className="rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              {buttonSamples.map((button) => (
                <button
                  key={button.title}
                  type="button"
                  className={`rounded-md border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${button.className}`}
                  disabled={button.title === 'Disabled'}
                >
                  {button.title}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-foreground/70 sm:grid-cols-2 lg:grid-cols-4">
              {buttonSamples.map((button) => (
                <div
                  key={`${button.title}-note`}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <p className="font-semibold text-foreground">{button.title}</p>
                  <p className="mt-1">{button.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="05 / Fields"
            title="Form tokens"
            description="Display a small, reusable input pattern and keep validation light until the form inventory is finalized."
          />

          <div className="grid gap-4 rounded-[1.5rem] border border-border bg-background p-6 shadow-sm lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60"
                htmlFor="design-email"
              >
                Email address
              </label>
              <input
                id="design-email"
                className="mt-3 w-full rounded-md border border-border bg-background px-4 py-3 text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                placeholder="hello@example.com"
                type="email"
              />
              <p className="mt-2 text-sm text-foreground/70">
                Helper text uses the caption scale and remains intentionally plain.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
                Disabled example
              </label>
              <input
                className="mt-3 w-full rounded-md border border-border bg-muted px-4 py-3 text-foreground/50"
                disabled
                placeholder="Disabled state"
                type="text"
              />
              <p className="mt-2 text-sm text-foreground/70">
                Use the disabled state as a non-interactive reference only.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="06 / Cards"
            title="Card treatments"
            description="Use cards to compare surface elevation and tonal treatment without introducing business content."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {cardSamples.map((card) => (
              <article
                key={card.title}
                className={`rounded-[1.5rem] border p-5 shadow-sm ${card.className}`}
              >
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground/70">{card.note}</p>
                <button
                  type="button"
                  className="mt-4 text-sm font-medium text-foreground underline decoration-border underline-offset-4"
                >
                  Sample link
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="07 / Badges"
            title="Badge tokens"
            description="Display the small pill styles used for status, labels, and optional semantic signaling."
          />

          <div className="flex flex-wrap gap-3 rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
            {badgeSamples.map((badge) => (
              <span
                key={badge.title}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badge.className}`}
              >
                {badge.title}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="08 / Layout"
            title="Spacing, radius, and motion"
            description="Show the values that determine rhythm and shape so the system can be reviewed before components are expanded."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Spacing scale</h3>
              <div className="mt-4 space-y-3">
                {spacingScale.map(([token, value]) => (
                  <div
                    key={token}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-foreground">spacing-{token}</span>
                    <span className="text-foreground/70">{value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Radius scale</h3>
              <div className="mt-4 space-y-3">
                {radiusScale.map(([token, value]) => (
                  <div
                    key={token}
                    className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm"
                  >
                    <span
                      className={`h-8 w-12 border border-border bg-background ${token === 'full' ? 'rounded-full' : token === '2xl' ? 'rounded-[24px]' : token === 'xl' ? 'rounded-2xl' : token === 'lg' ? 'rounded-lg' : token === 'md' ? 'rounded-md' : token === 'sm' ? 'rounded-sm' : 'rounded-none'}`}
                    />
                    <div>
                      <p className="font-medium text-foreground">radius-{token}</p>
                      <p className="text-foreground/70">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Motion scale</h3>
              <div className="mt-4 space-y-3">
                {motionScale.map(([token, value]) => (
                  <div key={token} className="rounded-xl bg-surface px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">transition-{token}</p>
                    <p className="text-foreground/70">{value}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="space-y-6 pb-8">
          <SectionHeading
            eyebrow="09 / Checks"
            title="Accessibility and theme readiness"
            description="The sandbox should make it easy to verify hierarchy, focus, and the ability to adapt to a future theme mapping without redesigning the whole page."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Accessibility spot-checks</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground/70">
                <li>• Heading hierarchy is visible and sequential.</li>
                <li>• Focus states are visible on interactive elements.</li>
                <li>• Body text remains legible on the light foundation.</li>
                <li>• Controls maintain clear contrast against the page surfaces.</li>
              </ul>
            </article>

            <article className="rounded-[1.5rem] border border-border bg-background p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">Theme readiness notes</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground/70">
                <li>• Light theme is shown first, but semantic names stay theme-neutral.</li>
                <li>• Dark theme mapping can be added later without renaming the core system.</li>
                <li>
                  • Component tokens should continue to reference semantic tokens, not raw palette
                  values.
                </li>
                <li>
                  • This page should stay internal and should not be treated as customer-facing
                  content.
                </li>
              </ul>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
