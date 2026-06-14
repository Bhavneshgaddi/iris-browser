import { create } from 'zustand'

interface PrivacyStats { blockedCount: number; blockingEnabled: boolean }

interface PrivacyState {
  stats: PrivacyStats
  isLoaded: boolean
  load: () => Promise<void>
  setBlocking: (enabled: boolean) => Promise<void>
  clearCookies: () => Promise<void>
  clearAll: () => Promise<void>
  resetStats: () => Promise<void>
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  stats: { blockedCount: 0, blockingEnabled: true },
  isLoaded: false,

  load: async () => {
    const stats = await window.jarvis?.privacy?.getStats()
    if (stats) set({ stats, isLoaded: true })
  },

  setBlocking: async (enabled) => {
    await window.jarvis?.privacy?.setBlocking(enabled)
    set(s => ({ stats: { ...s.stats, blockingEnabled: enabled } }))
  },

  clearCookies: async () => { await window.jarvis?.privacy?.clearCookies() },

  clearAll: async () => { await window.jarvis?.privacy?.clearAll() },

  resetStats: async () => {
    await window.jarvis?.privacy?.resetStats()
    set(s => ({ stats: { ...s.stats, blockedCount: 0 } }))
  },
}))
