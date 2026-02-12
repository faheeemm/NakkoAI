import { sql } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS productivity_entries (
        id SERIAL PRIMARY KEY,
        user_date DATE NOT NULL UNIQUE,
        prompt TEXT NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
        feedback TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const result = await sql`
      SELECT user_date as date, score, feedback, prompt
      FROM productivity_entries
      ORDER BY user_date DESC
      LIMIT 30
    `;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json([]);
  }
}
