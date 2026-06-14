import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerNotesHandlers() {
  ipcMain.handle('notes:get-all', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all()
  })

  ipcMain.handle('notes:get', (_e, id: number) => {
    const db = getDb()
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
  })

  ipcMain.handle('notes:create', (_e, data: { title?: string; content?: string; url?: string; tags?: string[] }) => {
    const db = getDb()
    const result = db.prepare(`
      INSERT INTO notes (title, content, url, tags)
      VALUES (?, ?, ?, ?)
    `).run(
      data.title ?? 'Untitled Note',
      data.content ?? '',
      data.url ?? null,
      JSON.stringify(data.tags ?? [])
    )
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid)
  })

  ipcMain.handle('notes:update', (_e, id: number, patch: { title?: string; content?: string; url?: string; tags?: string[] }) => {
    const db = getDb()
    const fields: string[] = []
    const values: unknown[] = []
    if (patch.title !== undefined) { fields.push('title = ?'); values.push(patch.title) }
    if (patch.content !== undefined) { fields.push('content = ?'); values.push(patch.content) }
    if (patch.url !== undefined) { fields.push('url = ?'); values.push(patch.url) }
    if (patch.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(patch.tags)) }
    if (!fields.length) return null
    fields.push("updated_at = datetime('now')")
    values.push(id)
    db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
  })

  ipcMain.handle('notes:delete', (_e, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM notes WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle('notes:search', (_e, query: string) => {
    const db = getDb()
    const q = `%${query}%`
    return db.prepare(`
      SELECT * FROM notes
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY updated_at DESC LIMIT 50
    `).all(q, q)
  })
}
