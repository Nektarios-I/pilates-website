import { expect, type Page } from '@playwright/test';

import {
  e2e_client_email,
  e2e_client_password,
  e2e_staff_email,
  e2e_staff_password,
} from './env';

async function login_with_password(page: Page, identifier: string, password: string, next_path: string) {
  await page.goto(`/login?next=${encodeURIComponent(next_path)}`);
  await page.getByLabel('Name, email, or phone').fill(identifier);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  // Some environments land on /account even when next= is set; navigate explicitly after auth.
  await page.waitForURL(/\/(account|staff\/)/, { timeout: 20_000 });
  if (!page.url().includes(next_path)) {
    await page.goto(next_path);
  }
  await expect(page).toHaveURL(new RegExp(`${next_path.replace(/\//g, '\\/')}$`));
}

export async function login_as_client(page: Page, next_path = '/account') {
  await login_with_password(page, e2e_client_email(), e2e_client_password(), next_path);
}

export async function login_as_staff(page: Page, next_path = '/account') {
  await login_with_password(page, e2e_staff_email(), e2e_staff_password(), next_path);
}
