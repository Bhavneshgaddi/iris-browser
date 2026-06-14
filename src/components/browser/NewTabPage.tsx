import { useState, useRef, useEffect } from 'react'
import { Search, Globe, Plus, X } from 'lucide-react'
import { useTabsStore } from '@/store/tabs.store'
import { useSettingsStore } from '@/store/settings.store'
import { SEARCH_ENGINES } from '@/types'
import clsx from 'clsx'

const DEFAULT_SHORTCUTS = [
  { title: 'Google', url: 'https://google.com', icon: '🔍' },
  { title: 'GitHub', url: 'https://github.com', icon: '💻' },
  { title: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
  { title: 'Wikipedia', url: 'https://wikipedia.org', icon: '📖' },
  { title: 'Gmail', url: 'https://mail.google.com', icon: '✉️' },
  { title: 'Notion', url: 'https://notion.so', icon: '📝' },
]

export default function NewTabPage({ tabId }: { tabId: string }) {
  const [query, setQuery] = useState('')
  const [time, setTime] = useState(new Date())
  const updateTab = useTabsStore(s => s.updateTab)
  const { settings } = useSettingsStore()
  const inputRef = useRef<HTMLInputElement>(null)

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-focus search
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const engine = SEARCH_ENGINES[settings.search_engine]
    const url = isUrl(query) ? (query.startsWith('http') ? query : 'https://' + query) : engine.url + encodeURIComponent(query)
    updateTab(tabId, { url, isLoading: true, status: 'loading' })
  }

  const navigateTo = (url: string) => {
    updateTab(tabId, { url, isLoading: true, status: 'loading' })
  }

  const greeting = getGreeting()
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="w-full h-full bg-jarvis-bg flex flex-col items-center justify-center gap-8 px-8 overflow-auto">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-jarvis-accent/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 rounded-full bg-jarvis-purple/5 blur-3xl" />
      </div>

      {/* Clock */}
      <div className="relative text-center">
        <div className="text-6xl font-light text-jarvis-text tracking-tight tabular-nums">
          {timeStr}
        </div>
        <div className="text-sm text-jarvis-textMuted mt-1">{dateStr}</div>
      </div>

      {/* Greeting */}
      <div className="relative text-center">
        <h1 className="text-xl font-medium text-jarvis-textMuted">{greeting}</h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative w-full max-w-xl">
        <div className={clsx(
          'flex items-center gap-3 h-12 px-4 rounded-2xl border transition-all duration-200',
          'bg-jarvis-surfaceEl border-jarvis-border',
          'focus-within:border-jarvis-accent focus-within:shadow-glow-accent focus-within:bg-jarvis-surface',
        )}>
          <Search size={16} className="text-jarvis-textMuted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search with ${SEARCH_ENGINES[settings.search_engine].name} or enter URL`}
            className="flex-1 bg-transparent text-sm text-jarvis-text placeholder:text-jarvis-textDim outline-none"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-jarvis-textDim hover:text-jarvis-textMuted transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Quick Links */}
      <div className="relative flex flex-wrap justify-center gap-3 max-w-2xl">
        {DEFAULT_SHORTCUTS.map((shortcut, i) => (
          <button
            key={i}
            onClick={() => navigateTo(shortcut.url)}
            className={clsx(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl w-20',
              'bg-jarvis-surfaceEl border border-jarvis-border',
              'hover:border-jarvis-borderHi hover:bg-jarvis-surface',
              'transition-all duration-150 group',
            )}
          >
            <span className="text-2xl">{shortcut.icon}</span>
            <span className="text-xs text-jarvis-textMuted group-hover:text-jarvis-text transition-colors truncate w-full text-center">
              {shortcut.title}
            </span>
          </button>
        ))}
        <button
          className={clsx(
            'flex flex-col items-center gap-1.5 p-3 rounded-xl w-20',
            'bg-transparent border border-dashed border-jarvis-border',
            'hover:border-jarvis-borderHi hover:bg-jarvis-surfaceEl',
            'transition-all duration-150 text-jarvis-textDim hover:text-jarvis-textMuted',
          )}
        >
          <Plus size={22} />
          <span className="text-xs truncate w-full text-center">Add</span>
        </button>
      </div>

      {/* Branding */}
      <div className="relative flex items-center gap-2 text-jarvis-textDim text-xs">
        <IrisLogo />
        <span>IRIS Browser — Built for students, researchers, and deep thinkers.</span>
      </div>
    </div>
  )
}

function IrisLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="url(#ng)" />
      <path d="M6 9.5L8.5 12L12 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="ng" x1="0" y1="0" x2="18" y2="18">
          <stop stopColor="#6C7AFF"/>
          <stop offset="1" stopColor="#B87FFF"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function isUrl(str: string): boolean {
  if (str.startsWith('http://') || str.startsWith('https://')) return true
  return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(str) && !str.includes(' ')
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Working late? 🌙'
  if (h < 12) return 'Good morning ☀️'
  if (h < 17) return 'Good afternoon 🌤️'
  if (h < 21) return 'Good evening 🌆'
  return 'Good night 🌙'
}
