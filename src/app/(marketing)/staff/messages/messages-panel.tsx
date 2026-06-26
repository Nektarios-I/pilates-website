'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  delete_contact_message,
  type ContactMessage,
} from './actions';

function format_submitted_at(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function MessagesPanel({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [removing_id, set_removing_id] = useState<string | null>(null);
  const [errors, set_errors] = useState<Record<string, string>>({});
  const [removed_ids, set_removed_ids] = useState<Set<string>>(new Set());

  const visible = messages.filter((message) => !removed_ids.has(message.id));

  async function handle_delete(message_id: string) {
    set_removing_id(message_id);
    set_errors((prev) => ({ ...prev, [message_id]: '' }));

    const result = await delete_contact_message(message_id);

    if (result.success) {
      set_removed_ids((prev) => new Set([...prev, message_id]));
      router.refresh();
    } else {
      set_errors((prev) => ({ ...prev, [message_id]: result.error }));
    }

    set_removing_id(null);
  }

  if (visible.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-foreground/60">No contact messages yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {visible.map((message) => {
        const is_removing = removing_id === message.id;

        return (
          <article
            key={message.id}
            className="rounded-md border border-border bg-background p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  {format_submitted_at(message.created_at)}
                </p>
                <div>
                  <p className="text-sm font-medium text-foreground">{message.name}</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    <a className="hover:text-foreground" href={`mailto:${message.email}`}>
                      {message.email}
                    </a>
                  </p>
                  <p className="mt-1 text-sm text-foreground/70">
                    <a className="hover:text-foreground" href={`tel:${message.phone.replace(/\s+/g, '')}`}>
                      {message.phone}
                    </a>
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                  {message.message}
                </p>
                {errors[message.id] ? (
                  <p className="text-xs text-destructive">{errors[message.id]}</p>
                ) : null}
              </div>

              <div className="shrink-0">
                <Button
                  className="w-full sm:w-auto"
                  disabled={is_removing}
                  size="sm"
                  variant="secondary"
                  onClick={() => handle_delete(message.id)}
                >
                  {is_removing ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
