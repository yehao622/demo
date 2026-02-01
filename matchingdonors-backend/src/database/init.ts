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
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('patient', 'donor')),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
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

if (!isTest) {
    console.log('✅ Database initialized successfully at:', DB_PATH);
}

export default db;
