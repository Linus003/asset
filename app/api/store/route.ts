import { NextResponse } from 'next/server';
import { readStore, writeStore } from '@/lib/server/persistent-store';

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const store = await request.json();
  const saved = await writeStore(store);
  return NextResponse.json(saved);
}
