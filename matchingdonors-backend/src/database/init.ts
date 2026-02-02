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
        role TEXT NOT NULL CHECK(role IN ('patient', 'donor')),
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
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('patient', 'donor')),
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(type);
    CREATE INDEX IF NOT EXISTS idx_profiles_blood_type ON profiles(blood_type);
    CREATE INDEX IF NOT EXISTS idx_profiles_organ_type ON profiles(organ_type);
    CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
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

if (!isTest) {
    console.log('✅ Database initialized successfully at:', DB_PATH);
}

export default db;
