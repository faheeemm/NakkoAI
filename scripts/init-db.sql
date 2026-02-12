-- Create productivity_entries table
CREATE TABLE IF NOT EXISTS productivity_entries (
  id SERIAL PRIMARY KEY,
  user_date DATE NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_date for efficient queries
CREATE INDEX IF NOT EXISTS idx_productivity_entries_date ON productivity_entries(user_date DESC);
