import { useState, useEffect } from 'react'
import { Search, Trash2, Globe, Clock, X } from 'lucide-react'
import type { HistoryEntry } from '@/types'
import { useTabsStore } from '@/store/tabs.store'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import clsx from 'clsx'

export default function HistoryPanel() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const updateTab = useTabsStore(s => s.updateTab)
  const activeTabId = useTabsStore(s => s.activeTabId)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (query.trim()) {
      window.jarvis?.history.search(query).then(setEntries)
    } else {
      loadHistory()
    }
  }, [query])

  const loadHistory = async () => {
    setIsLoading(true)
    const all = await window.jarvis?.history.getAll(300) ?? []
    setEntries(all)
    setIsLoading(false)
  }

  const deleteEntry = async (id: number) => {
    await window.jarvis?.history.delete(id)
    setEntries(e => e.filter(h => h.id !== id))
  }

  const clearAll = async () => {
    if (!confirm('Clear all browsing history?')) return
    await window.jarvis?.history.clear()
    setEntries([])
  }

  const navigate = (url: string) => {
    if (!activeTabId) return
    updateTab(activeTabId, { url, isLoading: true, status: 'loading' })
  }

  // Group by date
  const grouped = groupByDate(entries)

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b border-jarvis-border">
        <div className="flex items-center gap-2 h-8 px-3 bg-jarvis-surfaceEl rounded-lg border border-jarvis-border">
          <Search size={13} className="text-jarvis-textDim flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search history…"
            className="flex-1 bg-transparent text-xs text-jarvis-text placeholder:text-jarvis-textDim outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-jarvis-textDim hover:text-jarvis-textMuted">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Clear button */}
      {entries.length > 0 && (
        <div className="px-3 py-2 border-b border-jarvis-border">
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs text-jarvis-red hover:text-jarvis-red/80 transition-colors"
          >
            <Trash2 size={12} />
            Clear all history
          </button>
        </div>
      )}

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-jarvis-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Clock size={28} className="text-jarvis-textDim mb-3" />
            <p className="text-sm text-jarvis-textMuted">
              {query ? 'No results found' : 'No browsing history yet'}
            </p>
          </div>
        ) : (
          grouped.map(({ label, entries: dayEntries }) => (
            <div key={label}>
              <div className="px-3 py-1.5 text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider bg-jarvis-bg/50 sticky top-0">
                {label}
              </div>
              {dayEntries.map(entry => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onNavigate={navigate}
                  onDelete={deleteEntry}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function HistoryItem({ entry, onNavigate, onDelete }: {
  entry: HistoryEntry; onNavigate: (url: string) => void; onDelete: (id: number) => void
}) {
  return (
    <div className="group flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors">
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {entry.favicon ? (
          <img src={entry.favicon} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <Globe size={13} className="text-jarvis-textDim" />
        )}
      </div>
      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => onNavigate(entry.url)}
      >
        <div className="text-xs text-jarvis-text truncate">{entry.title || entry.url}</div>
        <div className="text-2xs text-jarvis-textDim truncate">{entry.url}</div>
      </button>
      <span className="text-2xs text-jarvis-textDim flex-shrink-0">
        {format(parseISO(entry.last_visit), 'h:mm a')}
      </span>
      <button
        onClick={() => onDelete(entry.id)}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-jarvis-textDim hover:text-jarvis-red transition-all"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function groupByDate(entries: HistoryEntry[]) {
  const groups: Record<string, HistoryEntry[]> = {}
  for (const entry of entries) {
    const date = parseISO(entry.last_visit)
    const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMMM d, yyyy')
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  }
  return Object.entries(groups).map(([label, entries]) => ({ label, entries }))
}
