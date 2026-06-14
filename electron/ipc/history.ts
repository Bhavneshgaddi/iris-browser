import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerHistoryHandlers() {
  ipcMain.handle('history:add', (_event, entry: { url: string; title: string; favicon?: string }) => {
    const db = getDb()
    const existing = db.prepare('SELECT id, visit_count FROM history WHERE url = ?').get(entry.url) as any

    if (existing) {
      db.prepare(`
        UPDATE history SET visit_count = visit_count + 1, last_visit = datetime('now'), title = ?, favicon = ?
        WHERE id = ?
      `).run(entry.title, entry.favicon ?? null, existing.id)

      db.prepare(`
        INSERT INTO history_fts(history_fts, rowid, url, title) VALUES ('delete', ?, ?, ?)
      `).run(existing.id, entry.url, entry.title)
    } else {
      const result = db.prepare(`
        INSERT INTO history (url, title, favicon) VALUES (?, ?, ?)
      `).run(entry.url, entry.title, entry.favicon ?? null)

      db.prepare(`
        INSERT INTO history_fts(rowid, url, title) VALUES (?, ?, ?)
      `).run(result.lastInsertRowid, entry.url, entry.title)
    }
  })

  ipcMain.handle('history:get-all', (_event, limit = 500) => {
    const db = getDb()
    return db.prepare(`
      SELECT * FROM history ORDER BY last_visit DESC LIMIT ?
    `).all(limit)
  })

  ipcMain.handle('history:search', (_event, query: string) => {
    const db = getDb()
    return db.prepare(`
      SELECT h.* FROM history h
      JOIN history_fts ON history_fts.rowid = h.id
      WHERE history_fts MATCH ?
      ORDER BY h.last_visit DESC LIMIT 50
    `).all(query + '*')
  })

  ipcMain.handle('history:delete', (_event, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM history WHERE id = ?').run(id)
  })

  ipcMain.handle('history:clear', () => {
    const db = getDb()
    db.prepare('DELETE FROM history').run()
    db.prepare("INSERT INTO history_fts(history_fts) VALUES ('rebuild')").run()
  })
}
