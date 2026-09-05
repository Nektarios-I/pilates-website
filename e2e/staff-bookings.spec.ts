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

  test('month calendar navigates independently and opens the day detail popup', async ({
    page,
  }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    const date_key = e2e_staff_known_booking_date();
    const [year, month] = date_key.split('-');

    await login_as_staff(page, '/staff/day-bookings');
    const calendar = page.getByRole('region', { name: 'Month calendar' });
    await expect(calendar.getByRole('heading', { name: 'Month calendar' })).toBeVisible();

    const label_before = await calendar.locator('p').filter({ hasText: /\d{4}/ }).first().textContent();
    await calendar.getByRole('button', { name: 'Next month' }).click();
    await expect
      .poll(async () => calendar.locator('p').filter({ hasText: /\d{4}/ }).first().textContent())
      .not.toBe(label_before);
    await calendar.getByRole('button', { name: 'Previous month' }).click();

    await calendar.getByLabel('Month').selectOption(String(Number(month)));
    await calendar.getByLabel('Year').selectOption(year ?? '2026');

    const day_number = String(Number(date_key.slice(-2)));
    const month_names = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const month_name = month_names[Number(month) - 1];
    const day_button = calendar.getByRole('button', {
      name: new RegExp(`${day_number} ${month_name},`),
    });
    await expect(day_button).toBeVisible({ timeout: 15_000 });

    const day_filter_before = await page.getByLabel('Day').inputValue();
    await day_button.click();

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('0:00', { exact: true })).toBeVisible();
    await expect(dialog.getByText('6:00', { exact: true })).toBeVisible();
    await expect(dialog.getByText('23:00', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Day')).toHaveValue(day_filter_before);

    const booking_box = dialog.getByRole('button').filter({ hasText: /Reformer|Mat/i }).first();
    await expect(booking_box).toBeVisible({ timeout: 15_000 });
    await booking_box.click();

    const client_dialog = page.getByRole('dialog').nth(1);
    await expect(client_dialog.getByRole('heading', { name: 'Memberships' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(client_dialog.getByText(/credits remaining|Unlimited credits|No active memberships/i)).toBeVisible();
    await expect(client_dialog.getByRole('heading', { name: 'Other bookings' })).toBeVisible();
  });

  test('month calendar keeps a seven-column grid on mobile', async ({ page }) => {
    test.skip(
      !staff_booking_e2e_configured(),
      'Set E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD, and Supabase keys.',
    );

    await page.setViewportSize({ width: 375, height: 844 });
    await login_as_staff(page, '/staff/day-bookings');

    const calendar = page.getByRole('region', { name: 'Month calendar' });
    await expect(calendar).toBeVisible();
    await expect(calendar.getByText('Mon', { exact: true })).toBeVisible();
    await expect(calendar.getByText('Sun', { exact: true })).toBeVisible();

    const page_scroll_width = await page.evaluate(() => document.documentElement.scrollWidth);
    const page_client_width = await page.evaluate(() => document.documentElement.clientWidth);
    expect(page_scroll_width).toBeLessThanOrEqual(page_client_width + 8);
  });
});
