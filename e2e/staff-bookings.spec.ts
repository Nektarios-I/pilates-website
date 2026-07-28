import { expect, test } from '@playwright/test';

import { login_as_staff } from './fixtures/auth';
import {
  e2e_staff_known_booking_date,
  e2e_staff_known_client_name,
  staff_booking_e2e_configured,
} from './fixtures/env';

test.describe.configure({ mode: 'serial' });

test.describe('staff booking pages after profiles FK disambiguation', () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'authenticated-staff-bookings',
      'Staff booking regression runs only in the authenticated-staff-bookings project.',
    );
  });

  test('day bookings loads without the migration error and can show a known client', async ({
    page,
  }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    const date_key = e2e_staff_known_booking_date();
    const client_name = e2e_staff_known_client_name();

    await login_as_staff(page, '/staff/day-bookings');
    await expect(page.getByRole('heading', { name: 'Day bookings' })).toBeVisible();
    await expect(
      page.getByText('Unable to load bookings for this day. Please try again.'),
    ).toHaveCount(0);

    await page.getByLabel('Day').fill(date_key);
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(
      page.getByText('Unable to load bookings for this day. Please try again.'),
    ).toHaveCount(0);
    await expect(page.getByText(client_name)).toBeVisible({ timeout: 15_000 });
  });

  test('booking history loads and can find the known client', async ({ page }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    const client_name = e2e_staff_known_client_name();
    const date_key = e2e_staff_known_booking_date();

    await login_as_staff(page, '/staff/bookings');
    await expect(page.getByRole('heading', { name: 'Booking history' })).toBeVisible();
    await expect(page.getByText('Unable to load bookings. Please try again.')).toHaveCount(0);

    await page.getByLabel('Session from').fill(date_key);
    await page.getByLabel('Session until').fill(date_key);
    await page.getByLabel('Client search').fill(client_name);
    await page.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page.getByText('Unable to load bookings. Please try again.')).toHaveCount(0);
    await expect(page.getByText(client_name)).toBeVisible({ timeout: 15_000 });
  });

  test('client booking manager still loads for the known client', async ({ page }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    const client_name = e2e_staff_known_client_name();

    await login_as_staff(page, '/staff/client-bookings');
    await expect(page.getByRole('heading', { name: 'Client Booking Manager' })).toBeVisible();

    const client_select = page.getByLabel('Client account');
    const option_value = await client_select.locator('option').evaluateAll(
      (options, name) =>
        options.find((option) => option.textContent?.toUpperCase().includes(name.toUpperCase()))
          ?.getAttribute('value') ?? '',
      client_name,
    );
    expect(option_value).toBeTruthy();
    await client_select.selectOption(option_value);
    await page.getByRole('button', { name: 'Client Bookings' }).click();
    await expect(page.getByText(/booked/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
