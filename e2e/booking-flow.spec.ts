import { expect, test } from '@playwright/test';

import { login_as_client } from './fixtures/auth';
import { book_first_available_open_slot } from './fixtures/booking-ui';
import {
  booking_e2e_configured,
  e2e_near_cutoff_booking_id,
  e2e_near_cutoff_booking_title,
  near_cutoff_booking_configured,
} from './fixtures/env';
import {
  create_authenticated_supabase_client,
  get_active_package_credits,
  get_booking_status,
} from './fixtures/supabase';

test.describe.configure({ mode: 'serial' });

test.describe('authenticated booking flows', () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'authenticated-booking',
      'Authenticated booking flows run only in the authenticated-booking project.',
    );
  });

  test('client books an open slot and cancels outside the 2-hour window', async ({ page }) => {
    test.skip(!booking_e2e_configured(), 'Set E2E_CLIENT_EMAIL, E2E_CLIENT_PASSWORD, Supabase keys.');

    const supabase = await create_authenticated_supabase_client();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    expect(user?.id).toBeTruthy();

    const credits_before = await get_active_package_credits(supabase, user!.id);

    await login_as_client(page, '/book');
    await book_first_available_open_slot(page);

    await page.goto('/account');
    await expect(page.getByText(/Cancel more than 4 hours before class/i)).toBeVisible();
    const cancel_button = page.getByRole('button', { name: 'Cancel booking' }).first();
    await expect(cancel_button).toBeVisible();

    await cancel_button.click();
    await expect(page.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0, {
      timeout: 15_000,
    });

    if (credits_before !== null) {
      const credits_after = await get_active_package_credits(supabase, user!.id);
      expect(credits_after).toBe(credits_before + 1);
    }
  });

  test('client cancel inside 4h is blocked in UI and via RPC (P0029)', async ({ page }) => {
    test.skip(
      !near_cutoff_booking_configured(),
      'Set E2E_NEAR_CUTOFF_BOOKING_ID and E2E_NEAR_CUTOFF_BOOKING_TITLE for the near-cutoff fixture booking.',
    );

    const booking_id = e2e_near_cutoff_booking_id();
    const booking_title = e2e_near_cutoff_booking_title();
    const supabase = await create_authenticated_supabase_client();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    expect(user?.id).toBeTruthy();

    const credits_before = await get_active_package_credits(supabase, user!.id);
    expect(await get_booking_status(supabase, booking_id)).toBe('booked');

    await login_as_client(page, '/account');
    await expect(page.getByRole('heading', { name: 'Upcoming Bookings' })).toBeVisible();
    await expect(page.getByText(booking_title)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0);
    await expect(
      page.getByText(/Online cancellation closes 4 hours before class/i),
    ).toBeVisible();

    const { error } = await supabase.rpc('cancel_booking', {
      p_booking_id: booking_id,
      p_reason: 'E2E forced late cancel',
    });

    expect(error?.message ?? '').toMatch(/P0029/i);
    expect(await get_booking_status(supabase, booking_id)).toBe('booked');

    if (credits_before !== null) {
      const credits_after = await get_active_package_credits(supabase, user!.id);
      expect(credits_after).toBe(credits_before);
    }
  });
});
