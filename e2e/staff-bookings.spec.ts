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
    await expect(page.getByText(/\d+\s*\/\s*\d+\s+booked|Full/i).first()).toBeVisible();
  });

  test('weekly sessions overview navigates and expands day/slot details', async ({ page }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    const date_key = e2e_staff_known_booking_date();

    await login_as_staff(page, '/staff/day-bookings');
    await expect(
      page.getByRole('heading', { name: 'Weekly sessions overview' }),
    ).toBeVisible();

    await page.getByLabel('Day').fill(date_key);
    await page.getByRole('button', { name: 'Apply' }).click();

    const week_section = page.getByRole('region', { name: 'Weekly sessions overview' });
    await expect(week_section.getByRole('button', { name: 'Previous week' })).toBeVisible();
    await expect(week_section.getByRole('button', { name: 'Next week' })).toBeVisible();
    await expect(week_section.getByRole('button', { name: 'Today' })).toBeVisible();

    const range_before = await week_section
      .locator('p')
      .filter({ hasText: /\d/ })
      .first()
      .textContent();

    await week_section.getByRole('button', { name: 'Next week' }).click();
    await expect
      .poll(async () =>
        week_section.locator('p').filter({ hasText: /\d/ }).first().textContent(),
      )
      .not.toBe(range_before);

    await week_section.getByRole('button', { name: 'Previous week' }).click();
    await week_section.getByRole('button', { name: 'Today' }).click();

    await page.getByLabel('Day').fill(date_key);
    await page.getByRole('button', { name: 'Apply' }).click();

    const populated_day = week_section
      .getByRole('button', { name: /Expand .+: \d+ sessions?/i })
      .first();
    await expect(populated_day).toBeVisible({ timeout: 15_000 });
    await populated_day.click();
    await expect(populated_day).toHaveAttribute('aria-expanded', 'true');

    const slot = week_section
      .getByRole('button', { name: /Expand \d{2}:\d{2}–\d{2}:\d{2}: \d+ sessions?/i })
      .first();
    await expect(slot).toBeVisible();
    await slot.click();
    await expect(slot).toHaveAttribute('aria-expanded', 'true');
    await expect(week_section.locator('li').filter({ hasText: /.+/ }).first()).toBeVisible();
  });

  test('weekly sessions overview shows empty week and empty day states', async ({ page }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    await login_as_staff(page, '/staff/day-bookings');
    await page.getByLabel('Day').fill('2099-01-05');
    await page.getByRole('button', { name: 'Apply' }).click();

    const week_section = page.getByRole('region', { name: 'Weekly sessions overview' });
    await expect(week_section.getByText(/No sessions scheduled for /i)).toBeVisible({
      timeout: 15_000,
    });

    const empty_day = week_section.getByRole('button', {
      name: /Expand Monday, 5 January: No sessions/i,
    });
    await empty_day.click();
    await expect(week_section.getByText('No sessions scheduled for this day.')).toBeVisible();
  });

  test('weekly sessions overview keeps a horizontal day rail on mobile', async ({ page }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await login_as_staff(page, '/staff/day-bookings');

    const week_section = page.getByRole('region', { name: 'Weekly sessions overview' });
    await expect(week_section).toBeVisible();

    const page_scroll_width = await page.evaluate(() => document.documentElement.scrollWidth);
    const page_client_width = await page.evaluate(() => document.documentElement.clientWidth);
    expect(page_scroll_width).toBeLessThanOrEqual(page_client_width + 1);

    const rail = week_section.locator('.overflow-x-auto').first();
    await expect(rail).toBeVisible();
    const can_scroll = await rail.evaluate((node) => node.scrollWidth > node.clientWidth);
    expect(can_scroll).toBe(true);
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
