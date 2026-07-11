import { expect, type Page } from '@playwright/test';

const DATE_PILL_PATTERN = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\s+\w{3}$/;

export async function book_first_available_open_slot(page: Page): Promise<string> {
  await page.goto('/book');
  await expect(page.getByRole('heading', { name: /book a class|book a session/i })).toBeVisible();

  const show_available = page.getByRole('button', { name: 'Show available only' });
  if (await show_available.isVisible()) {
    await show_available.click();
  }

  const date_pills = page.getByRole('button', { name: DATE_PILL_PATTERN });
  const pill_count = await date_pills.count();
  expect(pill_count, 'Expected date pills on /book').toBeGreaterThan(0);

  for (let index = 0; index < pill_count; index += 1) {
    await date_pills.nth(index).click();
    await expect(page.getByText('Loading available times')).toBeHidden({ timeout: 15_000 }).catch(
      () => undefined,
    );

    const open_slot = page
      .locator('button:not([disabled])')
      .filter({ hasText: /\d{2}:\d{2}\s*–\s*\d{2}:\d{2}/ })
      .first();

    if ((await open_slot.count()) === 0) continue;

    const slot_label = (await open_slot.innerText()).trim();
    await open_slot.click();
    await page.getByRole('button', { name: 'Confirm booking' }).click();
    await expect(page.getByText('Booking confirmed')).toBeVisible({ timeout: 20_000 });
    return slot_label;
  }

  throw new Error('No open bookable slot found across visible date pills.');
}
