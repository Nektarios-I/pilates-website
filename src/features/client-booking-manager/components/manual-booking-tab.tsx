'use client';

import { useMemo, useState } from 'react';

import type { SessionCard } from '@/app/(marketing)/book/schedule-actions';
import { SlotBookingPicker } from '@/features/bookings/components/slot-booking-picker';
import { staff_manual_book_slot } from '@/features/client-booking-manager/actions';
import type { ClientActivePackage } from '@/features/client-booking-manager/types';

type ManualBookingTabProps = {
  client_user_id: string;
  packages: ClientActivePackage[];
  session_cards: SessionCard[];
  on_success: () => void;
};

export function ManualBookingTab({
  client_user_id,
  packages,
  session_cards,
  on_success,
}: ManualBookingTabProps) {
  const [reformer_package_id, set_reformer_package_id] = useState('');
  const [mat_package_id, set_mat_package_id] = useState('');
  const [message, set_message] = useState('');

  const reformer_packages = useMemo(
    () => packages.filter((pkg) => pkg.class_type === 'reformer'),
    [packages],
  );
  const mat_packages = useMemo(() => packages.filter((pkg) => pkg.class_type === 'mat'), [packages]);

  const needs_split_credits = reformer_packages.length > 0 && mat_packages.length > 0;

  if (packages.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        This client has no active packages. Assign a package before manual booking.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/70">
        Book the selected client for today or any future studio date. Full sessions fail clearly —
        staff bookings do not waitlist. Public self-booking still uses the 14-day window.
      </p>

      {needs_split_credits ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <PackageSelect
            id="manual-reformer-package"
            label="Reformer package"
            on_change={set_reformer_package_id}
            options={reformer_packages}
            value={reformer_package_id}
          />
          <PackageSelect
            id="manual-mat-package"
            label="Mat package"
            on_change={set_mat_package_id}
            options={mat_packages}
            value={mat_package_id}
          />
        </div>
      ) : (
        <PackageSelect
          id="manual-package"
          label="Package"
          on_change={(value) => {
            set_reformer_package_id(value);
            set_mat_package_id('');
          }}
          options={packages}
          value={reformer_package_id}
        />
      )}

      <SlotBookingPicker
        booking_mode="staff_manual"
        confirm_label="Book for client"
        heading="Choose class and time"
        session_cards={session_cards}
        on_confirm={async ({ session_card, date_key, slot }) => {
          const reformer_id = needs_split_credits
            ? reformer_package_id || null
            : reformer_package_id || mat_package_id || null;
          const mat_id = needs_split_credits ? mat_package_id || null : undefined;

          if (!reformer_id && !mat_id) {
            return { success: false, error: 'Select a package before booking.' };
          }

          set_message('');
          const result = needs_split_credits
            ? await staff_manual_book_slot(
                client_user_id,
                date_key,
                slot.slot_start,
                slot.slot_end,
                session_card.id,
                reformer_id,
                mat_id,
              )
            : await staff_manual_book_slot(
                client_user_id,
                date_key,
                slot.slot_start,
                slot.slot_end,
                session_card.id,
                reformer_id,
              );

          if (!result.success) {
            return { success: false, error: result.error };
          }

          set_message('Booking created successfully.');
          set_reformer_package_id('');
          set_mat_package_id('');
          on_success();
          return { success: true };
        }}
      />

      {message ? <p className="text-sm text-success">{message}</p> : null}
    </div>
  );
}

function PackageSelect({
  id,
  label,
  options,
  value,
  on_change,
}: {
  id: string;
  label: string;
  options: ClientActivePackage[];
  value: string;
  on_change: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <select
        className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        id={id}
        onChange={(event) => on_change(event.target.value)}
        value={value}
      >
        <option value="">Select a package</option>
        {options.map((pkg) => (
          <option key={pkg.user_package_id} value={pkg.user_package_id}>
            {pkg.package_name} (
            {pkg.credits_remaining === null ? 'unlimited' : `${pkg.credits_remaining} left`})
          </option>
        ))}
      </select>
      {options.length === 0 ? (
        <p className="mt-2 text-xs text-foreground/60">No matching active packages.</p>
      ) : null}
    </div>
  );
}
