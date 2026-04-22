import { NextResponse } from 'next/server';
import catalog from '@/data/catalog.json';

export async function GET() {
  return NextResponse.json(catalog);
}
