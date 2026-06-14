import { create } from 'zustand'
import type { Settings } from '@/types'

interface SettingsState {
  settings: Settings
  isLoaded: boolean
  load: () => Promise<void>
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>
  reset: () => Promise<void>
}

const DEFAULTS: Settings = {
  theme: 'system',
  search_engine: 'google',
  homepage: 'iris://newtab',
  show_bookmarks_bar: true,
  open_links_in_new_tab: false,
  enable_javascript: true,
  block_popups: true,
  download_path: '',
  zoom_level: 100,
  font_size: 16,
  enable_spell_check: true,
  restore_tabs_on_startup: true,
  hardware_acceleration: true,
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULTS,
  isLoaded: false,

  load: async () => {
    if (typeof window.jarvis === 'undefined') {
      set({ isLoaded: true })
      return
    }
    const all = await window.jarvis.settings.getAll()
    set({ settings: { ...DEFAULTS, ...all }, isLoaded: true })
  },

  update: async (key, value) => {
    set(state => ({ settings: { ...state.settings, [key]: value } }))
    await window.jarvis?.settings.set(key, value)
  },

  reset: async () => {
    await window.jarvis?.settings.reset()
    set({ settings: DEFAULTS })
  },
}))
