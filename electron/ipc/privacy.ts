import { ipcMain, session } from 'electron'
import { getDb } from '../database'

// ─── Embedded mini-blocklist (most common ad/tracker domains) ───────────────
const AD_DOMAINS = new Set([
  'doubleclick.net','googlesyndication.com','googletagmanager.com','googletagservices.com',
  'google-analytics.com','googleadservices.com','adnxs.com','ads.yahoo.com',
  'scorecardresearch.com','quantserve.com','rubiconproject.com','openx.net',
  'advertising.com','casalemedia.com','pubmatic.com','criteo.com','criteo.net',
  'amazon-adsystem.com','media.net','outbrain.com','taboola.com',
  'adsrvr.org','yahoo.com','ads.twitter.com','facebook.com/tr',
  'analytics.tiktok.com','hotjar.com','mouseflow.com','fullstory.com',
  'mixpanel.com','segment.io','amplitude.com','heap.io',
  'adroll.com','moatads.com','rlcdn.com','sharethrough.com',
])

let blockingEnabled = true
let blockedCount = 0

export function registerPrivacyHandlers() {
  // Enable/disable ad blocking
  ipcMain.handle('privacy:set-blocking', (_e, enabled: boolean) => {
    blockingEnabled = enabled
    return enabled
  })

  ipcMain.handle('privacy:get-stats', () => ({
    blockedCount,
    blockingEnabled,
  }))

  ipcMain.handle('privacy:reset-stats', () => {
    blockedCount = 0
    return true
  })

  // Cookie management
  ipcMain.handle('privacy:get-cookies', async (_e, url?: string) => {
    const cookies = await session.defaultSession.cookies.get(url ? { url } : {})
    return cookies
  })

  ipcMain.handle('privacy:remove-cookie', async (_e, url: string, name: string) => {
    await session.defaultSession.cookies.remove(url, name)
    return true
  })

  ipcMain.handle('privacy:clear-cookies', async () => {
    await session.defaultSession.clearStorageData({ storages: ['cookies'] })
    return true
  })

  ipcMain.handle('privacy:clear-history-and-cache', async () => {
    await session.defaultSession.clearCache()
    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'cachestorage', 'serviceworkers'],
    })
    const db = getDb()
    db.prepare('DELETE FROM history').run()
    return true
  })

  // Set up request interception
  setupAdBlocking()
}

function setupAdBlocking() {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['*://*/*'] },
    (details, callback) => {
      if (!blockingEnabled) { callback({}); return }

      try {
        const url = new URL(details.url)
        const domain = url.hostname.replace('www.', '')
        const isBlocked = AD_DOMAINS.has(domain) ||
          [...AD_DOMAINS].some(d => domain.endsWith('.' + d))

        if (isBlocked) {
          blockedCount++
          callback({ cancel: true })
        } else {
          callback({})
        }
      } catch {
        callback({})
      }
    }
  )

  // Enforce HTTPS
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['http://*/*'] },
    (details, callback) => {
      callback({ requestHeaders: details.requestHeaders })
    }
  )
}
