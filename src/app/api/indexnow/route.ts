import { NextResponse } from 'next/server';

import { INDEXNOW_PUBLIC_URLS, submitToIndexNow } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    console.error('[indexnow] CRON_SECRET is not set');
    return false;
  }

  const authorization = request.headers.get('authorization');
  return authorization === `Bearer ${secret}`;
}

async function handleIndexNowSubmission() {
  const result = await submitToIndexNow(INDEXNOW_PUBLIC_URLS);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        status: result.status ?? null,
      },
      { status: result.status && result.status < 500 ? result.status : 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    submitted: INDEXNOW_PUBLIC_URLS.length,
    urls: INDEXNOW_PUBLIC_URLS,
    status: result.status,
  });
}

/** Vercel Cron invokes this path with GET and Authorization: Bearer CRON_SECRET. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleIndexNowSubmission();
}

/** Manual or server-triggered submission. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleIndexNowSubmission();
}
