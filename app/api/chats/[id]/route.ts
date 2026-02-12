import { sql } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chatId } = await params;

    const messages = await sql`
      SELECT id, chat_id, type, content, created_at
      FROM chat_messages
      WHERE chat_id = ${chatId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chatId } = await params;
    const { type, content } = await request.json();

    const result = await sql`
      INSERT INTO chat_messages (chat_id, type, content)
      VALUES (${chatId}, ${type}, ${content})
      RETURNING id, chat_id, type, content, created_at
    `;

    // Update chat's updated_at
    await sql`
      UPDATE chats
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${chatId}
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chatId } = await params;

    await sql`
      DELETE FROM chats
      WHERE id = ${chatId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
