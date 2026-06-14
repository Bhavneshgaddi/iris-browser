import { useRef, useState } from 'react'
import { X, Plus, Volume2, VolumeX, Pin, Copy, RotateCcw } from 'lucide-react'
import { useTabsStore } from '@/store/tabs.store'
import type { Tab } from '@/types'
import clsx from 'clsx'

export default function TabBar() {
  const { tabs, activeTabId, createTab, closeTab, activateTab,
          pinTab, muteTab, duplicateTab, restoreClosedTab, closedTabs } = useTabsStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null)
  const [dragTab, setDragTab] = useState<string | null>(null)
  const [dragOverTab, setDragOverTab] = useState<string | null>(null)

  // Pinned tabs first, then regular
  const pinnedTabs = tabs.filter(t => t.isPinned)
  const regularTabs = tabs.filter(t => !t.isPinned)
  const orderedTabs = [...pinnedTabs, ...regularTabs]

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDragTab(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault()
    if (!dragTab || dragTab === targetTabId) return
    const fromIdx = orderedTabs.findIndex(t => t.id === dragTab)
    const toIdx = orderedTabs.findIndex(t => t.id === targetTabId)
    useTabsStore.getState().reorderTabs(fromIdx, toIdx)
    setDragTab(null)
    setDragOverTab(null)
  }

  return (
    <div className="flex items-center bg-jarvis-bg border-b border-jarvis-border h-10 flex-shrink-0 select-none overflow-hidden">
      {/* Tabs scroll container */}
      <div className="flex items-end flex-1 min-w-0 h-full overflow-x-auto overflow-y-hidden scrollbar-none px-1 gap-0.5 pt-1">
        {orderedTabs.map(tab => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            isDragging={dragTab === tab.id}
            isDragOver={dragOverTab === tab.id}
            onActivate={() => activateTab(tab.id)}
            onClose={() => closeTab(tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => { e.preventDefault(); setDragOverTab(tab.id) }}
            onDragLeave={() => setDragOverTab(null)}
            onDrop={(e) => handleDrop(e, tab.id)}
          />
        ))}
      </div>

      {/* New Tab button */}
      <button
        onClick={() => createTab()}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5 rounded-md mx-1 transition-colors no-drag"
        aria-label="New tab"
        data-tooltip="New tab (⌘T)"
      >
        <Plus size={16} />
      </button>

      {/* Restore closed tab */}
      {closedTabs.length > 0 && (
        <button
          onClick={restoreClosedTab}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5 rounded-md mr-1 transition-colors no-drag"
          aria-label="Restore closed tab"
          data-tooltip={`Reopen "${closedTabs[0]?.title || 'Tab'}" (⌘⇧T)`}
        >
          <RotateCcw size={14} />
        </button>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          tabId={contextMenu.tabId}
          onClose={() => setContextMenu(null)}
          onPin={(id) => {
            const tab = tabs.find(t => t.id === id)
            if (tab) pinTab(id, !tab.isPinned)
          }}
          onMute={(id) => {
            const tab = tabs.find(t => t.id === id)
            if (tab) muteTab(id, !tab.isMuted)
          }}
          onDuplicate={duplicateTab}
          onCloseTab={closeTab}
          tabs={tabs}
        />
      )}
    </div>
  )
}

// ── Tab Item ────────────────────────────────────────────────────────────────
interface TabItemProps {
  tab: Tab
  isActive: boolean
  isDragging: boolean
  isDragOver: boolean
  onActivate: () => void
  onClose: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

function TabItem({ tab, isActive, isDragging, isDragOver, onActivate, onClose, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop }: TabItemProps) {
  const maxWidth = tab.isPinned ? 40 : 200
  const minWidth = tab.isPinned ? 40 : 120

  return (
    <div
      className={clsx(
        'relative flex items-center h-9 rounded-t-lg flex-shrink-0 cursor-pointer group transition-all duration-150',
        'tab-enter no-drag',
        isActive
          ? 'bg-jarvis-surface text-jarvis-text shadow-sm z-10'
          : 'text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5',
        isDragging && 'opacity-40 scale-95',
        isDragOver && 'ring-1 ring-jarvis-accent',
      )}
      style={{ minWidth, maxWidth, width: tab.isPinned ? 40 : undefined, flex: tab.isPinned ? '0 0 40px' : '1 1 0' }}
      onClick={onActivate}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Active tab indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-jarvis-accent rounded-full" />
      )}

      {/* Favicon / Loading spinner */}
      <div className="flex-shrink-0 w-4 h-4 ml-3">
        {tab.isLoading ? (
          <div className="w-4 h-4 border-2 border-jarvis-accent border-t-transparent rounded-full animate-spin" />
        ) : tab.favicon ? (
          <img src={tab.favicon} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <DefaultFavicon />
        )}
      </div>

      {/* Title — hidden when pinned */}
      {!tab.isPinned && (
        <span className="flex-1 min-w-0 mx-2 text-xs truncate leading-none">
          {tab.title || tab.url}
        </span>
      )}

      {/* Muted indicator */}
      {tab.isMuted && !tab.isPinned && (
        <VolumeX size={11} className="flex-shrink-0 text-jarvis-textMuted mr-1" />
      )}

      {/* Close button */}
      {!tab.isPinned && (
        <button
          className={clsx(
            'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded mr-1.5',
            'text-jarvis-textDim hover:text-jarvis-text hover:bg-white/10',
            'opacity-0 group-hover:opacity-100 transition-all duration-100',
            isActive && 'opacity-70',
          )}
          onClick={(e) => { e.stopPropagation(); onClose() }}
          aria-label="Close tab"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

function DefaultFavicon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="3" fill="#2A2D3E"/>
      <circle cx="8" cy="8" r="3" fill="#4A4D62"/>
    </svg>
  )
}

// ── Context Menu ────────────────────────────────────────────────────────────
interface ContextMenuProps {
  x: number; y: number; tabId: string; onClose: () => void
  onPin: (id: string) => void; onMute: (id: string) => void
  onDuplicate: (id: string) => void; onCloseTab: (id: string) => void
  tabs: Tab[]
}

function TabContextMenu({ x, y, tabId, onClose, onPin, onMute, onDuplicate, onCloseTab, tabs }: ContextMenuProps) {
  const tab = tabs.find(t => t.id === tabId)
  if (!tab) return null

  const items = [
    { icon: <Copy size={13} />, label: 'Duplicate tab', action: () => { onDuplicate(tabId); onClose() } },
    { icon: <Pin size={13} />, label: tab.isPinned ? 'Unpin tab' : 'Pin tab', action: () => { onPin(tabId); onClose() } },
    { icon: tab.isMuted ? <Volume2 size={13} /> : <VolumeX size={13} />, label: tab.isMuted ? 'Unmute tab' : 'Mute tab', action: () => { onMute(tabId); onClose() } },
    null, // divider
    { icon: <X size={13} />, label: 'Close tab', action: () => { onCloseTab(tabId); onClose() }, danger: true },
    { icon: <X size={13} />, label: 'Close other tabs', action: () => { tabs.filter(t => t.id !== tabId).forEach(t => onCloseTab(t.id)); onClose() }, danger: true },
  ]

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 w-52 bg-jarvis-surface border border-jarvis-border rounded-xl shadow-tooltip py-1 animate-scale-in"
        style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 200) }}
      >
        {items.map((item, i) =>
          item === null ? (
            <div key={i} className="my-1 border-t border-jarvis-border" />
          ) : (
            <button
              key={i}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors',
                item.danger
                  ? 'text-jarvis-red hover:bg-jarvis-red/10'
                  : 'text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5'
              )}
              onClick={item.action}
            >
              {item.icon}
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  )
}
