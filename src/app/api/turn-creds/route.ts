import { NextRequest, NextResponse } from 'next/server';

/**
 * Packet loss is disabled in the app's speed test because Cloudflare's
 * public TURN path used by older examples is deprecated.
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Packet loss testing is not configured. Provision your own TURN credentials before enabling it again.',
    },
    { status: 410 }
  );
}
