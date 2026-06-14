import { vi } from 'vitest'

// Mock window.jarvis (Electron preload API)
Object.defineProperty(window, 'jarvis', {
  value: {
    window: {
      minimize: vi.fn(), maximize: vi.fn(), close: vi.fn(),
      isMaximized: vi.fn().mockResolvedValue(false),
    },
    theme: {
      get: vi.fn().mockResolvedValue('dark'),
      set: vi.fn().mockResolvedValue(undefined),
      onChange: vi.fn().mockReturnValue(() => {}),
    },
    history: {
      add: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
    bookmarks: {
      add: vi.fn().mockResolvedValue(1),
      getAll: vi.fn().mockResolvedValue([]),
      getFolders: vi.fn().mockResolvedValue([]),
      createFolder: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteFolder: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      isBookmarked: vi.fn().mockResolvedValue(null),
    },
    downloads: {
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      onProgress: vi.fn().mockReturnValue(() => {}),
    },
    settings: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue({}),
      reset: vi.fn().mockResolvedValue(undefined),
    },
    app: {
      version: vi.fn().mockResolvedValue('1.0.0'),
      path: vi.fn().mockResolvedValue('/mock/path'),
    },
    dialog: {
      save: vi.fn().mockResolvedValue({ canceled: true }),
      open: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }),
    },
    on: vi.fn().mockReturnValue(() => {}),
  },
  writable: true,
})
