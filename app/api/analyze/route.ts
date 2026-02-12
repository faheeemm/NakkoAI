import { sql } from '@/app/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `
Tu hai ek Hyderabadi chatbot jo user ke doubts ko saaf karta hai aur layman's terms mein explain karta hai.

**PERSONALITY: Friendly Hyderabadi with attitude**
- user ke saath friendly aur helpful dono ho
- Minimal gaalis - sirf jahan bilkul necessary ho (like "arre", "saale" friendliness mein)
- Hyderabadi slangs use kar: "arre", "raa", "jaani", "dekho", "haan beta", "blood", "arrey bhai"
- Confident aur knowledgeable but not arrogant
- Personally connect with user - acknowledge him in responses

**JAARAB RULES:**
1. **Explain in simple terms**: Jo bhi concept ho - programming, math, science, life advice - simple Urdu/Hinglish mein samjha. Jaise ek 10 saal ke bacche ko samjha rahe ho
2. **Hyderabadi Urdu mein jawab de**: Mix Urdu, Hindi, English - natural way mein. "Dekho jaani, yeh concept bilkul simple hai..."
3. **Slangs properly use kar**: "Arre raa, samajh gaya na?", "Haan beta, yehi hota hai", "Blood, iska matlab yeh hai"
4. **Minimal bad words**: Agar gaali baki hi ho to "arrey", "arre saale" (friendly context mein) use kar, porn/derogatory gaalis kabhi nahi
5. **Patient aur clear**: user confused ho to usko step-by-step guide kar

**RESPONSE STYLE:**
- **CONCISE yet COMPLETE**: 2-3 paragraphs max. Na too short na too long. Direct point pe aao
- Simple but meaningful explanations
- Use examples jab samjhana ho (1-2 max)
- Ask follow-up questions agar user confused lagta ho
- Be humble but confident - "Main nahi samjha to seedha bol na bhai"
- Use line breaks aur simple formatting for readability

**Examples:**
User: "Machine learning kya hota hai?"
You: "Arre raa, bilkul simple hai! Jaise tum kisi cheez ko repeat-repeat karke karte ho, machine bhi same samajh jaata hai.

Example: Google ko pata hai teri pasand kaunsi movie hai? Kyunki usne dekha tha ki tum kaun c movies dekha karti ho. Yehi machine learning hai beta - seekhna experience se!

Samajh gaya na?"

User: "Confused hoon"
You: "Haan beta, confusion theek hai! Dekho, kis specific cheez mein problem hai? Mera kaam tera doubt clear karna, seedha bol na bhai!"
`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, chatId } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !chatId) {
      return NextResponse.json(
        { error: 'Invalid prompt or chatId' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please check your API key.' },
        { status: 500 }
      );
    }

    // Call Gemini API endpoint
    let geminiResponse;
    try {
      geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser: ${prompt}`,
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Gemini API timeout');
        return NextResponse.json(
          { error: 'AI service is taking too long. Please try again.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    // Handle API errors with specific messages
    if (!geminiResponse.ok) {
      let errorMessage = 'Failed to get response from AI';
      
      if (geminiResponse.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        console.error('Rate limited by Gemini API');
      } else if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        errorMessage = 'API authentication failed. Please check your configuration.';
        console.error('Authentication error with Gemini API');
      } else if (geminiResponse.status === 500 || geminiResponse.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
        console.error('Gemini API server error:', geminiResponse.status);
      }

      const errorData = await geminiResponse.json().catch(() => ({})) as any;
      const detailedError = errorData.error?.message || errorData.message || errorMessage;
      
      console.error('Gemini API error:', {
        status: geminiResponse.status,
        error: detailedError,
      });

      return NextResponse.json(
        { error: errorMessage, details: detailedError },
        { status: geminiResponse.status }
      );
    }

    const geminiData = await geminiResponse.json() as any;
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Invalid response format from Gemini:', geminiData);
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    // Create tables if they don't exist
    try {
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
    } catch (dbError) {
      console.error('Database table creation error:', dbError);
      return NextResponse.json(
        { error: 'Database error occurred. Please try again.' },
        { status: 500 }
      );
    }

    // Save messages to database
    try {
      // Check current chat title to determine if we should generate a short chat name
      let chatTitleRows = [] as any;
      try {
        chatTitleRows = await sql`
          SELECT title
          FROM chats
          WHERE id = ${chatId}
        `;
      } catch (qErr) {
        console.error('Failed to query chat title:', qErr);
      }

      const existingTitle = chatTitleRows?.[0]?.title;
      let generatedChatName: string | null = null;

      const shouldGenerateName = !existingTitle || existingTitle.trim() === '' || existingTitle.trim() === 'New Chat';
      if (shouldGenerateName) {
        try {
          const nameResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'system',
                  parts: [
                    {
                      text: 'You are a helpful assistant that must provide ONLY a very short chat title for the conversation. Return JUST the title (1-3 words), no punctuation, no extra explanation.'
                    },
                  ],
                },
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Conversation summary:\nUser: ${prompt}\nAssistant: ${text}\n\nProvide a short title (1-3 words) suitable as a chat name.`,
                    },
                  ],
                },
              ],
            }),
            signal: AbortSignal.timeout(10000),
          });

          if (nameResponse && nameResponse.ok) {
            const nameData = await nameResponse.json() as any;
            let nameText = nameData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (nameText) {
              // sanitize: take first line, remove quotes and newlines, trim, limit length
              nameText = nameText.split('\n')[0].replace(/["']/g, '').trim();
              if (nameText.length > 64) nameText = nameText.slice(0, 64).trim();
              // final safety: remove excessive punctuation
              nameText = nameText.replace(/[\r\n\t]+/g, ' ').trim();
              if (nameText) {
                generatedChatName = nameText;
                try {
                  await sql`
                    UPDATE chats
                    SET title = ${generatedChatName}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${chatId}
                  `;
                } catch (uErr) {
                  console.error('Failed to update chat title:', uErr);
                }
              }
            }
          } else {
            console.error('Name generation request failed', nameResponse?.status);
          }
        } catch (nameErr) {
          if (nameErr instanceof Error && nameErr.name === 'AbortError') {
            console.error('Chat name generation timed out');
          } else {
            console.error('Chat name generation error:', nameErr);
          }
        }
      }

      // Save user message
      await sql`
        INSERT INTO chat_messages (chat_id, type, content)
        VALUES (${chatId}, 'user', ${prompt})
      `;

      // Save assistant response
      const result = await sql`
        INSERT INTO chat_messages (chat_id, type, content)
        VALUES (${chatId}, 'assistant', ${text})
        RETURNING id, chat_id, type, content, created_at
      `;

      // Update chat's updated_at
      await sql`
        UPDATE chats
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${chatId}
      `;

      // Return response as JSON, include generated chatName when available
      return NextResponse.json({
        message: result[0],
        chatName: generatedChatName,
      });
    } catch (dbError) {
      console.error('Database save error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save message. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.', details: message },
      { status: 500 }
    );
  }
}
