import type { Metadata } from 'next';

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

const neutralSwatches: Swatch[] = [
  {
    token: 'color-neutral-0',
    value: '#ffffff',
    note: 'Pure white; use sparingly',
    className: 'bg-white text-stone-950',
  },
  {
    token: 'color-neutral-50',
    value: '#fffaf5',
    note: 'Off-white base; page background',
    className: 'bg-[#fffaf5] text-stone-950',
  },
  {
    token: 'color-neutral-100',
    value: '#fef9f3',
    note: 'Warm off-white; card background',
    className: 'bg-[#fef9f3] text-stone-950',
  },
  {
    token: 'color-neutral-200',
    value: '#f8f4f0',
    note: 'Light surface; hover states',
    className: 'bg-[#f8f4f0] text-stone-950',
  },
  {
    token: 'color-neutral-300',
    value: '#e8e2da',
    note: 'Divider, border',
    className: 'bg-[#e8e2da] text-stone-950',
  },
  {
    token: 'color-neutral-400',
    value: '#d4cfc6',
    note: 'Disabled text, subtle accent',
    className: 'bg-[#d4cfc6] text-stone-950',
  },
  {
    token: 'color-neutral-500',
    value: '#a89080',
    note: 'Secondary text, muted elements',
    className: 'bg-[#a89080] text-white',
  },
  {
    token: 'color-neutral-600',
    value: '#8b7d76',
    note: 'Body text variant',
    className: 'bg-[#8b7d76] text-white',
  },
  {
    token: 'color-neutral-700',
    value: '#6b6360',
    note: 'Strong secondary text',
    className: 'bg-[#6b6360] text-white',
  },
  {
    token: 'color-neutral-800',
    value: '#3d3a35',
    note: 'Near-black; text on light backgrounds',
    className: 'bg-[#3d3a35] text-white',
  },
  {
    token: 'color-neutral-900',
    value: '#2a2420',
    note: 'True dark; headings, high-contrast text',
    className: 'bg-[#2a2420] text-white',
  },
];

const accentSwatches: Swatch[] = [
  {
    token: 'color-accent-50',
    value: '#fef4ed',
    note: 'Very light accent background',
    className: 'bg-[#fef4ed] text-stone-950',
  },
  {
    token: 'color-accent-100',
    value: '#fadec8',
    note: 'Light accent background',
    className: 'bg-[#fadec8] text-stone-950',
  },
  {
    token: 'color-accent-200',
    value: '#f4c9a8',
    note: 'Softest accent',
    className: 'bg-[#f4c9a8] text-stone-950',
  },
  {
    token: 'color-accent-300',
    value: '#daa968',
    note: 'Warm accent; hover state for secondary elements',
    className: 'bg-[#daa968] text-stone-950',
  },
  {
    token: 'color-accent-400',
    value: '#c9a878',
    note: 'Primary accent; secondary CTAs, badges',
    className: 'bg-[#c9a878] text-stone-950',
  },
  {
    token: 'color-accent-500',
    value: '#b8945a',
    note: 'Slightly darker accent',
    className: 'bg-[#b8945a] text-white',
  },
  {
    token: 'color-accent-600',
    value: '#a39079',
    note: 'Muted accent; icons and subtle emphasis',
    className: 'bg-[#a39079] text-white',
  },
];

const semanticSwatches: Array<{ name: string; items: Swatch[] }> = [
  {
    name: 'Success',
    items: [
      {
        token: 'color-success-light',
        value: '#e8f5e9',
        note: 'Success background',
        className: 'bg-[#e8f5e9] text-stone-950',
      },
      {
        token: 'color-success-main',
        value: '#66bb6a',
        note: 'Success indicator',
        className: 'bg-[#66bb6a] text-white',
      },
      {
        token: 'color-success-dark',
        value: '#43a047',
        note: 'Success text',
        className: 'bg-[#43a047] text-white',
      },
    ],
  },
  {
    name: 'Warning',
    items: [
      {
        token: 'color-warning-light',
        value: '#fff3e0',
        note: 'Warning background',
        className: 'bg-[#fff3e0] text-stone-950',
      },
      {
        token: 'color-warning-main',
        value: '#ffa726',
        note: 'Warning indicator',
        className: 'bg-[#ffa726] text-stone-950',
      },
      {
        token: 'color-warning-dark',
        value: '#f57c00',
        note: 'Warning text',
        className: 'bg-[#f57c00] text-white',
      },
    ],
  },
  {
    name: 'Error',
    items: [
      {
        token: 'color-error-light',
        value: '#ffebee',
        note: 'Error background',
        className: 'bg-[#ffebee] text-stone-950',
      },
      {
        token: 'color-error-main',
        value: '#ef5350',
        note: 'Error indicator',
        className: 'bg-[#ef5350] text-white',
      },
      {
        token: 'color-error-dark',
        value: '#c62828',
        note: 'Error text',
        className: 'bg-[#c62828] text-white',
      },
    ],
  },
  {
    name: 'Info',
    items: [
      {
        token: 'color-info-light',
        value: '#e3f2fd',
        note: 'Info background',
        className: 'bg-[#e3f2fd] text-stone-950',
      },
      {
        token: 'color-info-main',
        value: '#42a5f5',
        note: 'Info indicator',
        className: 'bg-[#42a5f5] text-white',
      },
      {
        token: 'color-info-dark',
        value: '#1565c0',
        note: 'Info text',
        className: 'bg-[#1565c0] text-white',
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
    className: 'border-stone-300 bg-[#fef9f3]',
  },
  {
    title: 'Surface elevated',
    note: 'Slightly lifted surface for featured content.',
    className: 'border-transparent bg-white shadow-sm',
  },
  {
    title: 'Surface overlay',
    note: 'Overlay or modal-like treatment with stronger elevation.',
    className: 'border-stone-300 bg-white shadow-lg',
  },
  {
    title: 'Surface accent',
    note: 'Highlighted surface for tonal emphasis.',
    className: 'border-[#f4c9a8] bg-[#fef4ed]',
  },
  {
    title: 'Surface disabled',
    note: 'Muted surface for non-interactive states.',
    className: 'border-stone-200 bg-stone-100 opacity-70',
  },
] as const;

const buttonSamples = [
  {
    title: 'Primary',
    note: 'Filled CTA with strong contrast.',
    className: 'border-stone-950 bg-stone-950 text-white',
  },
  {
    title: 'Secondary',
    note: 'Outlined or softer CTA.',
    className: 'border-stone-300 bg-white text-stone-950',
  },
  {
    title: 'Ghost',
    note: 'Minimal emphasis for lower-priority actions.',
    className:
      'border-transparent bg-transparent text-stone-950 underline-offset-4 hover:underline',
  },
  {
    title: 'Disabled',
    note: 'Muted and non-interactive.',
    className: 'border-stone-200 bg-stone-100 text-stone-400',
  },
] as const;

const cardSamples = [
  {
    title: 'Default card',
    note: 'Standard content container with clear hierarchy.',
    className: 'border-stone-300 bg-[#fef9f3]',
  },
  {
    title: 'Elevated card',
    note: 'Used when the surface needs extra emphasis.',
    className: 'border-transparent bg-white shadow-md',
  },
  {
    title: 'Accent card',
    note: 'Tonal treatment for a highlighted block.',
    className: 'border-[#f4c9a8] bg-[#fef4ed]',
  },
] as const;

const badgeSamples = [
  { title: 'Default', className: 'bg-[#fef4ed] text-[#8b7d76]' },
  { title: 'Success', className: 'bg-[#e8f5e9] text-[#43a047]' },
  { title: 'Warning', className: 'bg-[#fff3e0] text-[#f57c00]' },
  { title: 'Error', className: 'bg-[#ffebee] text-[#c62828]' },
  { title: 'Info', className: 'bg-[#e3f2fd] text-[#1565c0]' },
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
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">{title}</h2>
      <p className="text-sm leading-7 text-stone-600 sm:text-base">{description}</p>
    </div>
  );
}

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.token}
          className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
        >
          <div className={`flex min-h-28 items-end justify-between p-4 ${item.className}`}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">{item.token}</span>
            <span className="text-xs font-medium">{item.value}</span>
          </div>
          <div className="space-y-1 p-4">
            <p className="text-sm font-semibold text-stone-950">{item.token}</p>
            <p className="text-sm text-stone-600">{item.note}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function DesignShowcasePage() {
  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(254,249,243,0.95),_rgba(255,255,255,1)_55%,_rgba(248,244,240,1))] text-stone-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom_right,rgba(201,168,120,0.08),transparent_35%,rgba(139,125,118,0.05)_75%,transparent)]"
      />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white/85 shadow-sm backdrop-blur-sm">
          <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:p-10">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
                  Internal sandbox
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
                  Noindex
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1">
                  Theme-ready
                </span>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-stone-500">
                  Design System Showcase
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
                  Corehouse Pilates Studio token and component sandbox
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                  This internal page validates the current token model, theme readiness, and core
                  component patterns before the design system is rolled into the rest of the site.
                </p>
              </div>
            </div>

            <aside className="grid gap-3 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
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

          <div className="grid gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-2 xl:grid-cols-3">
            {typographySamples.map((sample) => (
              <div
                key={sample.label}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {sample.label} · {sample.token}
                </p>
                <p
                  className="mt-3 text-stone-950"
                  style={{ fontSize: sample.value.split(' /')[0] }}
                >
                  Sample text for {sample.label}
                </p>
                <p className="mt-2 text-xs text-stone-600">{sample.value}</p>
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

          <div className="space-y-8 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-stone-950">Neutral foundation</h3>
              <SwatchGrid items={neutralSwatches} />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-stone-950">Accent foundation</h3>
              <SwatchGrid items={accentSwatches} />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-stone-950">Semantic states</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {semanticSwatches.map((group) => (
                  <article
                    key={group.name}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  >
                    <p className="text-sm font-semibold text-stone-950">{group.name}</p>
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
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
              <p className="font-semibold text-stone-950">Theme readiness</p>
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
                <p className="text-sm font-semibold text-stone-950">{surface.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{surface.note}</p>
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

          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              {buttonSamples.map((button) => (
                <button
                  key={button.title}
                  type="button"
                  className={`rounded-md border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${button.className}`}
                  disabled={button.title === 'Disabled'}
                >
                  {button.title}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-2 lg:grid-cols-4">
              {buttonSamples.map((button) => (
                <div
                  key={`${button.title}-note`}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <p className="font-semibold text-stone-950">{button.title}</p>
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

          <div className="grid gap-4 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <label
                className="block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500"
                htmlFor="design-email"
              >
                Email address
              </label>
              <input
                id="design-email"
                className="mt-3 w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-stone-950 shadow-sm outline-none transition focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
                placeholder="hello@example.com"
                type="email"
              />
              <p className="mt-2 text-sm text-stone-600">
                Helper text uses the caption scale and remains intentionally plain.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Disabled example
              </label>
              <input
                className="mt-3 w-full rounded-md border border-stone-200 bg-stone-100 px-4 py-3 text-stone-400"
                disabled
                placeholder="Disabled state"
                type="text"
              />
              <p className="mt-2 text-sm text-stone-600">
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
                <h3 className="text-lg font-semibold text-stone-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{card.note}</p>
                <button
                  type="button"
                  className="mt-4 text-sm font-medium text-stone-950 underline decoration-stone-300 underline-offset-4"
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

          <div className="flex flex-wrap gap-3 rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
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
            <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-stone-950">Spacing scale</h3>
              <div className="mt-4 space-y-3">
                {spacingScale.map(([token, value]) => (
                  <div
                    key={token}
                    className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-stone-950">spacing-{token}</span>
                    <span className="text-stone-600">{value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-stone-950">Radius scale</h3>
              <div className="mt-4 space-y-3">
                {radiusScale.map(([token, value]) => (
                  <div
                    key={token}
                    className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm"
                  >
                    <span
                      className={`h-8 w-12 border border-stone-300 bg-white ${token === 'full' ? 'rounded-full' : token === '2xl' ? 'rounded-[24px]' : token === 'xl' ? 'rounded-2xl' : token === 'lg' ? 'rounded-lg' : token === 'md' ? 'rounded-md' : token === 'sm' ? 'rounded-sm' : 'rounded-none'}`}
                    />
                    <div>
                      <p className="font-medium text-stone-950">radius-{token}</p>
                      <p className="text-stone-600">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-stone-950">Motion scale</h3>
              <div className="mt-4 space-y-3">
                {motionScale.map(([token, value]) => (
                  <div key={token} className="rounded-xl bg-stone-50 px-4 py-3 text-sm">
                    <p className="font-medium text-stone-950">transition-{token}</p>
                    <p className="text-stone-600">{value}</p>
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
            <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-stone-950">Accessibility spot-checks</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-600">
                <li>• Heading hierarchy is visible and sequential.</li>
                <li>• Focus states are visible on interactive elements.</li>
                <li>• Body text remains legible on the light foundation.</li>
                <li>• Controls maintain clear contrast against the page surfaces.</li>
              </ul>
            </article>

            <article className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-stone-950">Theme readiness notes</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-600">
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
