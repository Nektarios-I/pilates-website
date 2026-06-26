export function marketingInputClass(has_error?: boolean): string {
  return [
    'block w-full rounded-md border px-4 py-3 text-base text-foreground placeholder:text-foreground/50 shadow-sm',
    'transition-colors focus:outline-none focus:ring-2',
    has_error
      ? 'border-destructive-border bg-surface focus:border-destructive focus:ring-destructive'
      : 'border-border bg-surface focus:border-accent focus:ring-accent',
  ].join(' ');
}

export const marketingLabelClass = 'block text-sm font-medium text-foreground';

export const marketingHintClass = 'mt-2 text-xs text-foreground/60';

export const marketingTextLinkClass =
  'inline-flex min-h-11 items-center text-sm font-medium text-foreground/80 underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const marketingMutedLinkClass =
  'inline-flex min-h-11 items-center text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const marketingEyebrowClass =
  'text-sm font-medium uppercase tracking-[0.16em] text-foreground/60';

export const marketingPageTitleClass =
  'mt-4 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl';

export const marketingPageIntroClass = 'mt-5 text-base leading-7 text-foreground/80';

export const marketingSectionTitleClass = 'text-xl font-semibold text-foreground';

export const marketingSectionIntroClass = 'mt-1 text-sm text-foreground/70';

export const marketingCardClass = 'rounded-md border border-border bg-surface p-4';

export const marketingEmptyStateClass = 'rounded-md bg-surface p-8 text-center';

export const marketingBadgeClass =
  'inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground/80';

export const marketingIconButtonClass =
  'absolute right-0 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-foreground/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const marketingDividerClass = 'w-full border-t border-border';

export const marketingAlertErrorClass =
  'rounded-md border border-destructive-border bg-destructive-surface p-4 text-sm text-destructive';

export const marketingAlertWarningClass =
  'rounded-md border border-warning-border bg-warning-surface p-6';

export const marketingAlertWarningTitleClass = 'text-sm font-semibold text-warning-foreground';

export const marketingAlertWarningBodyClass = 'mt-1 text-sm text-warning-foreground/90';

export const marketingStaffBackLinkClass =
  'inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground';

export const marketingStaffEyebrowClass =
  'text-sm font-medium uppercase tracking-[0.16em] text-foreground/60';

export const marketingStaffTitleClass = 'mt-2 text-3xl font-semibold text-foreground sm:text-4xl';

export const marketingStaffIntroClass = 'mt-3 text-base leading-7 text-foreground/70';

export const marketingStaffPanelTitleClass = 'text-lg font-semibold text-foreground';

export const marketingStaffSectionTitleClass = 'text-sm font-semibold text-foreground';

export const marketingSelectClass =
  'mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';

export const marketingSelectClassMt2 =
  'mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';

export const marketingCompactInputClass =
  'mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';

export const marketingAlertSuccessClass =
  'rounded-md border border-success-border bg-success-surface p-4 text-sm text-success';

export const marketingSuccessBadgeClass =
  'inline-flex items-center rounded-full bg-success-surface px-2 py-1 text-xs font-medium text-success';

export const marketingInfoBadgeClass =
  'inline-flex items-center rounded-full bg-info-surface px-2 py-1 text-xs font-medium text-info';

export const marketingWarningBadgeClass =
  'inline-flex items-center rounded-full bg-warning-surface px-2 py-1 text-xs font-medium text-warning-foreground';

export const ROLE_BADGE_CLASS: Record<string, string> = {
  admin: 'bg-destructive-surface text-destructive ring-1 ring-destructive-border',
  owner: 'bg-warning-surface text-warning-foreground ring-1 ring-warning-border',
  instructor: 'bg-info-surface text-info ring-1 ring-info-border',
  client: 'bg-muted text-foreground/70 ring-1 ring-border',
};

export const INVITE_PERMISSION_BADGE_CLASS: Record<string, string> = {
  client: 'bg-muted text-foreground/70',
  instructor: 'bg-info-surface text-info border border-info-border',
  owner: 'bg-success-surface text-success border border-success-border',
  admin: 'bg-warning-surface text-warning-foreground border border-warning-border',
};

export function marketingInputClassDisabled(error?: boolean): string {
  return [
    marketingInputClass(error),
    'cursor-not-allowed bg-muted text-foreground/60',
  ].join(' ');
}
