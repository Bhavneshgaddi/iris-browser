import { ipcMain } from 'electron'
import { getDb } from '../database'

const DEFAULTS: Record<string, unknown> = {
  theme: 'system',
  search_engine: 'google',
  homepage: 'iris://newtab',
  show_bookmarks_bar: true,
  open_links_in_new_tab: false,
  enable_javascript: true,
  block_popups: true,
  download_path: '',
  zoom_level: 100,
  font_size: 16,
  enable_spell_check: true,
  restore_tabs_on_startup: true,
  hardware_acceleration: true,
}

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', (_event, key: string) => {
    const db = getDb()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
    if (!row) return DEFAULTS[key] ?? null
    try { return JSON.parse(row.value) } catch { return row.value }
  })

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    const db = getDb()
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(key, JSON.stringify(value))
  })

  ipcMain.handle('settings:get-all', () => {
    const db = getDb()
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    return Object.fromEntries(
      rows.map(r => {
        try { return [r.key, JSON.parse(r.value)] } catch { return [r.key, r.value] }
      })
    )
  })

  ipcMain.handle('settings:reset', () => {
    const db = getDb()
    db.prepare('DELETE FROM settings').run()
    const stmt = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
    for (const [key, value] of Object.entries(DEFAULTS)) {
      stmt.run(key, JSON.stringify(value))
    }
  })
}
