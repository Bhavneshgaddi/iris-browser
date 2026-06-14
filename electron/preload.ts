import { contextBridge, ipcRenderer } from 'electron'

// ─── Type-safe IPC API exposed to renderer ────────────────────────────────
const api = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  },

  // Theme
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (theme: 'dark' | 'light' | 'system') => ipcRenderer.invoke('theme:set', theme),
    onChange: (cb: (theme: string) => void) => {
      ipcRenderer.on('theme:changed', (_e, t) => cb(t))
      return () => ipcRenderer.removeAllListeners('theme:changed')
    },
  },

  // History
  history: {
    add: (entry: { url: string; title: string; favicon?: string }) =>
      ipcRenderer.invoke('history:add', entry),
    getAll: (limit?: number) => ipcRenderer.invoke('history:get-all', limit),
    search: (query: string) => ipcRenderer.invoke('history:search', query),
    delete: (id: number) => ipcRenderer.invoke('history:delete', id),
    clear: () => ipcRenderer.invoke('history:clear'),
  },

  // Bookmarks
  bookmarks: {
    add: (bookmark: { url: string; title: string; favicon?: string; folderId?: number }) =>
      ipcRenderer.invoke('bookmarks:add', bookmark),
    getAll: () => ipcRenderer.invoke('bookmarks:get-all'),
    getFolders: () => ipcRenderer.invoke('bookmarks:get-folders'),
    createFolder: (name: string, parentId?: number) =>
      ipcRenderer.invoke('bookmarks:create-folder', name, parentId),
    delete: (id: number) => ipcRenderer.invoke('bookmarks:delete', id),
    deleteFolder: (id: number) => ipcRenderer.invoke('bookmarks:delete-folder', id),
    update: (id: number, data: Partial<{ title: string; url: string; folderId: number }>) =>
      ipcRenderer.invoke('bookmarks:update', id, data),
    isBookmarked: (url: string) => ipcRenderer.invoke('bookmarks:is-bookmarked', url),
  },

  // Downloads
  downloads: {
    getAll: () => ipcRenderer.invoke('downloads:get-all'),
    delete: (id: number) => ipcRenderer.invoke('downloads:delete', id),
    clear: () => ipcRenderer.invoke('downloads:clear'),
    openFolder: (filePath: string) => ipcRenderer.invoke('downloads:open-folder', filePath),
    onProgress: (cb: (data: { id: string; progress: number; speed: number }) => void) => {
      ipcRenderer.on('downloads:progress', (_e, d) => cb(d))
      return () => ipcRenderer.removeAllListeners('downloads:progress')
    },
    onComplete: (cb: (data: { id: string; state: string }) => void) => {
      ipcRenderer.on('downloads:complete', (_e, d) => cb(d))
      return () => ipcRenderer.removeAllListeners('downloads:complete')
    },
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },

  // App info
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    path: (name: string) => ipcRenderer.invoke('app:path', name),
  },

  // Session (tab restore)
  session: {
    save: (tabs: Array<{ tabId: string; url: string; title: string; favicon?: string; tabIndex: number; isPinned: boolean }>) =>
      ipcRenderer.invoke('session:save', tabs),
    load: () => ipcRenderer.invoke('session:load'),
    clear: () => ipcRenderer.invoke('session:clear'),
  },

  // Dialog
  dialog: {
    save: (options: Electron.SaveDialogOptions) => ipcRenderer.invoke('dialog:save', options),
    open: (options: Electron.OpenDialogOptions) => ipcRenderer.invoke('dialog:open', options),
  },

  // Menu events from main process
  on: (channel: string, cb: (...args: unknown[]) => void) => {
    const validChannels = [
      'menu:new-tab', 'menu:close-tab', 'menu:go-back', 'menu:go-forward',
      'menu:open-history', 'menu:clear-data', 'menu:bookmark-page', 'menu:open-bookmarks',
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_e, ...args) => cb(...args))
      return () => ipcRenderer.removeAllListeners(channel)
    }
    return () => {}
  },
  // Performance
  performance: {
    metrics: () => ipcRenderer.invoke('performance:metrics'),
    cpu: () => ipcRenderer.invoke('performance:cpu'),
    battery: () => ipcRenderer.invoke('performance:battery'),
    clearCache: () => ipcRenderer.invoke('performance:clear-cache'),
    clearStorage: (origins: string[]) => ipcRenderer.invoke('performance:clear-storage', origins),
  },

  // Privacy
  privacy: {
    setBlocking: (enabled: boolean) => ipcRenderer.invoke('privacy:set-blocking', enabled),
    getStats: () => ipcRenderer.invoke('privacy:get-stats'),
    resetStats: () => ipcRenderer.invoke('privacy:reset-stats'),
    getCookies: (url?: string) => ipcRenderer.invoke('privacy:get-cookies', url),
    removeCookie: (url: string, name: string) => ipcRenderer.invoke('privacy:remove-cookie', url, name),
    clearCookies: () => ipcRenderer.invoke('privacy:clear-cookies'),
    clearAll: () => ipcRenderer.invoke('privacy:clear-history-and-cache'),
  },

  // Notes
  notes: {
    getAll: () => ipcRenderer.invoke('notes:get-all'),
    get: (id: number) => ipcRenderer.invoke('notes:get', id),
    create: (data: { title?: string; content?: string; url?: string; tags?: string[] }) => ipcRenderer.invoke('notes:create', data),
    update: (id: number, patch: { title?: string; content?: string; url?: string; tags?: string[] }) => ipcRenderer.invoke('notes:update', id, patch),
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id),
    search: (query: string) => ipcRenderer.invoke('notes:search', query),
  },

  // AI
  ai: {
    chat: (message: string, context?: string) => ipcRenderer.invoke('ai:chat', message, context),
    summarize: (text: string) => ipcRenderer.invoke('ai:summarize', text),
    explain: (selectedText: string) => ipcRenderer.invoke('ai:explain', selectedText),
    translate: (text: string, lang: string) => ipcRenderer.invoke('ai:translate', text, lang),
    speak: (text: string) => ipcRenderer.invoke('ai:speak', text),
  },
}

contextBridge.exposeInMainWorld('jarvis', api)

// Type declaration for renderer
export type JarvisAPI = typeof api
