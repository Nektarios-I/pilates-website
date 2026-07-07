const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_HOST = 'corehousepilatescy.com';

export const INDEXNOW_PUBLIC_URLS = [
  'https://corehousepilatescy.com/',
  'https://corehousepilatescy.com/classes',
  'https://corehousepilatescy.com/pricing',
  'https://corehousepilatescy.com/instructors',
  'https://corehousepilatescy.com/contact',
  'https://corehousepilatescy.com/faq',
  'https://corehousepilatescy.com/about',
  'https://corehousepilatescy.com/book',
] as const;

export type IndexNowSubmitResult =
  | { ok: true; status: number }
  | { ok: false; error: string; status?: number };

function getKeyLocation(key: string) {
  return `https://${INDEXNOW_HOST}/${key}.txt`;
}

export async function submitToIndexNow(urlList: readonly string[]): Promise<IndexNowSubmitResult> {
  const key = process.env.INDEXNOW_KEY?.trim();

  if (!key) {
    console.error('[indexnow] INDEXNOW_KEY is not set; skipping submission');
    return { ok: false, error: 'INDEXNOW_KEY is not set' };
  }

  if (urlList.length === 0) {
    console.error('[indexnow] urlList is empty; skipping submission');
    return { ok: false, error: 'urlList is empty' };
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key,
        keyLocation: getKeyLocation(key),
        urlList: [...urlList],
      }),
    });

    if (response.ok) {
      return { ok: true, status: response.status };
    }

    const responseText = await response.text().catch(() => '');
    console.error(
      '[indexnow] submission failed',
      response.status,
      responseText || response.statusText,
    );
    return {
      ok: false,
      error: responseText || response.statusText || 'IndexNow submission failed',
      status: response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown IndexNow error';
    console.error('[indexnow] submission error', message);
    return { ok: false, error: message };
  }
}
