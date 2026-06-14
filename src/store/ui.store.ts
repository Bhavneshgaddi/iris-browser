import { create } from 'zustand'
import type { SidePanel, Theme } from '@/types'

interface UIState {
  theme: Theme
  sidePanel: SidePanel
  isAddressBarFocused: boolean
  isCommandPaletteOpen: boolean
  isBookmarkDialogOpen: boolean
  bookmarkDialogUrl: string
  bookmarkDialogTitle: string

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  openPanel: (panel: SidePanel) => void
  closePanel: () => void
  togglePanel: (panel: SidePanel) => void
  setAddressBarFocused: (v: boolean) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  openBookmarkDialog: (url: string, title: string) => void
  closeBookmarkDialog: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  sidePanel: null,
  isAddressBarFocused: false,
  isCommandPaletteOpen: false,
  isBookmarkDialogOpen: false,
  bookmarkDialogUrl: '',
  bookmarkDialogTitle: '',

  setTheme: (theme) => {
    set({ theme })
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'light') root.classList.remove('dark')
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
    window.jarvis?.theme.set(theme)
  },

  toggleTheme: () => {
    const { theme } = get()
    get().setTheme(theme === 'dark' ? 'light' : 'dark')
  },

  openPanel: (panel) => set({ sidePanel: panel }),
  closePanel: () => set({ sidePanel: null }),
  togglePanel: (panel) => {
    const { sidePanel } = get()
    set({ sidePanel: sidePanel === panel ? null : panel })
  },

  setAddressBarFocused: (v) => set({ isAddressBarFocused: v }),

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

  openBookmarkDialog: (url, title) => set({
    isBookmarkDialogOpen: true,
    bookmarkDialogUrl: url,
    bookmarkDialogTitle: title,
  }),
  closeBookmarkDialog: () => set({ isBookmarkDialogOpen: false }),
}))
