'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { format_client_label } from '@/features/client-booking-manager/format';
import {
  apply_membership,
  deactivate_membership,
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

export function MembershipPanel({ clients, packages }: MembershipPanelProps) {
  const router = useRouter();
  const [selected_user_id, set_selected_user_id] = useState('');
  const [memberships, set_memberships] = useState<UserMembership[]>([]);
  const [selected_package_id, set_selected_package_id] = useState('');
  const [loading_memberships, set_loading_memberships] = useState(false);
  const [error, set_error] = useState('');
  const [credit_inputs, set_credit_inputs] = useState<Record<string, string>>({});
  const [is_pending, start_transition] = useTransition();

  async function load_memberships_for_user(user_id: string) {
    set_loading_memberships(true);
    set_error('');

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
    set_loading_memberships(false);
  }

  function handle_client_change(user_id: string) {
    set_selected_user_id(user_id);
    if (!user_id) {
      set_memberships([]);
      set_credit_inputs({});
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
      const result = await apply_membership(selected_user_id, selected_package_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_selected_package_id('');
      refresh_memberships(selected_user_id);
    });
  }

  function handle_deactivate(user_package_id: string) {
    if (!selected_user_id) return;

    start_transition(async () => {
      set_error('');
      const result = await deactivate_membership(user_package_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      refresh_memberships(selected_user_id);
    });
  }

  function handle_remove(user_package_id: string, package_name: string) {
    if (!selected_user_id) return;

    const confirmed = window.confirm(
      `Permanently remove "${package_name}" from this account? This deletes the membership record entirely and cannot be undone.`,
    );
    if (!confirmed) return;

    start_transition(async () => {
      set_error('');
      const result = await remove_membership(user_package_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
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
      const result = await update_membership_credits(user_package_id, credits);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      refresh_memberships(selected_user_id);
    });
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
            <h3 className="text-sm font-semibold text-foreground">Apply membership</h3>
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

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Current memberships</h3>
            {loading_memberships ? (
              <p className="text-sm text-foreground/60">Loading memberships…</p>
            ) : memberships.length === 0 ? (
              <p className="text-sm text-foreground/60">No memberships for this account.</p>
            ) : (
              memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="rounded-md border border-border bg-background p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{membership.package_name}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground/60">
                        {membership.class_type} credits
                      </p>
                      <p className="mt-1 text-xs text-foreground/60">
                        Status: {membership.status}
                        {membership.expires_at
                          ? ` • Expires ${new Date(membership.expires_at).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {membership.status === 'active' ? (
                        <Button
                          className="w-full sm:w-auto"
                          disabled={is_pending}
                          onClick={() => handle_deactivate(membership.id)}
                          type="button"
                          variant="secondary"
                        >
                          Deactivate
                        </Button>
                      ) : null}
                      <Button
                        className="w-full border-danger text-danger-foreground hover:bg-danger/10 sm:w-auto"
                        disabled={is_pending}
                        onClick={() => handle_remove(membership.id, membership.package_name)}
                        type="button"
                        variant="secondary"
                      >
                        Remove membership
                      </Button>
                    </div>
                  </div>

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
                        onChange={(event) =>
                          set_credit_inputs((prev) => ({
                            ...prev,
                            [membership.id]: event.target.value,
                          }))
                        }
                        placeholder="Blank = unlimited"
                        type="text"
                        value={credit_inputs[membership.id] ?? ''}
                      />
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      disabled={is_pending}
                      onClick={() => handle_save_credits(membership.id)}
                      type="button"
                    >
                      Save credits
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
