import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerBookmarkHandlers() {
  ipcMain.handle('bookmarks:add', (_event, bookmark: {
    url: string; title: string; favicon?: string; folderId?: number
  }) => {
    const db = getDb()
    const result = db.prepare(`
      INSERT INTO bookmarks (url, title, favicon, folder_id)
      VALUES (?, ?, ?, ?)
    `).run(bookmark.url, bookmark.title, bookmark.favicon ?? null, bookmark.folderId ?? 1)
    return result.lastInsertRowid
  })

  ipcMain.handle('bookmarks:get-all', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM bookmarks ORDER BY folder_id, sort_order, created_at').all()
  })

  ipcMain.handle('bookmarks:get-folders', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM bookmark_folders ORDER BY parent_id NULLS FIRST, sort_order').all()
  })

  ipcMain.handle('bookmarks:create-folder', (_event, name: string, parentId?: number) => {
    const db = getDb()
    const result = db.prepare(`
      INSERT INTO bookmark_folders (name, parent_id) VALUES (?, ?)
    `).run(name, parentId ?? null)
    return result.lastInsertRowid
  })

  ipcMain.handle('bookmarks:delete', (_event, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id)
  })

  ipcMain.handle('bookmarks:delete-folder', (_event, id: number) => {
    const db = getDb()
    // Move bookmarks in this folder to "Other Bookmarks"
    db.prepare('UPDATE bookmarks SET folder_id = 2 WHERE folder_id = ?').run(id)
    db.prepare('DELETE FROM bookmark_folders WHERE id = ?').run(id)
  })

  ipcMain.handle('bookmarks:update', (_event, id: number, data: {
    title?: string; url?: string; folderId?: number
  }) => {
    const db = getDb()
    const sets: string[] = []
    const values: unknown[] = []

    if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title) }
    if (data.url !== undefined) { sets.push('url = ?'); values.push(data.url) }
    if (data.folderId !== undefined) { sets.push('folder_id = ?'); values.push(data.folderId) }
    sets.push("updated_at = datetime('now')")

    if (sets.length === 0) return
    values.push(id)

    db.prepare(`UPDATE bookmarks SET ${sets.join(', ')} WHERE id = ?`).run(...values)
  })

  ipcMain.handle('bookmarks:is-bookmarked', (_event, url: string) => {
    const db = getDb()
    const row = db.prepare('SELECT id FROM bookmarks WHERE url = ?').get(url) as any
    return row ? row.id : null
  })
}
