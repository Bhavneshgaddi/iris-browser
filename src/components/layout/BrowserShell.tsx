import { useUIStore } from '@/store/ui.store'
import TitleBar from '@/components/browser/TitleBar'
import TabBar from '@/components/browser/TabBar'
import Toolbar from '@/components/browser/Toolbar'
import BookmarksBar from '@/components/browser/BookmarksBar'
import WebViewContainer from '@/components/browser/WebViewContainer'
import SidePanel from '@/components/browser/SidePanel'
import BookmarkDialog from '@/components/browser/BookmarkDialog'
import CommandPalette from '@/components/browser/CommandPalette'
import { useSettingsStore } from '@/store/settings.store'
import clsx from 'clsx'

export default function BrowserShell() {
  const sidePanel = useUIStore(s => s.sidePanel)
  const isBookmarkDialogOpen = useUIStore(s => s.isBookmarkDialogOpen)
  const isCommandPaletteOpen = useUIStore(s => s.isCommandPaletteOpen)
  const showBookmarksBar = useSettingsStore(s => s.settings.show_bookmarks_bar)

  return (
    <div className="flex flex-col h-screen bg-jarvis-bg text-jarvis-text overflow-hidden select-none dark">
      {/* ── Custom Titlebar (macOS / Windows drag region) ── */}
      <TitleBar />

      {/* ── Tab Bar ── */}
      <TabBar />

      {/* ── Navigation Toolbar ── */}
      <Toolbar />

      {/* ── Bookmarks Bar ── */}
      {showBookmarksBar && <BookmarksBar />}

      {/* ── Main Content Area ── */}
      <div className="flex flex-1 min-h-0">
        {/* WebView area */}
        <div className={clsx('flex-1 min-w-0', sidePanel && 'border-r border-jarvis-border')}>
          <WebViewContainer />
        </div>

        {/* Side Panel */}
        {sidePanel && (
          <div className="w-80 flex-shrink-0 animate-slide-down">
            <SidePanel />
          </div>
        )}
      </div>

      {/* ── Overlays ── */}
      {isBookmarkDialogOpen && <BookmarkDialog />}
      {isCommandPaletteOpen && <CommandPalette />}
    </div>
  )
}
