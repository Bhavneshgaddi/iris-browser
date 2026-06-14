import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'iris.db')

  // Ensure the directory exists
  fs.mkdirSync(userDataPath, { recursive: true })

  db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined })

  // Performance settings
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = -32000')   // 32MB cache
  db.pragma('foreign_keys = ON')
  db.pragma('temp_store = MEMORY')

  runMigrations()
  console.log(`[DB] Initialized at ${dbPath}`)
}

function runMigrations() {
  // ── Schema version tracking ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version   INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const currentVersion = (db.prepare('SELECT MAX(version) as v FROM schema_migrations').get() as any)?.v ?? 0

  if (currentVersion < 1) {
    db.exec(`
      -- ── History ──────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS history (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        url         TEXT NOT NULL,
        title       TEXT NOT NULL DEFAULT '',
        favicon     TEXT,
        visit_count INTEGER NOT NULL DEFAULT 1,
        last_visit  TEXT NOT NULL DEFAULT (datetime('now')),
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
      CREATE INDEX IF NOT EXISTS idx_history_last_visit ON history(last_visit DESC);
      CREATE VIRTUAL TABLE IF NOT EXISTS history_fts USING fts5(url, title, content=history, content_rowid=id);

      -- ── Bookmark Folders ─────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS bookmark_folders (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        parent_id  INTEGER REFERENCES bookmark_folders(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO bookmark_folders (id, name) VALUES (1, 'Bookmarks Bar');
      INSERT OR IGNORE INTO bookmark_folders (id, name) VALUES (2, 'Other Bookmarks');

      -- ── Bookmarks ────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS bookmarks (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        url        TEXT NOT NULL,
        title      TEXT NOT NULL DEFAULT '',
        favicon    TEXT,
        folder_id  INTEGER NOT NULL DEFAULT 1 REFERENCES bookmark_folders(id) ON DELETE SET DEFAULT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);

      -- ── Downloads ────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS downloads (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        url          TEXT NOT NULL,
        filename     TEXT NOT NULL,
        file_path    TEXT,
        mime_type    TEXT,
        total_bytes  INTEGER DEFAULT 0,
        recv_bytes   INTEGER DEFAULT 0,
        status       TEXT NOT NULL DEFAULT 'pending',  -- pending|downloading|completed|failed|cancelled
        started_at   TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
      CREATE INDEX IF NOT EXISTS idx_downloads_started ON downloads(started_at DESC);

      -- ── Settings ─────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS settings (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Default settings
      INSERT OR IGNORE INTO settings (key, value) VALUES
        ('theme', '"system"'),
        ('search_engine', '"google"'),
        ('homepage', '"iris://newtab"'),
        ('show_bookmarks_bar', 'true'),
        ('open_links_in_new_tab', 'false'),
        ('enable_javascript', 'true'),
        ('block_popups', 'true'),
        ('download_path', '""'),
        ('zoom_level', '100'),
        ('font_size', '16'),
        ('enable_spell_check', 'true'),
        ('restore_tabs_on_startup', 'true'),
        ('hardware_acceleration', 'true');

      -- ── Sessions (for restore-tabs) ───────────────────────────────────────
      CREATE TABLE IF NOT EXISTS sessions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        tab_id      TEXT NOT NULL,
        url         TEXT NOT NULL,
        title       TEXT NOT NULL DEFAULT '',
        favicon     TEXT,
        tab_index   INTEGER NOT NULL DEFAULT 0,
        is_pinned   INTEGER NOT NULL DEFAULT 0,
        saved_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- ── Notes (Phase 4, schema ready) ────────────────────────────────────
      CREATE TABLE IF NOT EXISTS notes (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT NOT NULL DEFAULT 'Untitled Note',
        content    TEXT NOT NULL DEFAULT '',
        url        TEXT,              -- linked website
        folder_id  INTEGER,
        tags       TEXT DEFAULT '[]', -- JSON array
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO schema_migrations (version) VALUES (1);
    `)

    console.log('[DB] Migration v1 applied')
  }
}
