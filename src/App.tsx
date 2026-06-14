import { useEffect } from 'react'
import { useTabsStore } from '@/store/tabs.store'
import { useUIStore } from '@/store/ui.store'
import { useSettingsStore } from '@/store/settings.store'
import BrowserShell from '@/components/layout/BrowserShell'

export default function App() {
  const createTab = useTabsStore(s => s.createTab)
  const closeTab = useTabsStore(s => s.closeTab)
  const activeTabId = useTabsStore(s => s.activeTabId)
  const restoreClosedTab = useTabsStore(s => s.restoreClosedTab)
  const { setTheme, openCommandPalette } = useUIStore()
  const { load: loadSettings, settings } = useSettingsStore()

  // ── Initialize ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadSettings().then(async () => {
      // Apply theme
      const theme = settings.theme
      setTheme(theme)

      // Restore previous session or open a fresh new tab
      if (settings.restore_tabs_on_startup && window.jarvis?.session) {
        try {
          const saved = await window.jarvis.session.load()
          if (saved && saved.length > 0) {
            saved.forEach((s, i) => {
              const id = createTab(s.url, i === 0)
              if (s.is_pinned) {
                useTabsStore.getState().pinTab(id, true)
              }
            })
            // Activate first non-pinned tab
            const firstActive = saved[0]
            if (firstActive) {
              const tabs = useTabsStore.getState().tabs
              const match = tabs.find(t => t.url === firstActive.url)
              if (match) useTabsStore.getState().activateTab(match.id)
            }
            return
          }
        } catch {
          // Fall through to opening a new tab
        }
      }

      createTab('iris://newtab', true)
    })

    // Listen for theme changes from main process
    const unsub = window.jarvis?.theme.onChange((t) => {
      setTheme(t as 'dark' | 'light' | 'system')
    })

    // Save session on close
    const saveSession = () => {
      const { tabs } = useTabsStore.getState()
      const sessionTabs = tabs.map((t, i) => ({
        tabId: t.id,
        url: t.url === 'iris://newtab' ? 'iris://newtab' : t.url,
        title: t.title,
        favicon: t.favicon,
        tabIndex: i,
        isPinned: t.isPinned,
      }))
      window.jarvis?.session?.save(sessionTabs).catch(() => {})
    }
    window.addEventListener('beforeunload', saveSession)

    return () => {
      unsub?.()
      window.removeEventListener('beforeunload', saveSession)
    }
  }, [])

  // ── Listen for menu events from main process ───────────────────────────
  useEffect(() => {
    const unsubs = [
      window.jarvis?.on('menu:new-tab', () => createTab()),
      window.jarvis?.on('menu:close-tab', () => { if (activeTabId) closeTab(activeTabId) }),
      window.jarvis?.on('menu:go-back', () => document.dispatchEvent(new CustomEvent('browser:go-back'))),
      window.jarvis?.on('menu:go-forward', () => document.dispatchEvent(new CustomEvent('browser:go-forward'))),
    ]
    return () => unsubs.forEach(u => u?.())
  }, [activeTabId])

  // ── Global keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 't') { e.preventDefault(); createTab() }
      if (meta && e.key === 'w') { e.preventDefault(); if (activeTabId) closeTab(activeTabId) }
      if (meta && e.shiftKey && e.key === 't') { e.preventDefault(); restoreClosedTab() }
      if (meta && e.key === 'k') { e.preventDefault(); openCommandPalette() }
      if (e.key === 'F5' || (meta && e.key === 'r')) {
        e.preventDefault()
        document.dispatchEvent(new CustomEvent('browser:reload'))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTabId])

  return <BrowserShell />
}
