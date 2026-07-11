'use client';

import { useMemo, useState } from 'react';

import { format_client_label } from '@/features/client-booking-manager/format';
import type { ManageableClient } from '@/app/(marketing)/staff/membership/actions';

type ClientSelectorProps = {
  clients: ManageableClient[];
  selected_client_id: string;
  on_select: (client_id: string) => void;
};

export function ClientSelector({ clients, selected_client_id, on_select }: ClientSelectorProps) {
  const [query, set_query] = useState('');

  const filtered_clients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return clients;

    return clients.filter((client) => {
      const haystack = `${client.full_name ?? ''} ${client.email}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [clients, query]);

  if (clients.length === 0) {
    return (
      <p className="text-sm text-foreground/60">No client accounts are available to manage.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor="client-booking-search">
          Search clients
        </label>
        <input
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          id="client-booking-search"
          onChange={(event) => set_query(event.target.value)}
          placeholder="Name or email"
          type="search"
          value={query}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor="client-booking-client">
          Client account
        </label>
        <select
          className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          id="client-booking-client"
          onChange={(event) => on_select(event.target.value)}
          value={selected_client_id}
        >
          <option value="">Select a client</option>
          {filtered_clients.map((client) => (
            <option key={client.id} value={client.id}>
              {format_client_label(client.full_name, client.email)}
            </option>
          ))}
        </select>
        {query && filtered_clients.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">No clients match your search.</p>
        ) : null}
      </div>
    </div>
  );
}
