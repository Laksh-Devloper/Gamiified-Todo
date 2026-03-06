import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config(); // Must run before new Pool() so DATABASE_URL is available

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDB = async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      xp INT DEFAULT 0,
      level INT DEFAULT 1,
      streak INT DEFAULT 0,
      last_active DATE,
      character VARCHAR(50) DEFAULT 'tanjiro',
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

    CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      priority VARCHAR(20) DEFAULT 'low',
      xp_reward INT DEFAULT 10,
      is_completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMP,
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      badge_key VARCHAR(50) NOT NULL,
      unlocked_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, badge_key)
    );
  `);
  console.log('✅ Database initialized');
};

export default pool;
