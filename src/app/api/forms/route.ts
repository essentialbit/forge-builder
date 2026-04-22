import { NextRequest, NextResponse } from 'next/server';
import { recordSubmission, listSubmissions } from '@/lib/catalog/submissions';

// CORS — allow cross-origin POST from published sites
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? undefined;
  return NextResponse.json(listSubmissions(type), { headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = String(body.type ?? 'unknown').slice(0, 40);
    const payload = body.payload ?? body;
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
    const ua = req.headers.get('user-agent') ?? undefined;
    const id = recordSubmission(type, payload, ip, ua);
    return NextResponse.json({ ok: true, id }, { headers: CORS });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500, headers: CORS },
    );
  }
}
