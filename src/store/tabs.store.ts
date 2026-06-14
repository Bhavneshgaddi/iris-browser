import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Tab, ClosedTab } from '@/types'

const NEW_TAB_URL = 'iris://newtab'
const MAX_CLOSED_TABS = 20

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  closedTabs: ClosedTab[]

  // Actions
  createTab: (url?: string, activate?: boolean) => string
  closeTab: (id: string) => void
  activateTab: (id: string) => void
  updateTab: (id: string, patch: Partial<Tab>) => void
  duplicateTab: (id: string) => void
  restoreClosedTab: () => void
  pinTab: (id: string, pinned: boolean) => void
  muteTab: (id: string, muted: boolean) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  moveTabToWindow: (id: string) => void
  sleepTab: (id: string) => void

  // Getters
  getActiveTab: () => Tab | undefined
  getTabById: (id: string) => Tab | undefined
}

function makeTab(url: string = NEW_TAB_URL): Tab {
  return {
    id: uuid(),
    url,
    title: url === NEW_TAB_URL ? 'New Tab' : url,
    status: 'loading',
    canGoBack: false,
    canGoForward: false,
    isLoading: url !== NEW_TAB_URL,
    isPinned: false,
    isMuted: false,
    isActive: false,
    zoom: 100,
    createdAt: Date.now(),
  }
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  closedTabs: [],

  createTab: (url = NEW_TAB_URL, activate = true) => {
    const tab = makeTab(url)
    set(state => ({
      tabs: [...state.tabs, { ...tab, isActive: activate }],
      activeTabId: activate ? tab.id : state.activeTabId,
    }))
    return tab.id
  },

  closeTab: (id: string) => {
    const { tabs, activeTabId } = get()
    const tabIndex = tabs.findIndex(t => t.id === id)
    if (tabIndex === -1) return

    const closingTab = tabs[tabIndex]

    // Save to closed tabs for restoration
    set(state => ({
      closedTabs: [
        { id: closingTab.id, url: closingTab.url, title: closingTab.title, favicon: closingTab.favicon, closedAt: Date.now() },
        ...state.closedTabs.slice(0, MAX_CLOSED_TABS - 1),
      ],
    }))

    const remaining = tabs.filter(t => t.id !== id)

    if (remaining.length === 0) {
      // Open a new tab if all are closed
      const newTab = makeTab(NEW_TAB_URL)
      set({ tabs: [{ ...newTab, isActive: true }], activeTabId: newTab.id })
      return
    }

    let nextActiveId = activeTabId
    if (activeTabId === id) {
      // Activate the tab to the right, or left if at the end
      const nextTab = remaining[Math.min(tabIndex, remaining.length - 1)]
      nextActiveId = nextTab.id
    }

    set({
      tabs: remaining.map(t => ({ ...t, isActive: t.id === nextActiveId })),
      activeTabId: nextActiveId,
    })
  },

  activateTab: (id: string) => {
    set(state => ({
      tabs: state.tabs.map(t => ({ ...t, isActive: t.id === id, isSleeping: t.id === id ? false : t.isSleeping })),
      activeTabId: id,
    }))
  },

  updateTab: (id: string, patch: Partial<Tab>) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === id ? { ...t, ...patch } : t),
    }))
  },

  duplicateTab: (id: string) => {
    const tab = get().getTabById(id)
    if (!tab) return
    const newTab = makeTab(tab.url)
    const { tabs } = get()
    const index = tabs.findIndex(t => t.id === id)
    const newTabs = [...tabs]
    newTabs.splice(index + 1, 0, newTab)
    set({
      tabs: newTabs.map(t => ({ ...t, isActive: t.id === newTab.id })),
      activeTabId: newTab.id,
    })
  },

  restoreClosedTab: () => {
    const { closedTabs } = get()
    if (closedTabs.length === 0) return
    const [latest, ...rest] = closedTabs
    get().createTab(latest.url, true)
    set({ closedTabs: rest })
  },

  pinTab: (id: string, pinned: boolean) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === id ? { ...t, isPinned: pinned } : t),
    }))
  },

  muteTab: (id: string, muted: boolean) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === id ? { ...t, isMuted: muted } : t),
    }))
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    set(state => {
      const tabs = [...state.tabs]
      const [moved] = tabs.splice(fromIndex, 1)
      tabs.splice(toIndex, 0, moved)
      return { tabs }
    })
  },

  moveTabToWindow: (_id: string) => {
    // Phase 8: multi-window support
  },

  sleepTab: (id: string) => {
    set(state => ({
      tabs: state.tabs.map(t => t.id === id ? { ...t, isSleeping: true } : t),
    }))
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId)
  },

  getTabById: (id: string) => {
    return get().tabs.find(t => t.id === id)
  },
}))
