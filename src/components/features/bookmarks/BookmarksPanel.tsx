import { useState, useEffect } from 'react'
import { Bookmark, Folder, FolderOpen, Plus, Pencil, Trash2, Globe, ChevronRight, ChevronDown } from 'lucide-react'
import type { Bookmark as BookmarkType, BookmarkFolder } from '@/types'
import { useTabsStore } from '@/store/tabs.store'
import clsx from 'clsx'

export default function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1, 2]))
  const updateTab = useTabsStore(s => s.updateTab)
  const activeTabId = useTabsStore(s => s.activeTabId)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [bm, folds] = await Promise.all([
      window.jarvis?.bookmarks.getAll() ?? Promise.resolve([]),
      window.jarvis?.bookmarks.getFolders() ?? Promise.resolve([]),
    ])
    setBookmarks(bm)
    setFolders(folds)
  }

  const toggleFolder = (id: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const navigate = (url: string) => {
    if (!activeTabId) return
    updateTab(activeTabId, { url, isLoading: true, status: 'loading' })
  }

  const deleteBookmark = async (id: number) => {
    await window.jarvis?.bookmarks.delete(id)
    setBookmarks(bm => bm.filter(b => b.id !== id))
  }

  const rootFolders = folders.filter(f => !f.parent_id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-1">
        {rootFolders.length === 0 && bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bookmark size={28} className="text-jarvis-textDim mb-3" />
            <p className="text-sm text-jarvis-textMuted">No bookmarks yet</p>
            <p className="text-xs text-jarvis-textDim mt-1">Press ⌘D to bookmark a page</p>
          </div>
        ) : (
          rootFolders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              allFolders={folders}
              bookmarks={bookmarks}
              expandedFolders={expandedFolders}
              onToggle={toggleFolder}
              onNavigate={navigate}
              onDeleteBookmark={deleteBookmark}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface FolderItemProps {
  folder: BookmarkFolder
  allFolders: BookmarkFolder[]
  bookmarks: BookmarkType[]
  expandedFolders: Set<number>
  onToggle: (id: number) => void
  onNavigate: (url: string) => void
  onDeleteBookmark: (id: number) => void
  depth: number
}

function FolderItem({ folder, allFolders, bookmarks, expandedFolders, onToggle, onNavigate, onDeleteBookmark, depth }: FolderItemProps) {
  const isExpanded = expandedFolders.has(folder.id)
  const folderBookmarks = bookmarks.filter(b => b.folder_id === folder.id)
  const childFolders = allFolders.filter(f => f.parent_id === folder.id)
  const total = folderBookmarks.length + childFolders.length

  return (
    <div>
      <button
        onClick={() => onToggle(folder.id)}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5',
          'text-jarvis-textMuted hover:text-jarvis-text',
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {isExpanded ? <ChevronDown size={12} className="flex-shrink-0" /> : <ChevronRight size={12} className="flex-shrink-0" />}
        {isExpanded ? <FolderOpen size={13} className="flex-shrink-0 text-jarvis-amber" /> : <Folder size={13} className="flex-shrink-0 text-jarvis-amber" />}
        <span className="flex-1 text-left truncate">{folder.name}</span>
        <span className="text-jarvis-textDim">{total}</span>
      </button>

      {isExpanded && (
        <>
          {childFolders.map(cf => (
            <FolderItem
              key={cf.id}
              folder={cf}
              allFolders={allFolders}
              bookmarks={bookmarks}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onNavigate={onNavigate}
              onDeleteBookmark={onDeleteBookmark}
              depth={depth + 1}
            />
          ))}
          {folderBookmarks.map(bookmark => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              onNavigate={onNavigate}
              onDelete={onDeleteBookmark}
              depth={depth + 1}
            />
          ))}
        </>
      )}
    </div>
  )
}

function BookmarkItem({ bookmark, onNavigate, onDelete, depth }: {
  bookmark: BookmarkType; onNavigate: (url: string) => void; onDelete: (id: number) => void; depth: number
}) {
  return (
    <div
      className="group flex items-center gap-2 py-1.5 pr-3 hover:bg-white/5 transition-colors cursor-pointer"
      style={{ paddingLeft: `${28 + depth * 16}px` }}
    >
      <div className="flex-shrink-0 w-4 h-4">
        {bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <Globe size={13} className="text-jarvis-textDim" />
        )}
      </div>
      <button className="flex-1 min-w-0 text-left" onClick={() => onNavigate(bookmark.url)}>
        <span className="text-xs text-jarvis-text truncate block">{bookmark.title || bookmark.url}</span>
      </button>
      <button
        onClick={() => onDelete(bookmark.id)}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-jarvis-textDim hover:text-jarvis-red transition-all"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}
