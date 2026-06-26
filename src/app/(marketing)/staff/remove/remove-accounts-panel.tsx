'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROLE_BADGE_CLASS } from '@/components/ui/marketing-field-styles';
import { remove_user, type RemovableUser } from './actions';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Owner',
  instructor: 'Instructor',
  client: 'Client',
};

type ConfirmState = {
  user_id: string;
  name: string;
};

export function RemoveAccountsPanel({ users }: { users: RemovableUser[] }) {
  const router = useRouter();
  const [confirm, set_confirm] = useState<ConfirmState | null>(null);
  const [removing_id, set_removing_id] = useState<string | null>(null);
  const [errors, set_errors] = useState<Record<string, string>>({});
  const [removed_ids, set_removed_ids] = useState<Set<string>>(new Set());

  const visible = users.filter((u) => !removed_ids.has(u.id));

  async function handle_remove(user_id: string) {
    set_removing_id(user_id);
    set_errors((prev) => ({ ...prev, [user_id]: '' }));

    const result = await remove_user(user_id);

    if (result.success) {
      set_removed_ids((prev) => new Set([...prev, user_id]));
      set_confirm(null);
      router.refresh();
    } else {
      set_errors((prev) => ({ ...prev, [user_id]: result.error }));
    }

    set_removing_id(null);
  }

  if (visible.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-foreground/60">
        No accounts available to remove with your current role.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((user) => {
        const is_confirming = confirm?.user_id === user.id;
        const is_removing = removing_id === user.id;
        const display_name = user.full_name ?? user.email;
        const badge = ROLE_BADGE_CLASS[user.role] ?? ROLE_BADGE_CLASS.client;
        const role_label = ROLE_LABELS[user.role] ?? user.role;

        return (
          <div
            key={user.id}
            className="flex flex-col gap-4 rounded-md border border-border bg-background p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{display_name}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}
                >
                  {role_label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-foreground/60">{user.email}</p>
              {errors[user.id] && (
                <p className="mt-2 text-xs text-destructive">{errors[user.id]}</p>
              )}
            </div>

            <div className="shrink-0">
              {!is_confirming ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={is_removing}
                  size="sm"
                  variant="secondary"
                  onClick={() => set_confirm({ user_id: user.id, name: display_name })}
                >
                  Remove
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <p className="text-xs text-foreground/70">Remove {display_name}?</p>
                  <Button
                    className="w-full sm:w-auto"
                    disabled={is_removing}
                    size="sm"
                    variant="secondary"
                    onClick={() => handle_remove(user.id)}
                  >
                    {is_removing ? 'Removing…' : 'Confirm'}
                  </Button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center text-xs text-foreground/60 hover:text-foreground/90"
                    disabled={is_removing}
                    type="button"
                    onClick={() => set_confirm(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
