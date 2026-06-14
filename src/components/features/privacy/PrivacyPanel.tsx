import { useEffect, useState } from 'react'
import { Shield, ShieldOff, Trash2, Cookie, Eye, EyeOff, RefreshCw, CheckCircle } from 'lucide-react'
import { usePrivacyStore } from '@/store/privacy.store'
import { useTabsStore } from '@/store/tabs.store'
import clsx from 'clsx'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={clsx('flex items-center justify-between w-full px-3 py-2.5 rounded-lg border transition-all', checked ? 'bg-jarvis-accent/10 border-jarvis-accent/40' : 'bg-jarvis-surfaceEl border-jarvis-border')}
    >
      <span className="text-xs text-jarvis-text">{label}</span>
      <div className={clsx('w-8 h-4 rounded-full relative transition-colors', checked ? 'bg-jarvis-accent' : 'bg-jarvis-surfaceEl border border-jarvis-border')}>
        <div className={clsx('absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all', checked ? 'left-4' : 'left-0.5')} />
      </div>
    </button>
  )
}

export default function PrivacyPanel() {
  const { stats, load, setBlocking, clearCookies, clearAll, resetStats } = usePrivacyStore()
  const activeTab = useTabsStore(s => s.getActiveTab())
  const [cleared, setCleared] = useState(false)

  useEffect(() => { load() }, [])

  const handleClearAll = async () => {
    await clearAll()
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
  }

  const currentDomain = activeTab?.url ? (() => { try { return new URL(activeTab.url).hostname } catch { return '' } })() : ''
  const isSecure = activeTab?.url?.startsWith('https://')

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Privacy Score */}
      <div className="bg-jarvis-surfaceEl rounded-xl p-4 text-center">
        <div className={clsx('w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2', stats.blockingEnabled ? 'bg-jarvis-green/20' : 'bg-jarvis-red/20')}>
          {stats.blockingEnabled ? <Shield size={24} className="text-jarvis-green" /> : <ShieldOff size={24} className="text-jarvis-red" />}
        </div>
        <div className="text-lg font-bold text-jarvis-text">{stats.blockedCount.toLocaleString()}</div>
        <div className="text-xs text-jarvis-textDim">requests blocked this session</div>
        {currentDomain && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-2xs">
            {isSecure ? <CheckCircle size={11} className="text-jarvis-green" /> : <Eye size={11} className="text-jarvis-amber" />}
            <span className={isSecure ? 'text-jarvis-green' : 'text-jarvis-amber'}>
              {isSecure ? 'Secure connection' : 'Unsecured connection'}
            </span>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        <p className="text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider">Protection</p>
        <Toggle checked={stats.blockingEnabled} onChange={setBlocking} label="Ad & Tracker Blocking" />
      </div>

      {/* Stats reset */}
      <button
        onClick={resetStats}
        className="flex items-center gap-2 text-xs text-jarvis-textMuted hover:text-jarvis-text transition-colors"
      >
        <RefreshCw size={12} /> Reset counter
      </button>

      {/* Clear Data */}
      <div className="flex flex-col gap-2">
        <p className="text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider">Clear Data</p>
        <button
          onClick={clearCookies}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-jarvis-surfaceEl border border-jarvis-border text-xs text-jarvis-textMuted hover:text-jarvis-text hover:border-jarvis-borderHi transition-all"
        >
          <Cookie size={13} /> Clear Cookies
        </button>
        <button
          onClick={handleClearAll}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all',
            cleared
              ? 'bg-jarvis-green/10 border-jarvis-green/40 text-jarvis-green'
              : 'bg-jarvis-red/10 border-jarvis-red/30 text-jarvis-red hover:bg-jarvis-red/20'
          )}
        >
          {cleared ? <><CheckCircle size={13} /> Cleared!</> : <><Trash2 size={13} /> Clear History + Cache</>}
        </button>
      </div>
    </div>
  )
}
