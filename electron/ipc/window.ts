import { ipcMain } from 'electron'
import { getDb } from '../database'

export function registerWindowHandlers() {
  // Save session (tabs) for restore on startup
  ipcMain.handle('session:save', (_event, tabs: Array<{
    tabId: string; url: string; title: string; favicon?: string; tabIndex: number; isPinned: boolean
  }>) => {
    const db = getDb()
    db.prepare('DELETE FROM sessions').run()
    const stmt = db.prepare(`
      INSERT INTO sessions (tab_id, url, title, favicon, tab_index, is_pinned)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    for (const tab of tabs) {
      stmt.run(tab.tabId, tab.url, tab.title, tab.favicon ?? null, tab.tabIndex, tab.isPinned ? 1 : 0)
    }
  })

  ipcMain.handle('session:load', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM sessions ORDER BY tab_index ASC').all()
  })

  ipcMain.handle('session:clear', () => {
    const db = getDb()
    db.prepare('DELETE FROM sessions').run()
  })
}
