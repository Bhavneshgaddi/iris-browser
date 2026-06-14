import { useState } from 'react'
import {
  Search, Palette, Shield, Bell, Download as DownloadIcon,
  Globe, Monitor, Info, ChevronRight, Moon, Sun, Laptop,
  Zap, Lock,
} from 'lucide-react'
import { useSettingsStore } from '@/store/settings.store'
import { useUIStore } from '@/store/ui.store'
import { SEARCH_ENGINES } from '@/types'
import type { SearchEngine, Theme } from '@/types'
import clsx from 'clsx'

type SettingsSection = 'appearance' | 'search' | 'privacy' | 'downloads' | 'about'

export default function SettingsPanel() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance')
  const { settings, update } = useSettingsStore()
  const { setTheme } = useUIStore()

  const sections = [
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette size={14} /> },
    { id: 'search' as const, label: 'Search', icon: <Search size={14} /> },
    { id: 'privacy' as const, label: 'Privacy', icon: <Shield size={14} /> },
    { id: 'downloads' as const, label: 'Downloads', icon: <DownloadIcon size={14} /> },
    { id: 'about' as const, label: 'About', icon: <Info size={14} /> },
  ]

  return (
    <div className="flex h-full">
      {/* Section Nav */}
      <div className="w-36 flex-shrink-0 border-r border-jarvis-border py-2">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left',
              activeSection === s.id
                ? 'text-jarvis-accent bg-jarvis-accent/10'
                : 'text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5'
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {activeSection === 'appearance' && (
          <AppearanceSection
            theme={settings.theme}
            showBookmarksBar={settings.show_bookmarks_bar}
            fontSize={settings.font_size}
            onThemeChange={(t) => { update('theme', t); setTheme(t) }}
            onBookmarksBarChange={(v) => update('show_bookmarks_bar', v)}
            onFontSizeChange={(v) => update('font_size', v)}
          />
        )}
        {activeSection === 'search' && (
          <SearchSection
            engine={settings.search_engine}
            homepage={settings.homepage}
            openInNew={settings.open_links_in_new_tab}
            onEngineChange={(e) => update('search_engine', e)}
            onHomepageChange={(v) => update('homepage', v)}
            onOpenInNewChange={(v) => update('open_links_in_new_tab', v)}
          />
        )}
        {activeSection === 'privacy' && (
          <PrivacySection
            blockPopups={settings.block_popups}
            enableJs={settings.enable_javascript}
            onBlockPopups={(v) => update('block_popups', v)}
            onEnableJs={(v) => update('enable_javascript', v)}
          />
        )}
        {activeSection === 'downloads' && (
          <DownloadsSection
            downloadPath={settings.download_path}
            onPathChange={(v) => update('download_path', v)}
          />
        )}
        {activeSection === 'about' && <AboutSection />}
      </div>
    </div>
  )
}

// ── Appearance ────────────────────────────────────────────────────────────────
function AppearanceSection({ theme, showBookmarksBar, fontSize, onThemeChange, onBookmarksBarChange, onFontSizeChange }: any) {
  return (
    <>
      <SettingGroup title="Theme">
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as Theme[]).map(t => (
            <button
              key={t}
              onClick={() => onThemeChange(t)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs transition-all',
                theme === t
                  ? 'border-jarvis-accent bg-jarvis-accent/10 text-jarvis-accent'
                  : 'border-jarvis-border text-jarvis-textMuted hover:border-jarvis-borderHi hover:text-jarvis-text'
              )}
            >
              {t === 'light' ? <Sun size={16} /> : t === 'dark' ? <Moon size={16} /> : <Laptop size={16} />}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Browser">
        <ToggleSetting
          label="Show Bookmarks Bar"
          description="Display bookmarks below the toolbar"
          value={showBookmarksBar}
          onChange={onBookmarksBarChange}
        />
      </SettingGroup>

      <SettingGroup title="Font Size">
        <div className="flex items-center gap-3">
          <input
            type="range" min="12" max="24" step="1"
            value={fontSize}
            onChange={e => onFontSizeChange(Number(e.target.value))}
            className="flex-1 accent-jarvis-accent"
          />
          <span className="text-xs text-jarvis-text w-8">{fontSize}px</span>
        </div>
      </SettingGroup>
    </>
  )
}

// ── Search ────────────────────────────────────────────────────────────────────
function SearchSection({ engine, homepage, openInNew, onEngineChange, onHomepageChange, onOpenInNewChange }: any) {
  return (
    <>
      <SettingGroup title="Default Search Engine">
        <div className="space-y-1">
          {(Object.keys(SEARCH_ENGINES) as SearchEngine[]).map(e => (
            <button
              key={e}
              onClick={() => onEngineChange(e)}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors',
                engine === e
                  ? 'bg-jarvis-accent/10 text-jarvis-accent border border-jarvis-accent/30'
                  : 'text-jarvis-textMuted hover:bg-white/5 hover:text-jarvis-text border border-transparent'
              )}
            >
              {SEARCH_ENGINES[e].name}
              {engine === e && <span className="text-2xs">✓</span>}
            </button>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Homepage">
        <input
          value={homepage}
          onChange={e => onHomepageChange(e.target.value)}
          placeholder="https://... or jarvis://newtab"
          className="jarvis-input text-xs"
        />
      </SettingGroup>

      <SettingGroup title="Tabs">
        <ToggleSetting
          label="Open links in new tab"
          value={openInNew}
          onChange={onOpenInNewChange}
        />
      </SettingGroup>
    </>
  )
}

// ── Privacy ───────────────────────────────────────────────────────────────────
function PrivacySection({ blockPopups, enableJs, onBlockPopups, onEnableJs }: any) {
  return (
    <SettingGroup title="Security">
      <ToggleSetting label="Block pop-ups" value={blockPopups} onChange={onBlockPopups} />
      <ToggleSetting label="Enable JavaScript" value={enableJs} onChange={onEnableJs} />
    </SettingGroup>
  )
}

// ── Downloads ─────────────────────────────────────────────────────────────────
function DownloadsSection({ downloadPath, onPathChange }: any) {
  const choosePath = async () => {
    const result = await window.jarvis?.dialog.open({ properties: ['openDirectory'] })
    if (!result?.canceled && result?.filePaths[0]) {
      onPathChange(result.filePaths[0])
    }
  }

  return (
    <SettingGroup title="Download Location">
      <div className="flex gap-2">
        <input
          value={downloadPath || 'Default Downloads folder'}
          readOnly
          className="jarvis-input text-xs flex-1"
        />
        <button onClick={choosePath} className="jarvis-btn text-xs bg-jarvis-surfaceEl border border-jarvis-border text-jarvis-textMuted hover:text-jarvis-text whitespace-nowrap">
          Choose…
        </button>
      </div>
    </SettingGroup>
  )
}

// ── About ─────────────────────────────────────────────────────────────────────
function AboutSection() {
  const [version, setVersion] = useState('1.0.0')

  useState(() => {
    window.jarvis?.app.version().then(setVersion)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center py-6 gap-3">
        <JarvisLogoLg />
        <div className="text-center">
          <div className="text-base font-bold text-jarvis-text">Jarvis Browser</div>
          <div className="text-xs text-jarvis-textMuted mt-0.5">Version {version}</div>
        </div>
      </div>
      <div className="text-xs text-jarvis-textDim text-center">
        Built with Electron · React · TypeScript
        <br />
        Designed for students, researchers & productivity.
      </div>
    </div>
  )
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function ToggleSetting({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <div className="text-xs text-jarvis-text">{label}</div>
        {description && <div className="text-2xs text-jarvis-textDim">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
          value ? 'bg-jarvis-accent' : 'bg-jarvis-surfaceEl border border-jarvis-border'
        )}
      >
        <span className={clsx(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
          value ? 'left-[18px]' : 'left-0.5'
        )} />
      </button>
    </div>
  )
}

function JarvisLogoLg() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="url(#alg)" />
      <path d="M16 25L22 31L32 19" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="alg" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#6C7AFF"/>
          <stop offset="1" stopColor="#B87FFF"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
