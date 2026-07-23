import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

export function initDatabase() {
  db = new Database(join(__dirname, 'sakon.db'));

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      letter_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS send_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      letter_id TEXT NOT NULL,
      letter_type TEXT NOT NULL,
      method TEXT NOT NULL,
      destination TEXT,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (letter_id) REFERENCES letters(id)
    );
  `);

  console.log(' Database initialized');
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
