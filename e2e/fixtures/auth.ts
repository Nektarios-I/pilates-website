import { expect, type Page } from '@playwright/test';

import { e2e_client_email, e2e_client_password } from './env';

export async function login_as_client(page: Page, next_path = '/account') {
  await page.goto(`/login?next=${encodeURIComponent(next_path)}`);
  await page.getByLabel('Email or name').fill(e2e_client_email());
  await page.getByLabel('Password').fill(e2e_client_password());
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL(`**${next_path}`, { timeout: 20_000 });
  await expect(page).toHaveURL(new RegExp(`${next_path.replace('/', '\\/')}$`));
}
