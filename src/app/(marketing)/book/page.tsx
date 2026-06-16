import { ButtonLink } from '@/components/ui/button-link';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Book',
  description:
    'Book your Pilates class. Requires an active account and valid package or subscription.',
  path: '/book',
});

export default function BookPage() {
  return (
    <>
      <Section aria-labelledby="book-page-heading" className="bg-background">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Booking
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl"
              id="book-page-heading"
            >
              Book your class
            </h1>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              Book your Pilates class using our online booking system.
            </p>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="booking-requirements-heading" className="bg-muted">
        <Container>
          <div className="mx-auto max-w-2xl">
            <h2
              className="text-2xl font-semibold tracking-normal text-stone-950"
              id="booking-requirements-heading"
            >
              What you need to book
            </h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Account</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  You must have an active account and be signed in to access the booking system.
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">
                  Active package or subscription
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Booking requires an active package with remaining credits or a valid subscription
                  with available appointments.
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-stone-950">Valid eligibility</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  Your account must have remaining credits or valid appointment slots available for
                  the class you wish to book.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="booking-actions-heading" className="bg-background">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-2xl font-semibold tracking-normal text-stone-950"
              id="booking-actions-heading"
            >
              Ready to book?
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-700">
              Sign in to your account to access the booking system, or view our classes and pricing
              if you are new.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href="/login">Sign in to book</ButtonLink>
              <ButtonLink href="/pricing" variant="secondary">
                View pricing
              </ButtonLink>
              <ButtonLink href="/classes" variant="secondary">
                View classes
              </ButtonLink>
            </div>
            {/* TODO: Auth integration milestone
                - Replace /login link with actual auth flow
                - Add auth state check to show/hide sign-in CTA
                - Add booking eligibility check (active package, remaining credits)
                - Wire to real booking system when available
                - Add package credit deduction logic
                - Handle subscription appointment slot validation
            */}
          </div>
        </Container>
      </Section>
    </>
  );
}
