import { ipcMain, BrowserWindow, app, shell } from 'electron'
import { getDb } from '../database'
import path from 'path'

export function registerDownloadHandlers() {
  // Set up download handling when a window starts a download
  app.on('browser-window-created', (_e, win) => {
    win.webContents.session.on('will-download', (event, item, webContents) => {
      const db = getDb()
      const filename = item.getFilename()
      const downloadPath = path.join(app.getPath('downloads'), filename)
      item.setSavePath(downloadPath)

      const result = db.prepare(`
        INSERT INTO downloads (url, filename, file_path, mime_type, total_bytes, status)
        VALUES (?, ?, ?, ?, ?, 'downloading')
      `).run(item.getURL(), filename, downloadPath, item.getMimeType(), item.getTotalBytes())

      const downloadId = result.lastInsertRowid

      item.on('updated', (_e, state) => {
        if (state === 'progressing') {
          const progress = item.getReceivedBytes() / (item.getTotalBytes() || 1)
          webContents.send('downloads:progress', {
            id: String(downloadId),
            progress,
            speed: item.getCurrentBytesPerSecond(),
            receivedBytes: item.getReceivedBytes(),
          })
        }
      })

      item.once('done', (_e, state) => {
        db.prepare(`
          UPDATE downloads SET status = ?, recv_bytes = ?, completed_at = datetime('now')
          WHERE id = ?
        `).run(state === 'completed' ? 'completed' : 'failed', item.getReceivedBytes(), downloadId)

        webContents.send('downloads:complete', { id: String(downloadId), state })
      })
    })
  })

  ipcMain.handle('downloads:get-all', () => {
    const db = getDb()
    return db.prepare('SELECT * FROM downloads ORDER BY started_at DESC LIMIT 200').all()
  })

  ipcMain.handle('downloads:delete', (_event, id: number) => {
    const db = getDb()
    db.prepare('DELETE FROM downloads WHERE id = ?').run(id)
  })

  ipcMain.handle('downloads:clear', () => {
    const db = getDb()
    db.prepare("DELETE FROM downloads WHERE status != 'downloading'").run()
  })

  ipcMain.handle('downloads:open-folder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
  })
}
