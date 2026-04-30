import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSqlite } from '@/lib/catalog/db';
import { newId } from '@/lib/catalog/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-03-25.dahlia',
});

/**
 * POST /api/checkout
 *
 * Body: {
 *   items: CartItem[],        // { sku, name, price, quantity, image }
 *   customer: { name, email },
 *   successUrl: string,
 *   cancelUrl: string,
 * }
 *
 * Creates a Stripe Checkout session and returns { url }.
 * If STRIPE_SECRET_KEY is not set, returns { demo: true, checkoutUrl: '/cart' }
 * so the cart works in demo mode without Stripe configured.
 */
export async function POST(req: NextRequest) {
  // Demo mode: no Stripe key
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return NextResponse.json({ demo: true, checkoutUrl: '/cart' });
  }

  try {
    const { items, customer, successUrl, cancelUrl } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = items.map((item: {
      sku?: string;
      name: string;
      price: number;
      quantity: number;
      image?: string;
    }) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
          ...(item.sku ? { metadata: { sku: item.sku } } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: Math.max(1, item.quantity ?? 1),
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer?.email,
      success_url: successUrl ?? `${req.nextUrl.origin}/cart?success=1`,
      cancel_url: cancelUrl ?? `${req.nextUrl.origin}/cart?canceled=1`,
      metadata: {
        source: 'forge-builder',
        customer_name: customer?.name ?? '',
      },
      shipping_address_collection: {
        allowed_countries: ['AU', 'NZ', 'GB', 'US', 'CA'],
      },
      phone_number_collection: { enabled: true },
    });

    // Persist the order to our local DB
    const sqlite = getSqlite();
    const now = Date.now();
    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * (item.quantity ?? 1), 0);

    try {
      const insertOrder = sqlite.prepare(`
        INSERT INTO orders (id, stripe_session_id, status, subtotal, total, customer_name, customer_email, items_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertOrder.run(
        newId('order'),
        session.id,
        'pending',
        subtotal,
        subtotal,
        customer?.name ?? '',
        customer?.email ?? '',
        JSON.stringify(items),
        now,
        now,
      );
    } catch {
      // table might not exist yet — that's fine for demo mode
    }

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    // Handle Stripe key misconfiguration gracefully
    if (errMsg.includes('Invalid API Key') || errMsg.includes('No API key provided')) {
      return NextResponse.json({ demo: true, checkoutUrl: '/cart', error: 'Stripe not configured' });
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

/**
 * GET /api/checkout?session_id=cs_xxx
 *
 * Returns the status of a Stripe Checkout session.
 * Used by the /cart?success=1 page to confirm the order.
 */
export async function GET(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return NextResponse.json({ demo: true });
  }

  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Update order status if we have the DB
    const sqlite = getSqlite();
    try {
      const updateOrder = sqlite.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE stripe_session_id = ?');
      const newStatus = session.payment_status === 'paid' ? 'paid' : session.payment_status;
      updateOrder.run(newStatus, Date.now(), sessionId);
    } catch {
      // table doesn't exist
    }

    return NextResponse.json({
      id: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}