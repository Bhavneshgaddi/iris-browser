import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  shell,
  dialog,
  nativeTheme,
  Menu,
  MenuItemConstructorOptions,
} from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './database'
import { registerHistoryHandlers } from './ipc/history'
import { registerBookmarkHandlers } from './ipc/bookmarks'
import { registerDownloadHandlers } from './ipc/downloads'
import { registerSettingsHandlers } from './ipc/settings'
import { registerWindowHandlers } from './ipc/window'
import { registerPerformanceHandlers } from './ipc/performance'
import { registerPrivacyHandlers } from './ipc/privacy'
import { registerNotesHandlers } from './ipc/notes'
import { registerAiHandlers } from './ipc/ai'



const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── App State ────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// ─── Window Creation ──────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,           // Custom titlebar
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#0E0F14',
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,      // Enable <webview> for browser tabs
      sandbox: false,        // Needed for webview IPC
      webSecurity: true,
    },
  })

  // Graceful show after load
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  // Load app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Handle external links — open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  setupMenu()
}

// ─── Application Menu ──────────────────────────────────────────────────────
function setupMenu() {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow?.webContents.send('menu:new-tab'),
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow(),
        },
        {
          label: 'New Incognito Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => createIncognitoWindow(),
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('menu:close-tab'),
        },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => mainWindow?.webContents.send('menu:go-back'),
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => mainWindow?.webContents.send('menu:go-forward'),
        },
        { type: 'separator' },
        {
          label: 'Show All History',
          accelerator: 'CmdOrCtrl+Y',
          click: () => mainWindow?.webContents.send('menu:open-history'),
        },
        {
          label: 'Clear Browsing Data',
          accelerator: 'CmdOrCtrl+Shift+Delete',
          click: () => mainWindow?.webContents.send('menu:clear-data'),
        },
      ],
    },
    {
      label: 'Bookmarks',
      submenu: [
        {
          label: 'Bookmark This Page',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow?.webContents.send('menu:bookmark-page'),
        },
        {
          label: 'Show All Bookmarks',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => mainWindow?.webContents.send('menu:open-bookmarks'),
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ─── Incognito Window ──────────────────────────────────────────────────────
function createIncognitoWindow() {
  const incognitoSession = session.fromPartition('incognito', { cache: false })

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#0E0F14',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      session: incognitoSession,
    },
  })

  win.once('ready-to-show', () => win.show())

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}?incognito=true`)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { incognito: 'true' },
    })
  }
}

// ─── IPC: Theme ────────────────────────────────────────────────────────────
ipcMain.handle('theme:get', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
ipcMain.handle('theme:set', (_event, theme: 'dark' | 'light' | 'system') => {
  nativeTheme.themeSource = theme
  mainWindow?.webContents.send('theme:changed', theme)
})

// ─── IPC: App Info ─────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:path', (_event, name: string) => app.getPath(name as any))

// ─── IPC: Dialogs ──────────────────────────────────────────────────────────
ipcMain.handle('dialog:save', async (_event, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options)
  return result
})

ipcMain.handle('dialog:open', async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options)
  return result
})

// ─── IPC: Window Controls ──────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)

// ─── App Lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Initialize SQLite database
  await initDatabase()

  // Register all IPC handlers
  registerHistoryHandlers()
  registerBookmarkHandlers()
  registerDownloadHandlers()
  registerSettingsHandlers()
  registerWindowHandlers()
  registerPerformanceHandlers()
  registerPrivacyHandlers()
  registerNotesHandlers()
  registerAiHandlers()

  // Configure session for security
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['SAMEORIGIN'],
        'Referrer-Policy': ['strict-origin-when-cross-origin'],
      },
    })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Prevent navigation to unknown protocols
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    try {
      const parsed = new URL(url)
      if (!['https:', 'http:', 'file:', 'iris:', 'jarvis:'].includes(parsed.protocol)) {
        event.preventDefault()
      }
    } catch {
      event.preventDefault()
    }
  })
})
