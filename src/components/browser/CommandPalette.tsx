import { useState, useEffect, useRef } from 'react'
import { Search, Clock, Bookmark, Globe, Command } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { useTabsStore } from '@/store/tabs.store'
import type { HistoryEntry, Bookmark as BookmarkType } from '@/types'
import clsx from 'clsx'

type Result = {
  type: 'history' | 'bookmark' | 'tab'
  title: string
  url: string
  icon: React.ReactNode
  id?: string | number
}

export default function CommandPalette() {
  const { closeCommandPalette } = useUIStore()
  const { tabs, createTab, activateTab, activeTabId, updateTab } = useTabsStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      // Show recent history
      window.jarvis?.history.getAll(8).then(entries => {
        setResults(entries.map(e => ({
          type: 'history',
          title: e.title || e.url,
          url: e.url,
          icon: <Clock size={13} />,
          id: e.id,
        })))
      })
      return
    }

    const search = async () => {
      const [histResults, bookmarks] = await Promise.all([
        window.jarvis?.history.search(query) ?? Promise.resolve([]),
        window.jarvis?.bookmarks.getAll() ?? Promise.resolve([]),
      ])

      const bookmarkResults = (bookmarks as BookmarkType[])
        .filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || b.url.includes(query))
        .slice(0, 3)
        .map(b => ({ type: 'bookmark' as const, title: b.title, url: b.url, icon: <Bookmark size={13} />, id: b.id }))

      const historyItems = (histResults as HistoryEntry[]).slice(0, 6).map(e => ({
        type: 'history' as const, title: e.title || e.url, url: e.url, icon: <Clock size={13} />, id: e.id,
      }))

      // Open tabs matching query
      const tabResults = tabs
        .filter(t => t.title?.toLowerCase().includes(query.toLowerCase()) || t.url.includes(query))
        .slice(0, 2)
        .map(t => ({ type: 'tab' as const, title: t.title || t.url, url: t.url, icon: <Globe size={13} />, id: t.id }))

      setResults([...bookmarkResults, ...tabResults, ...historyItems])
    }
    search()
    setSelected(0)
  }, [query])

  const navigate = (result: Result) => {
    if (result.type === 'tab' && typeof result.id === 'string') {
      activateTab(result.id)
    } else if (activeTabId) {
      updateTab(activeTabId, { url: result.url, isLoading: true, status: 'loading' })
    } else {
      createTab(result.url)
    }
    closeCommandPalette()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeCommandPalette()
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50 backdrop-blur-sm" onClick={closeCommandPalette}>
      <div
        className="bg-jarvis-surface border border-jarvis-border rounded-2xl shadow-tooltip w-full max-w-lg mx-4 overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-jarvis-border">
          <Search size={16} className="text-jarvis-textMuted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search history, bookmarks, tabs…"
            className="flex-1 bg-transparent text-sm text-jarvis-text placeholder:text-jarvis-textDim outline-none"
            spellCheck={false}
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <kbd className="px-1.5 py-0.5 text-2xs bg-jarvis-surfaceEl border border-jarvis-border rounded text-jarvis-textDim">ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-jarvis-textDim">
              {query ? 'No results found' : 'Start typing to search'}
            </div>
          ) : (
            results.map((result, i) => (
              <button
                key={i}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  i === selected
                    ? 'bg-jarvis-accent/15 text-jarvis-text'
                    : 'text-jarvis-textMuted hover:bg-white/5 hover:text-jarvis-text'
                )}
                onClick={() => navigate(result)}
                onMouseEnter={() => setSelected(i)}
              >
                <span className={clsx(
                  'flex-shrink-0',
                  result.type === 'bookmark' ? 'text-jarvis-amber' : result.type === 'tab' ? 'text-jarvis-green' : 'text-jarvis-textDim'
                )}>
                  {result.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate font-medium">{result.title}</div>
                  <div className="text-2xs text-jarvis-textDim truncate">{result.url}</div>
                </div>
                <span className="text-2xs text-jarvis-textDim flex-shrink-0 capitalize">{result.type}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-jarvis-border flex items-center gap-4">
          <span className="text-2xs text-jarvis-textDim">↑↓ navigate</span>
          <span className="text-2xs text-jarvis-textDim">↵ open</span>
          <span className="text-2xs text-jarvis-textDim">esc close</span>
        </div>
      </div>
    </div>
  )
}
