'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { retry_materialization } from '@/features/client-booking-manager/actions';
import {
  failure_code_label,
  format_session_datetime,
} from '@/features/client-booking-manager/format';
import type { MaterializationAttentionRow } from '@/features/client-booking-manager/types';

type AttentionTabProps = {
  attention: MaterializationAttentionRow[];
  on_refresh: () => void;
};

export function AttentionTab({ attention, on_refresh }: AttentionTabProps) {
  const [message, set_message] = useState('');
  const [error, set_error] = useState('');
  const [is_pending, start_transition] = useTransition();

  function handle_retry(log_id: string) {
    start_transition(async () => {
      set_message('');
      set_error('');
      const result = await retry_materialization(log_id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_message('Retry succeeded. Refreshing…');
      on_refresh();
    });
  }

  if (attention.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-foreground/60">
        No failed or pending materializations need attention.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/70">
        Failed recurring materializations appear here. Retry after resolving capacity or credit
        issues.
      </p>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger-foreground">{error}</p> : null}

      <ul className="space-y-3">
        {attention.map((item) => (
          <li
            key={item.id}
            className="rounded-md border border-border bg-background px-4 py-4 sm:px-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {format_session_datetime(item.occurrence_starts_at)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-foreground/60">
                  {item.status}
                  {item.failure_code ? ` · ${failure_code_label(item.failure_code)}` : ''}
                </p>
                {item.failure_message ? (
                  <p className="mt-2 text-sm text-foreground/70">{item.failure_message}</p>
                ) : null}
                <p className="mt-2 text-xs text-foreground/60">
                  Attempts: {item.attempt_count}
                  {item.last_attempted_at
                    ? ` · last ${format_session_datetime(item.last_attempted_at)}`
                    : ''}
                </p>
              </div>

              <Button
                disabled={is_pending}
                onClick={() => handle_retry(item.id)}
                size="sm"
              >
                Retry
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
