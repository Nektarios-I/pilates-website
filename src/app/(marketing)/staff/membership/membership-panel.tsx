'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { format_client_label } from '@/features/client-booking-manager/format';
import {
  format_expires_in_days,
  get_effective_package_status,
  get_package_status_label,
  partition_packages_by_lifecycle,
  type EffectivePackageStatus,
} from '@/lib/packages/lifecycle';
import {
  apply_membership,
  deactivate_membership,
  extend_membership_expiry,
  list_user_memberships,
  remove_membership,
  update_membership_credits,
  type ManageableClient,
  type MembershipPackage,
  type UserMembership,
} from './actions';

type MembershipPanelProps = {
  clients: ManageableClient[];
  packages: MembershipPackage[];
};

type MembershipWithLifecycle = UserMembership & {
  effective_status: EffectivePackageStatus;
};

function to_date_input_value(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function default_extend_date(days = 30): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function format_date_label(iso: string | null): string {
  if (!iso) return 'No expiry';
  return new Date(iso).toLocaleDateString('en-GB');
}

export function MembershipPanel({ clients, packages }: MembershipPanelProps) {
  const router = useRouter();
  const [selected_user_id, set_selected_user_id] = useState('');
  const [memberships, set_memberships] = useState<UserMembership[]>([]);
  const [selected_package_id, set_selected_package_id] = useState('');
  const [loading_memberships, set_loading_memberships] = useState(false);
  const [error, set_error] = useState('');
  const [message, set_message] = useState('');
  const [credit_inputs, set_credit_inputs] = useState<Record<string, string>>({});
  const [expiry_inputs, set_expiry_inputs] = useState<Record<string, string>>({});
  const [open_groups, set_open_groups] = useState({
    active: true,
    expired: false,
    exhausted: false,
    cancelled: false,
  });
  const [is_pending, start_transition] = useTransition();

  const selected_client = clients.find((client) => client.id === selected_user_id) ?? null;

  const partitioned = useMemo(() => {
    const with_lifecycle: MembershipWithLifecycle[] = memberships.map((row) => ({
      ...row,
      effective_status: get_effective_package_status(row),
    }));
    return partition_packages_by_lifecycle(with_lifecycle);
  }, [memberships]);

  async function load_memberships_for_user(user_id: string) {
    set_loading_memberships(true);
    set_error('');
    set_message('');

    const rows = await list_user_memberships(user_id);
    set_memberships(rows);
    set_credit_inputs(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          row.credits_remaining === null ? '' : String(row.credits_remaining),
        ]),
      ),
    );
    set_expiry_inputs(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          to_date_input_value(row.expires_at) || default_extend_date(),
        ]),
      ),
    );
    set_loading_memberships(false);
  }

  function handle_client_change(user_id: string) {
    set_selected_user_id(user_id);
    if (!user_id) {
      set_memberships([]);
      set_credit_inputs({});
      set_expiry_inputs({});
      return;
    }

    void load_memberships_for_user(user_id);
  }

  function refresh_memberships(user_id: string) {
    void load_memberships_for_user(user_id).then(() => {
      router.refresh();
    });
  }

  function handle_apply() {
    if (!selected_user_id || !selected_package_id) return;

    start_transition(async () => {
      set_error('');
      set_message('');
      const result = await apply_membership(selected_user_id, selected_package_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_selected_package_id('');
      set_message('Package applied.');
      refresh_memberships(selected_user_id);
    });
  }

  function handle_deactivate(user_package_id: string) {
    if (!selected_user_id) return;

    start_transition(async () => {
      set_error('');
      set_message('');
      const result = await deactivate_membership(user_package_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_message('Package deactivated.');
      refresh_memberships(selected_user_id);
    });
  }

  function handle_remove(user_package_id: string, package_name: string) {
    if (!selected_user_id) return;

    const confirmed = window.confirm(
      `Permanently remove "${package_name}" from this account? This deletes the package record and cannot be undone.`,
    );
    if (!confirmed) return;

    start_transition(async () => {
      set_error('');
      set_message('');
      const result = await remove_membership(user_package_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_message('Package removed.');
      refresh_memberships(selected_user_id);
    });
  }

  function handle_save_credits(user_package_id: string) {
    if (!selected_user_id) return;

    const raw = credit_inputs[user_package_id]?.trim() ?? '';
    const credits = raw === '' ? null : Number(raw);

    if (raw !== '' && Number.isNaN(credits)) {
      set_error('Enter a valid number of credits, or leave blank for unlimited.');
      return;
    }

    start_transition(async () => {
      set_error('');
      set_message('');
      const result = await update_membership_credits(user_package_id, credits);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_message('Credits updated. Expiry was not changed.');
      refresh_memberships(selected_user_id);
    });
  }

  function handle_extend(user_package_id: string, reactivate: boolean) {
    if (!selected_user_id) return;

    const raw = expiry_inputs[user_package_id]?.trim() ?? '';
    if (!raw) {
      set_error('Choose a new expiry date.');
      return;
    }

    const iso = new Date(`${raw}T23:59:59.000Z`).toISOString();

    start_transition(async () => {
      set_error('');
      set_message('');
      const result = await extend_membership_expiry(user_package_id, iso, {
        reactivate,
        reason: reactivate ? 'extend_and_reactivate' : 'extend_expiry',
      });
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_message(reactivate ? 'Package extended and reactivated.' : 'Expiry extended.');
      refresh_memberships(selected_user_id);
    });
  }

  function toggle_group(key: keyof typeof open_groups) {
    set_open_groups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (clients.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-foreground/60">
        No client accounts are available to manage.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor="membership-client">
          Client account
        </label>
        <select
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          id="membership-client"
          onChange={(event) => handle_client_change(event.target.value)}
          value={selected_user_id}
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {format_client_label(client.full_name, client.email, client.phone)}
            </option>
          ))}
        </select>
      </div>

      {selected_user_id ? (
        <>
          <div className="rounded-md border border-border bg-background p-5">
            <h3 className="text-sm font-semibold text-foreground">Apply package</h3>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground/80" htmlFor="membership-package">
                  Package
                </label>
                <select
                  className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  id="membership-package"
                  onChange={(event) => set_selected_package_id(event.target.value)}
                  value={selected_package_id}
                >
                  <option value="">Select a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} · {pkg.class_type} credits (€{pkg.price.toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full sm:w-auto"
                disabled={!selected_package_id || is_pending}
                onClick={handle_apply}
                type="button"
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Manage packages</h3>
            {loading_memberships ? (
              <p className="text-sm text-foreground/60">Loading packages…</p>
            ) : memberships.length === 0 ? (
              <p className="text-sm text-foreground/60">No packages for this account.</p>
            ) : (
              <>
                <PackageGroup
                  count={partitioned.active.length}
                  default_open
                  is_open={open_groups.active}
                  on_toggle={() => toggle_group('active')}
                  title="Active packages"
                >
                  {partitioned.active.map((membership) => (
                    <MembershipCard
                      key={membership.id}
                      client_label={
                        selected_client
                          ? format_client_label(
                              selected_client.full_name,
                              selected_client.email,
                              selected_client.phone,
                            )
                          : 'Client'
                      }
                      credit_value={credit_inputs[membership.id] ?? ''}
                      expiry_value={expiry_inputs[membership.id] ?? ''}
                      is_pending={is_pending}
                      membership={membership}
                      on_credit_change={(value) =>
                        set_credit_inputs((prev) => ({ ...prev, [membership.id]: value }))
                      }
                      on_deactivate={() => handle_deactivate(membership.id)}
                      on_expiry_change={(value) =>
                        set_expiry_inputs((prev) => ({ ...prev, [membership.id]: value }))
                      }
                      on_extend={() => handle_extend(membership.id, false)}
                      on_reactivate={() => handle_extend(membership.id, true)}
                      on_remove={() => handle_remove(membership.id, membership.package_name)}
                      on_save_credits={() => handle_save_credits(membership.id)}
                      variant="active"
                    />
                  ))}
                </PackageGroup>

                {partitioned.expired.length > 0 ? (
                  <PackageGroup
                    count={partitioned.expired.length}
                    is_open={open_groups.expired}
                    on_toggle={() => toggle_group('expired')}
                    title="Expired packages"
                  >
                    {partitioned.expired.map((membership) => (
                      <MembershipCard
                        key={membership.id}
                        client_label={
                          selected_client
                            ? format_client_label(
                                selected_client.full_name,
                                selected_client.email,
                                selected_client.phone,
                              )
                            : 'Client'
                        }
                        credit_value={credit_inputs[membership.id] ?? ''}
                        expiry_value={expiry_inputs[membership.id] ?? ''}
                        is_pending={is_pending}
                        membership={membership}
                        on_credit_change={(value) =>
                          set_credit_inputs((prev) => ({ ...prev, [membership.id]: value }))
                        }
                        on_deactivate={() => handle_deactivate(membership.id)}
                        on_expiry_change={(value) =>
                          set_expiry_inputs((prev) => ({ ...prev, [membership.id]: value }))
                        }
                        on_extend={() => handle_extend(membership.id, false)}
                        on_reactivate={() => handle_extend(membership.id, true)}
                        on_remove={() => handle_remove(membership.id, membership.package_name)}
                        on_save_credits={() => handle_save_credits(membership.id)}
                        variant="expired"
                      />
                    ))}
                  </PackageGroup>
                ) : null}

                {partitioned.exhausted.length > 0 ? (
                  <PackageGroup
                    count={partitioned.exhausted.length}
                    is_open={open_groups.exhausted}
                    on_toggle={() => toggle_group('exhausted')}
                    title="Exhausted packages"
                  >
                    {partitioned.exhausted.map((membership) => (
                      <MembershipCard
                        key={membership.id}
                        client_label={
                          selected_client
                            ? format_client_label(
                                selected_client.full_name,
                                selected_client.email,
                                selected_client.phone,
                              )
                            : 'Client'
                        }
                        credit_value={credit_inputs[membership.id] ?? ''}
                        expiry_value={expiry_inputs[membership.id] ?? ''}
                        is_pending={is_pending}
                        membership={membership}
                        on_credit_change={(value) =>
                          set_credit_inputs((prev) => ({ ...prev, [membership.id]: value }))
                        }
                        on_deactivate={() => handle_deactivate(membership.id)}
                        on_expiry_change={(value) =>
                          set_expiry_inputs((prev) => ({ ...prev, [membership.id]: value }))
                        }
                        on_extend={() => handle_extend(membership.id, false)}
                        on_reactivate={() => handle_extend(membership.id, true)}
                        on_remove={() => handle_remove(membership.id, membership.package_name)}
                        on_save_credits={() => handle_save_credits(membership.id)}
                        variant="exhausted"
                      />
                    ))}
                  </PackageGroup>
                ) : null}

                {partitioned.cancelled.length > 0 ? (
                  <PackageGroup
                    count={partitioned.cancelled.length}
                    is_open={open_groups.cancelled}
                    on_toggle={() => toggle_group('cancelled')}
                    title="Cancelled packages"
                  >
                    {partitioned.cancelled.map((membership) => (
                      <MembershipCard
                        key={membership.id}
                        client_label={
                          selected_client
                            ? format_client_label(
                                selected_client.full_name,
                                selected_client.email,
                                selected_client.phone,
                              )
                            : 'Client'
                        }
                        credit_value={credit_inputs[membership.id] ?? ''}
                        expiry_value={expiry_inputs[membership.id] ?? ''}
                        is_pending={is_pending}
                        membership={membership}
                        on_credit_change={(value) =>
                          set_credit_inputs((prev) => ({ ...prev, [membership.id]: value }))
                        }
                        on_deactivate={() => handle_deactivate(membership.id)}
                        on_expiry_change={(value) =>
                          set_expiry_inputs((prev) => ({ ...prev, [membership.id]: value }))
                        }
                        on_extend={() => handle_extend(membership.id, false)}
                        on_reactivate={() => handle_extend(membership.id, true)}
                        on_remove={() => handle_remove(membership.id, membership.package_name)}
                        on_save_credits={() => handle_save_credits(membership.id)}
                        variant="cancelled"
                      />
                    ))}
                  </PackageGroup>
                ) : null}
              </>
            )}
          </div>
        </>
      ) : null}

      {message ? <p className="text-sm text-foreground/80">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

type PackageGroupProps = {
  title: string;
  count: number;
  is_open: boolean;
  default_open?: boolean;
  on_toggle: () => void;
  children: ReactNode;
};

function PackageGroup({ title, count, is_open, on_toggle, children }: PackageGroupProps) {
  const panel_id = `${title.toLowerCase().replace(/\s+/g, '-')}-panel`;

  return (
    <div className="rounded-md border border-border bg-background">
      <button
        aria-controls={panel_id}
        aria-expanded={is_open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-5 py-3 text-left"
        onClick={on_toggle}
        type="button"
      >
        <span className="text-sm font-semibold text-foreground">
          {title} ({count})
        </span>
        <span aria-hidden="true" className="text-foreground/50">
          {is_open ? '−' : '+'}
        </span>
      </button>
      {is_open ? (
        <div className="space-y-3 border-t border-border px-5 py-4" id={panel_id}>
          {count === 0 ? (
            <p className="text-sm text-foreground/60">No packages in this group.</p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </div>
  );
}

type MembershipCardProps = {
  membership: MembershipWithLifecycle;
  client_label: string;
  variant: 'active' | 'expired' | 'exhausted' | 'cancelled';
  credit_value: string;
  expiry_value: string;
  is_pending: boolean;
  on_credit_change: (value: string) => void;
  on_expiry_change: (value: string) => void;
  on_save_credits: () => void;
  on_extend: () => void;
  on_reactivate: () => void;
  on_deactivate: () => void;
  on_remove: () => void;
};

function MembershipCard({
  membership,
  client_label,
  variant,
  credit_value,
  expiry_value,
  is_pending,
  on_credit_change,
  on_expiry_change,
  on_save_credits,
  on_extend,
  on_reactivate,
  on_deactivate,
  on_remove,
}: MembershipCardProps) {
  const expires_in =
    membership.effective_status === 'expiring_soon'
      ? format_expires_in_days(membership.expires_at)
      : null;

  return (
    <div className="rounded-md border border-border/70 bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{membership.package_name}</p>
          <p className="mt-1 text-xs text-foreground/60">{client_label}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground/60">
            {membership.class_type} credits
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            {get_package_status_label(membership.effective_status)}
            {membership.expires_at
              ? ` · ${variant === 'expired' ? 'Expired' : 'Expires'} ${format_date_label(membership.expires_at)}`
              : ''}
            {expires_in ? ` · ${expires_in}` : ''}
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            {membership.credits_remaining === null
              ? 'Unlimited credits'
              : `${membership.credits_remaining} credit${membership.credits_remaining === 1 ? '' : 's'} remaining`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {variant === 'active' ? (
            <Button
              className="w-full sm:w-auto"
              disabled={is_pending}
              onClick={on_deactivate}
              type="button"
              variant="secondary"
            >
              Deactivate
            </Button>
          ) : null}
          <Button
            className="w-full border-danger text-danger-foreground hover:bg-danger/10 sm:w-auto"
            disabled={is_pending}
            onClick={on_remove}
            type="button"
            variant="secondary"
          >
            Remove
          </Button>
        </div>
      </div>

      {variant !== 'cancelled' ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              className="block text-sm font-medium text-foreground/80"
              htmlFor={`credits-${membership.id}`}
            >
              Remaining {membership.class_type} credits
            </label>
            <input
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              id={`credits-${membership.id}`}
              onChange={(event) => on_credit_change(event.target.value)}
              placeholder="Blank = unlimited"
              type="text"
              value={credit_value}
            />
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={is_pending}
            onClick={on_save_credits}
            type="button"
            variant="secondary"
          >
            Adjust credits
          </Button>
        </div>
      ) : null}

      {variant === 'active' || variant === 'expired' ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              className="block text-sm font-medium text-foreground/80"
              htmlFor={`expiry-${membership.id}`}
            >
              {variant === 'expired' ? 'New expiry date' : 'Extend expiry to'}
            </label>
            <input
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              id={`expiry-${membership.id}`}
              onChange={(event) => on_expiry_change(event.target.value)}
              type="date"
              value={expiry_value}
            />
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={is_pending}
            onClick={variant === 'expired' ? on_reactivate : on_extend}
            type="button"
          >
            {variant === 'expired' ? 'Extend & reactivate' : 'Extend expiry'}
          </Button>
        </div>
      ) : null}

      {variant === 'expired' ? (
        <p className="mt-3 text-xs text-foreground/60">
          Adjusting credits alone will not make this package bookable. Use Extend & reactivate with a
          future expiry date.
        </p>
      ) : null}
    </div>
  );
}
