import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitToIndexNow } from '@/lib/indexnow';

describe('submitToIndexNow', () => {
  const original_key = process.env.INDEXNOW_KEY;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (original_key === undefined) {
      delete process.env.INDEXNOW_KEY;
    } else {
      process.env.INDEXNOW_KEY = original_key;
    }
  });

  it('returns failure when INDEXNOW_KEY is missing', async () => {
    delete process.env.INDEXNOW_KEY;

    const result = await submitToIndexNow(['https://corehousepilatescy.com/']);

    expect(result).toEqual({ ok: false, error: 'INDEXNOW_KEY is not set' });
  });

  it('submits URLs to IndexNow when configured', async () => {
    process.env.INDEXNOW_KEY = 'cf5a83b07bedf969324ef7fd3e65ee9b';

    const fetch_mock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetch_mock);

    const result = await submitToIndexNow(['https://corehousepilatescy.com/classes']);

    expect(result).toEqual({ ok: true, status: 200 });
    expect(fetch_mock).toHaveBeenCalledWith(
      'https://api.indexnow.org/indexnow',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }),
    );
  });
});
