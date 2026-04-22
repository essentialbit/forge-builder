import { NextRequest, NextResponse } from 'next/server';
import { recordSubmission } from '@/lib/catalog/submissions';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

/**
 * Placeholder checkout: records the cart as a submission of type 'checkout'
 * and returns { ok: true } with a status url if/when Stripe is wired up.
 *
 * Replace with Stripe Checkout or Shopify Buy SDK integration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = recordSubmission('checkout', body, req.headers.get('x-forwarded-for') ?? undefined, req.headers.get('user-agent') ?? undefined);
    // No Stripe yet — return ok so the client can show a "submitted" message.
    return NextResponse.json(
      {
        ok: true,
        id,
        message: 'Order received. Stripe integration not yet configured.',
        // url: '<stripe session url when configured>'
      },
      { headers: CORS },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500, headers: CORS },
    );
  }
}
