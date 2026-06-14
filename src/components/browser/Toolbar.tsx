import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, RefreshCw, X as XIcon, Home,
  Shield, Lock, AlertTriangle, Bookmark, BookmarkCheck,
  Download, History, Settings, SidebarOpen, Star, Globe,
  Activity, FileText, Bot, Layers, GraduationCap
} from 'lucide-react'
import { useTabsStore } from '@/store/tabs.store'
import { useUIStore } from '@/store/ui.store'
import { useSettingsStore } from '@/store/settings.store'
import { SEARCH_ENGINES } from '@/types'
import clsx from 'clsx'

const NEW_TAB_URL = 'iris://newtab'

export default function Toolbar() {
  const activeTab = useTabsStore(s => s.getActiveTab())
  const updateTab = useTabsStore(s => s.updateTab)
  const { sidePanel, togglePanel, setAddressBarFocused, openBookmarkDialog } = useUIStore()
  const { settings } = useSettingsStore()

  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentUrl = activeTab?.url ?? ''
  const displayUrl = isFocused ? inputValue : formatUrl(currentUrl)

  // Sync input with active tab
  useEffect(() => {
    if (!isFocused) {
      setInputValue(currentUrl === NEW_TAB_URL ? '' : currentUrl)
    }
  }, [currentUrl, isFocused])

  // Check bookmark status
  useEffect(() => {
    if (currentUrl && currentUrl !== NEW_TAB_URL) {
      window.jarvis?.bookmarks.isBookmarked(currentUrl).then(id => {
        setIsBookmarked(!!id)
        setBookmarkId(id ?? null)
      })
    } else {
      setIsBookmarked(false)
      setBookmarkId(null)
    }
  }, [currentUrl])

  // Get the active webview
  const getWebview = useCallback((): Electron.WebviewTag | null => {
    if (!activeTab) return null
    return document.getElementById(`webview-${activeTab.id}`) as Electron.WebviewTag | null
  }, [activeTab?.id])

  const navigate = (url: string) => {
    let finalUrl = url.trim()
    if (!finalUrl) return

    // Detect if it's a URL or search query
    if (isUrl(finalUrl)) {
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('jarvis://')) {
        finalUrl = 'https://' + finalUrl
      }
    } else {
      const engine = SEARCH_ENGINES[settings.search_engine]
      finalUrl = engine.url + encodeURIComponent(finalUrl)
    }

    if (activeTab) {
      updateTab(activeTab.id, { url: finalUrl, isLoading: true, status: 'loading' })
    }
    setSuggestions([])
    setIsFocused(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = selectedSuggestion >= 0 ? suggestions[selectedSuggestion] : inputValue
      navigate(val)
    } else if (e.key === 'Escape') {
      setInputValue(currentUrl === NEW_TAB_URL ? '' : currentUrl)
      setIsFocused(false)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion(s => Math.min(s + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion(s => Math.max(s - 1, -1))
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    setAddressBarFocused(true)
    setInputValue(currentUrl === NEW_TAB_URL ? '' : currentUrl)
    inputRef.current?.select()
  }

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false)
      setAddressBarFocused(false)
      setSuggestions([])
      setSelectedSuggestion(-1)
    }, 150)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    setSelectedSuggestion(-1)

    if (val.length > 1) {
      // Fetch search suggestions
      try {
        const engine = SEARCH_ENGINES[settings.search_engine]
        const res = await fetch(engine.suggest + encodeURIComponent(val))
        const data = await res.json()
        const items = Array.isArray(data[1]) ? data[1].slice(0, 6) : []
        setSuggestions(items)
      } catch {
        setSuggestions([])
      }
    } else {
      setSuggestions([])
    }
  }

  const handleBookmark = async () => {
    if (!activeTab || activeTab.url === NEW_TAB_URL) return
    if (isBookmarked && bookmarkId !== null) {
      await window.jarvis?.bookmarks.delete(bookmarkId)
      setIsBookmarked(false)
      setBookmarkId(null)
    } else {
      openBookmarkDialog(activeTab.url, activeTab.title)
    }
  }

  // Nav actions via custom events (caught by WebViewContainer)
  const goBack = () => document.dispatchEvent(new CustomEvent('browser:go-back'))
  const goForward = () => document.dispatchEvent(new CustomEvent('browser:go-forward'))
  const reload = () => {
    if (activeTab?.isLoading) {
      document.dispatchEvent(new CustomEvent('browser:stop'))
    } else {
      document.dispatchEvent(new CustomEvent('browser:reload'))
    }
  }
  const goHome = () => navigate(settings.homepage)

  const securityStatus = getSecurityStatus(currentUrl)

  return (
    <div className="flex items-center gap-1 h-11 px-2 bg-jarvis-bg border-b border-jarvis-border flex-shrink-0">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-0.5">
        <NavButton onClick={goBack} disabled={!activeTab?.canGoBack} tooltip="Back (⌘[)">
          <ChevronLeft size={18} />
        </NavButton>
        <NavButton onClick={goForward} disabled={!activeTab?.canGoForward} tooltip="Forward (⌘])">
          <ChevronRight size={18} />
        </NavButton>
        <NavButton onClick={reload} tooltip={activeTab?.isLoading ? 'Stop' : 'Reload (⌘R)'}>
          {activeTab?.isLoading
            ? <XIcon size={16} className="text-jarvis-textMuted" />
            : <RefreshCw size={15} className={clsx(activeTab?.isLoading && 'animate-spin')} />}
        </NavButton>
        <NavButton onClick={goHome} tooltip="Home">
          <Home size={15} />
        </NavButton>
      </div>

      {/* Address Bar */}
      <div className={clsx(
        'flex-1 flex items-center gap-2 h-8 px-3 rounded-lg transition-all duration-150',
        isFocused
          ? 'bg-jarvis-surfaceEl ring-1 ring-jarvis-accent border border-jarvis-accent/50'
          : 'bg-jarvis-surfaceEl border border-jarvis-border hover:border-jarvis-borderHi',
      )}>
        {/* Security indicator */}
        {!isFocused && (
          <SecurityIcon status={securityStatus} url={currentUrl} />
        )}

        {isFocused && (
          <Globe size={13} className="flex-shrink-0 text-jarvis-textDim" />
        )}

        {/* URL Input */}
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            value={isFocused ? inputValue : displayUrl}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-xs text-jarvis-text placeholder:text-jarvis-textDim outline-none"
            placeholder="Search or enter address"
            spellCheck={false}
            autoComplete="off"
          />

          {/* Autocomplete suggestions */}
          {isFocused && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-jarvis-surface border border-jarvis-border rounded-xl shadow-tooltip overflow-hidden w-96 -translate-x-16">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left transition-colors',
                    i === selectedSuggestion
                      ? 'bg-jarvis-accent/20 text-jarvis-text'
                      : 'text-jarvis-textMuted hover:bg-white/5 hover:text-jarvis-text'
                  )}
                  onMouseDown={() => { setInputValue(s); navigate(s) }}
                >
                  <Globe size={12} className="flex-shrink-0 text-jarvis-textDim" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bookmark toggle */}
        {!isFocused && currentUrl !== NEW_TAB_URL && (
          <button
            onClick={handleBookmark}
            className={clsx(
              'flex-shrink-0 transition-colors',
              isBookmarked ? 'text-jarvis-accent' : 'text-jarvis-textDim hover:text-jarvis-textMuted'
            )}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-0.5">
        <NavButton onClick={() => togglePanel('ai')} active={sidePanel === 'ai'} tooltip="Jarvis AI">
          <Bot size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('research')} active={sidePanel === 'research'} tooltip="Research Collections">
          <Layers size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('exam')} active={sidePanel === 'exam'} tooltip="Exam Mode">
          <GraduationCap size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('notes')} active={sidePanel === 'notes'} tooltip="Notes">
          <FileText size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('privacy')} active={sidePanel === 'privacy'} tooltip="Privacy Dashboard">
          <Shield size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('performance')} active={sidePanel === 'performance'} tooltip="Performance Monitor">
          <Activity size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('downloads')} active={sidePanel === 'downloads'} tooltip="Downloads">
          <Download size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('history')} active={sidePanel === 'history'} tooltip="History">
          <History size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('bookmarks')} active={sidePanel === 'bookmarks'} tooltip="Bookmarks">
          <Star size={15} />
        </NavButton>
        <NavButton onClick={() => togglePanel('settings')} active={sidePanel === 'settings'} tooltip="Settings">
          <Settings size={15} />
        </NavButton>
      </div>
    </div>
  )
}

// ── Nav Button ────────────────────────────────────────────────────────────
function NavButton({ children, onClick, disabled, tooltip, active }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; tooltip?: string; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'jarvis-btn-icon',
        active && 'bg-jarvis-accent/15 text-jarvis-accent',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
      data-tooltip={tooltip}
    >
      {children}
    </button>
  )
}

// ── Security Icon ─────────────────────────────────────────────────────────
type SecurityStatus = 'secure' | 'insecure' | 'local' | 'unknown'

function SecurityIcon({ status, url }: { status: SecurityStatus; url: string }) {
  if (!url || url === 'jarvis://newtab' || url === '') return null

  return (
    <span className="flex-shrink-0">
      {status === 'secure' && <Lock size={12} className="text-jarvis-green" />}
      {status === 'insecure' && <AlertTriangle size={12} className="text-jarvis-amber" />}
      {status === 'local' && <Shield size={12} className="text-jarvis-textDim" />}
      {status === 'unknown' && <Globe size={12} className="text-jarvis-textDim" />}
    </span>
  )
}

// ── Utilities ─────────────────────────────────────────────────────────────
function isUrl(str: string): boolean {
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('jarvis://')) return true
  if (str.startsWith('localhost') || str.startsWith('127.')) return true
  // Domain pattern
  return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(str) && !str.includes(' ')
}

function formatUrl(url: string): string {
  if (!url || url === 'jarvis://newtab') return ''
  try {
    const parsed = new URL(url)
    return parsed.hostname + parsed.pathname + parsed.search
  } catch {
    return url
  }
}

function getSecurityStatus(url: string): SecurityStatus {
  if (!url) return 'unknown'
  if (url.startsWith('jarvis://') || url.startsWith('file://')) return 'local'
  if (url.startsWith('https://')) return 'secure'
  if (url.startsWith('http://')) return 'insecure'
  return 'unknown'
}
