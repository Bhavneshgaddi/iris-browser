import { useEffect, useState } from 'react'
import { Bookmark, FolderOpen, Plus } from 'lucide-react'
import type { Bookmark as BookmarkType } from '@/types'
import { useTabsStore } from '@/store/tabs.store'
import clsx from 'clsx'

export default function BookmarksBar() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const updateTab = useTabsStore(s => s.updateTab)
  const activeTabId = useTabsStore(s => s.activeTabId)

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async () => {
    const all = await window.jarvis?.bookmarks.getAll() ?? []
    // Show bookmarks bar folder (id=1) only
    setBookmarks(all.filter(b => b.folder_id === 1).slice(0, 20))
  }

  const navigate = (url: string) => {
    if (!activeTabId) return
    updateTab(activeTabId, { url, isLoading: true, status: 'loading' })
  }

  return (
    <div className="flex items-center h-8 px-2 bg-jarvis-bg border-b border-jarvis-border overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-0.5 overflow-x-auto overflow-y-hidden scrollbar-none flex-1">
        {bookmarks.length === 0 ? (
          <span className="text-xs text-jarvis-textDim ml-1">
            No bookmarks · Add sites with ⌘D
          </span>
        ) : (
          bookmarks.map(bookmark => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              onNavigate={navigate}
            />
          ))
        )}
      </div>
    </div>
  )
}

function BookmarkItem({ bookmark, onNavigate }: { bookmark: BookmarkType; onNavigate: (url: string) => void }) {
  const title = bookmark.title.length > 20 ? bookmark.title.slice(0, 18) + '…' : bookmark.title

  return (
    <button
      onClick={() => onNavigate(bookmark.url)}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-md max-w-36 flex-shrink-0',
        'text-jarvis-textMuted hover:text-jarvis-text hover:bg-white/5',
        'transition-colors duration-100 text-xs',
      )}
      title={bookmark.url}
    >
      {bookmark.favicon ? (
        <img src={bookmark.favicon} alt="" className="w-3.5 h-3.5 flex-shrink-0 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <Bookmark size={11} className="flex-shrink-0" />
      )}
      <span className="truncate">{title}</span>
    </button>
  )
}
