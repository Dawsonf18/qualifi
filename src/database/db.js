const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../lib/logger');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'qualifi.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    contact_id TEXT,
    lead_name TEXT NOT NULL,
    lead_phone TEXT NOT NULL,
    outcome TEXT CHECK(outcome IN ('transfer', 'booked', 'not_qualified') OR outcome IS NULL),
    booked_time TEXT,
    transcript TEXT,
    recording_url TEXT,
    ended_reason TEXT,
    duration_seconds INTEGER,
    form_answers TEXT,
    is_retry INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
  CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
  CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
`);

logger.info('SQLite database ready', { path: DB_PATH });

module.exports = db;
