import { sql } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id 
      ON chat_messages(chat_id DESC)
    `;

    const chats = await sql`
      SELECT id, title, created_at, updated_at
      FROM chats
      ORDER BY updated_at DESC
    `;

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { title } = await request.json();

    const result = await sql`
      INSERT INTO chats (title)
      VALUES (COALESCE(${title}, 'New Chat'))
      RETURNING id, title, created_at, updated_at
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
