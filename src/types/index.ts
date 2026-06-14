// ─── Tab ──────────────────────────────────────────────────────────────────────
export type TabStatus = 'loading' | 'complete' | 'error'

export interface Tab {
  id: string
  url: string
  title: string
  favicon?: string
  status: TabStatus
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
  isPinned: boolean
  isMuted: boolean
  isActive: boolean
  isSleeping?: boolean
  scrollY?: number
  zoom: number
  createdAt: number
}

export interface ClosedTab {
  id: string
  url: string
  title: string
  favicon?: string
  closedAt: number
}

// ─── History ──────────────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: number
  url: string
  title: string
  favicon?: string
  visit_count: number
  last_visit: string
  created_at: string
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export interface BookmarkFolder {
  id: number
  name: string
  parent_id?: number
  sort_order: number
  created_at: string
}

export interface Bookmark {
  id: number
  url: string
  title: string
  favicon?: string
  folder_id: number
  sort_order: number
  created_at: string
  updated_at: string
}

// ─── Downloads ────────────────────────────────────────────────────────────────
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'

export interface Download {
  id: number
  url: string
  filename: string
  file_path?: string
  mime_type?: string
  total_bytes: number
  recv_bytes: number
  status: DownloadStatus
  started_at: string
  completed_at?: string
  // Runtime only
  progress?: number
  speed?: number
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'brave' | 'ecosia' | 'yahoo'
export type Theme = 'dark' | 'light' | 'system'

export interface Settings {
  theme: Theme
  search_engine: SearchEngine
  homepage: string
  show_bookmarks_bar: boolean
  open_links_in_new_tab: boolean
  enable_javascript: boolean
  block_popups: boolean
  download_path: string
  zoom_level: number
  font_size: number
  enable_spell_check: boolean
  restore_tabs_on_startup: boolean
  hardware_acceleration: boolean
}

export const SEARCH_ENGINES: Record<SearchEngine, { name: string; url: string; suggest: string }> = {
  google:     { name: 'Google',     url: 'https://www.google.com/search?q=',     suggest: 'https://suggestqueries.google.com/complete/search?client=firefox&q=' },
  bing:       { name: 'Bing',       url: 'https://www.bing.com/search?q=',       suggest: 'https://www.bing.com/osjson.aspx?query=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=',           suggest: 'https://duckduckgo.com/ac/?q=' },
  brave:      { name: 'Brave',      url: 'https://search.brave.com/search?q=',   suggest: 'https://search.brave.com/api/suggest?q=' },
  ecosia:     { name: 'Ecosia',     url: 'https://www.ecosia.org/search?q=',     suggest: 'https://ac.ecosia.org/autocomplete?q=' },
  yahoo:      { name: 'Yahoo',      url: 'https://search.yahoo.com/search?p=',   suggest: 'https://ff.search.yahoo.com/gossip?output=fxjson&command=' },
}

// ─── UI Panels ────────────────────────────────────────────────────────────────
export type SidePanel = 'bookmarks' | 'history' | 'downloads' | 'settings' | 'performance' | 'privacy' | 'notes' | 'ai' | 'research' | 'exam' | null

// ─── Window ───────────────────────────────────────────────────────────────────
export interface WindowState {
  isMaximized: boolean
  isFullscreen: boolean
  isFocused: boolean
}

// ─── Electron IPC API (window.jarvis) ────────────────────────────────────────
export interface JarvisAPI {
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
  }
  theme: {
    get: () => Promise<Theme>
    set: (theme: Theme) => Promise<void>
    onChange: (cb: (theme: string) => void) => () => void
  }
  history: {
    add: (entry: { url: string; title: string; favicon?: string }) => Promise<void>
    getAll: (limit?: number) => Promise<HistoryEntry[]>
    search: (query: string) => Promise<HistoryEntry[]>
    delete: (id: number) => Promise<void>
    clear: () => Promise<void>
  }
  bookmarks: {
    add: (b: { url: string; title: string; favicon?: string; folderId?: number }) => Promise<number>
    getAll: () => Promise<Bookmark[]>
    getFolders: () => Promise<BookmarkFolder[]>
    createFolder: (name: string, parentId?: number) => Promise<number>
    delete: (id: number) => Promise<void>
    deleteFolder: (id: number) => Promise<void>
    update: (id: number, data: Partial<{ title: string; url: string; folderId: number }>) => Promise<void>
    isBookmarked: (url: string) => Promise<number | null>
  }
  downloads: {
    getAll: () => Promise<Download[]>
    delete: (id: number) => Promise<void>
    clear: () => Promise<void>
    openFolder: (filePath: string) => Promise<void>
    onProgress: (cb: (data: { id: string; progress: number; speed: number }) => void) => () => void
    onComplete: (cb: (data: { id: string; state: string }) => void) => () => void
  }
  settings: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    getAll: () => Promise<Settings>
    reset: () => Promise<void>
  }
  app: {
    version: () => Promise<string>
    path: (name: string) => Promise<string>
  }
  session: {
    save: (tabs: Array<{ tabId: string; url: string; title: string; favicon?: string; tabIndex: number; isPinned: boolean }>) => Promise<void>
    load: () => Promise<Array<{ tab_id: string; url: string; title: string; favicon?: string; tab_index: number; is_pinned: number }>>
    clear: () => Promise<void>
  }
  dialog: {
    save: (options: object) => Promise<{ canceled: boolean; filePath?: string }>
    open: (options: object) => Promise<{ canceled: boolean; filePaths: string[] }>
  }
  performance: {
    metrics: () => Promise<{
      mainHeapMB: number
      totalProcessMB: number
      processCount: number
      processes: Array<{ pid: number; type: string; memoryMB: number }>
    }>
    cpu: () => Promise<number>
    battery: () => Promise<{ onBattery: boolean; percent: number }>
    clearCache: () => Promise<void>
    clearStorage: (origins: string[]) => Promise<void>
  }
  privacy: {
    setBlocking: (enabled: boolean) => Promise<boolean>
    getStats: () => Promise<{ blockedCount: number; blockingEnabled: boolean }>
    resetStats: () => Promise<void>
    getCookies: (url?: string) => Promise<any[]>
    removeCookie: (url: string, name: string) => Promise<void>
    clearCookies: () => Promise<void>
    clearAll: () => Promise<void>
  }
  notes: {
    getAll: () => Promise<any[]>
    get: (id: number) => Promise<any>
    create: (data: { title?: string; content?: string; url?: string; tags?: string[] }) => Promise<any>
    update: (id: number, patch: { title?: string; content?: string; url?: string; tags?: string[] }) => Promise<any>
    delete: (id: number) => Promise<void>
    search: (query: string) => Promise<any[]>
  }
  ai: {
    chat: (message: string, context?: string) => Promise<string>
    summarize: (text: string) => Promise<string>
    explain: (selectedText: string) => Promise<string>
    translate: (text: string, lang: string) => Promise<string>
    speak: (text: string) => Promise<boolean>
  }
  on: (channel: string, cb: (...args: unknown[]) => void) => () => void
}

declare global {
  interface Window {
    jarvis: JarvisAPI
  }
}
