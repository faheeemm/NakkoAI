import { sql } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`SELECT version()`;
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database version' },
      { status: 500 }
    );
  }
}
