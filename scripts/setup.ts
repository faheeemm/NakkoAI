import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create table
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

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_productivity_entries_date 
      ON productivity_entries(user_date DESC)
    `;

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

setupDatabase();
