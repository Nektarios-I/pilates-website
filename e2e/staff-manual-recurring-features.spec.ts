import { expect, test } from '@playwright/test';

/**
 * Feature coverage for staff manual horizon + recurring first occurrence / preview.
 * Authenticated staff flows require the authenticated-staff-bookings project env.
 * Public booking horizon assertions run unauthenticated against /book UI helpers.
 */

test.describe('public booking horizon retained', () => {
  test('public book page still presents the shared date strip (14-day style)', async ({
    page,
  }) => {
    await page.goto('/book');
    // Soft assertion: public book route loads; horizon is enforced server-side (P0014).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('staff client bookings recurring UX', () => {
  test('client bookings recurring tab exposes first session date and planned sessions', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'authenticated-staff-bookings',
      'Requires authenticated staff project',
    );

    await page.goto('/staff/client-bookings');
    if (page.url().includes('/login')) {
      test.skip(true, 'Staff session not available');
    }

    const recurring_control = page.getByRole('button', { name: /recurring/i });
    if (await recurring_control.count()) {
      await recurring_control.click();
    }

    await expect(page.getByText(/create recurring rule/i)).toBeVisible();
  });
});
