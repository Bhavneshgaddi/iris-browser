import { useEffect, useState } from 'react'
import { Minus, Square, X, Maximize2, EyeOff } from 'lucide-react'
import clsx from 'clsx'

const isMac = navigator.userAgent.includes('Mac')
const isElectron = typeof window !== 'undefined' && navigator.userAgent.includes('Electron')
const isIncognito = new URLSearchParams(window.location.search).get('incognito') === 'true'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (isElectron) {
      window.jarvis?.window.isMaximized().then(setIsMaximized)
    }
  }, [])

  const handleMinimize = () => window.jarvis?.window.minimize()
  const handleMaximize = () => {
    window.jarvis?.window.maximize()
    setIsMaximized(v => !v)
  }
  const handleClose = () => window.jarvis?.window.close()

  // On macOS or web browser, let the OS / browser manage borders
  if (isMac || !isElectron) {
    return (
      <div
        className="h-1 bg-jarvis-bg flex-shrink-0"
      />
    )
  }

  // Windows / Linux custom titlebar
  return (
    <div
      className={clsx(
        'flex items-center justify-between h-9 bg-jarvis-bg border-b border-jarvis-border px-3 drag flex-shrink-0',
        isIncognito && 'border-l-2 border-l-jarvis-purple'
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App Logo */}
      <div className="flex items-center gap-2 no-drag">
        <IrisLogo />
        <span className="text-xs font-semibold text-jarvis-textMuted tracking-wider">IRIS</span>
        {isIncognito && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-jarvis-purple/20 text-jarvis-purple text-2xs font-medium">
            <EyeOff size={10} />
            Incognito
          </span>
        )}
      </div>

      {/* Window Controls */}
      <div
        className="flex items-center gap-1 no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded-md text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5 transition-colors"
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded-md text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5 transition-colors"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Square size={12} /> : <Maximize2 size={13} />}
        </button>
        <button
          onClick={handleClose}
          className={clsx(
            'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
            'text-jarvis-textMuted hover:text-white hover:bg-jarvis-red'
          )}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function IrisLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="url(#ig)" />
      <path d="M6 9.5L8.5 12L12 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="ig" x1="0" y1="0" x2="18" y2="18">
          <stop stopColor="#6C7AFF"/>
          <stop offset="1" stopColor="#B87FFF"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
