import { describe, it, expect, beforeEach } from 'vitest'
import { useTabsStore } from '@/store/tabs.store'

describe('useTabsStore', () => {
  beforeEach(() => {
    useTabsStore.setState({ tabs: [], activeTabId: null, closedTabs: [] })
  })

  it('creates a tab and activates it', () => {
    const { createTab, tabs, activeTabId } = useTabsStore.getState()
    const id = createTab('https://example.com', true)
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(id)
    expect(state.tabs[0].url).toBe('https://example.com')
  })

  it('creates a background tab', () => {
    const id1 = useTabsStore.getState().createTab('https://a.com', true)
    const id2 = useTabsStore.getState().createTab('https://b.com', false)
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(2)
    expect(state.activeTabId).toBe(id1)
  })

  it('closes a tab and activates the next one', () => {
    const id1 = useTabsStore.getState().createTab('https://a.com', true)
    const id2 = useTabsStore.getState().createTab('https://b.com', true)
    useTabsStore.getState().closeTab(id2)
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(id1)
  })

  it('opens a new tab when the last tab is closed', () => {
    const id = useTabsStore.getState().createTab('https://a.com', true)
    useTabsStore.getState().closeTab(id)
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0].url).toBe('iris://newtab')
  })

  it('saves closed tab for restoration', () => {
    const id = useTabsStore.getState().createTab('https://x.com', true)
    useTabsStore.getState().createTab('https://y.com', true) // keep 2 tabs
    useTabsStore.getState().closeTab(id)
    const state = useTabsStore.getState()
    expect(state.closedTabs[0].url).toBe('https://x.com')
  })

  it('restores a closed tab', () => {
    const id = useTabsStore.getState().createTab('https://restore.me', true)
    useTabsStore.getState().createTab('https://other.com', true)
    useTabsStore.getState().closeTab(id)
    useTabsStore.getState().restoreClosedTab()
    const state = useTabsStore.getState()
    const restored = state.tabs.find(t => t.url === 'https://restore.me')
    expect(restored).toBeDefined()
  })

  it('pins and unpins a tab', () => {
    const id = useTabsStore.getState().createTab('https://pinned.com', true)
    useTabsStore.getState().pinTab(id, true)
    expect(useTabsStore.getState().tabs[0].isPinned).toBe(true)
    useTabsStore.getState().pinTab(id, false)
    expect(useTabsStore.getState().tabs[0].isPinned).toBe(false)
  })

  it('duplicates a tab', () => {
    const id = useTabsStore.getState().createTab('https://dup.com', true)
    useTabsStore.getState().duplicateTab(id)
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(2)
    expect(state.tabs[1].url).toBe('https://dup.com')
  })

  it('updates a tab', () => {
    const id = useTabsStore.getState().createTab()
    useTabsStore.getState().updateTab(id, { title: 'Updated', url: 'https://new.com' })
    const tab = useTabsStore.getState().getTabById(id)
    expect(tab?.title).toBe('Updated')
    expect(tab?.url).toBe('https://new.com')
  })

  it('reorders tabs', () => {
    const id1 = useTabsStore.getState().createTab('https://1.com', true)
    const id2 = useTabsStore.getState().createTab('https://2.com', false)
    const id3 = useTabsStore.getState().createTab('https://3.com', false)
    useTabsStore.getState().reorderTabs(0, 2)
    const tabs = useTabsStore.getState().tabs
    expect(tabs[0].url).toBe('https://2.com')
    expect(tabs[2].url).toBe('https://1.com')
  })
})
