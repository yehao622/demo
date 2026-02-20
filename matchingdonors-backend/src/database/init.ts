import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use in-memory database for tests
const isTest = process.env.NODE_ENV === 'test';
const DB_DIR = path.join(__dirname, '../../database');
const DB_PATH = isTest ? ':memory:' : path.join(DB_DIR, 'matchingdonors.db');

// Ensure database directory exists
if (!isTest && !fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('patient', 'donor', 'sponsor')),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, role)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);
`);

// Create password reset codes table
db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reset_codes_user ON password_reset_codes(user_id);
    CREATE INDEX IF NOT EXISTS idx_reset_codes_code ON password_reset_codes(code);
`);

// Create profiles table
db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('patient', 'donor', 'sponsor')),
        blood_type TEXT NOT NULL,
        age INTEGER NOT NULL,
        country TEXT NOT NULL,
        state TEXT NOT NULL,
        city TEXT NOT NULL,
        organ_type TEXT NOT NULL,
        description TEXT NOT NULL,
        medical_info TEXT NOT NULL,
        preferences TEXT NOT NULL,
        embedding TEXT,
        is_complete BOOLEAN DEFAULT 0,
        is_public BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type);
    CREATE INDEX IF NOT EXISTS idx_profiles_blood_type ON profiles(blood_type);
    CREATE INDEX IF NOT EXISTS idx_profiles_organ_type ON profiles(organ_type);
    CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
    CREATE INDEX IF NOT EXISTS idx_profiles_is_complete ON profiles(is_complete);
`);

// Create articles table
db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL,
        publish_date TEXT,
        topics TEXT,
        organs TEXT,
        categories TEXT,
        embedding TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
    CREATE INDEX IF NOT EXISTS idx_articles_publish_date ON articles(publish_date);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_id INTEGER NOT NULL,
    sender_id INTEGER,           -- Can be NULL if it's a system alert
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,          -- e.g., 'system' or 'message'
    is_read INTEGER DEFAULT 0,   -- 0 for false, 1 for true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create favorite_articles table
db.exec(`
  CREATE TABLE IF NOT EXISTS favorite_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE(user_id, article_id)
  );

  CREATE INDEX IF NOT EXISTS idx_fav_user ON favorite_articles(user_id);
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,               -- A unique UUID for the room
      user_id TEXT NOT NULL,             -- The ID of the logged-in patient/donor
      advertiser_id TEXT NOT NULL,       -- The ID or identifier of the advertiser
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,               -- A unique UUID for the message
      room_id TEXT NOT NULL,             -- Links the message to a specific chat room
      sender_id TEXT NOT NULL,           -- The ID of whoever sent the message
      sender_type TEXT CHECK(sender_type IN ('user', 'advertiser', 'system')) NOT NULL, -- Identifies if the sender is a user, advertiser, or automated system
      content TEXT NOT NULL,             -- The actual text of the message
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
`);

if (!isTest) {
    console.log('✅ Database initialized successfully at:', DB_PATH);
    import('./migrations').then(({ runMigrations }) => {
        runMigrations();
    }).catch(err => {
        console.error('Failed to run migrations:', err);
    });
}

export default db;
