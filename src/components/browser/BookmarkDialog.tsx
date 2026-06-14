import { useState, useEffect } from 'react'
import { Bookmark, FolderOpen, X } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import type { BookmarkFolder } from '@/types'

export default function BookmarkDialog() {
  const { bookmarkDialogUrl, bookmarkDialogTitle, closeBookmarkDialog } = useUIStore()
  const [title, setTitle] = useState(bookmarkDialogTitle)
  const [folderId, setFolderId] = useState(1)
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    window.jarvis?.bookmarks.getFolders().then(setFolders)
    setTitle(bookmarkDialogTitle)
  }, [bookmarkDialogTitle])

  const handleSave = async () => {
    await window.jarvis?.bookmarks.add({
      url: bookmarkDialogUrl,
      title,
      folderId,
    })
    setIsSaved(true)
    setTimeout(() => closeBookmarkDialog(), 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={closeBookmarkDialog}>
      <div
        className="bg-jarvis-surface border border-jarvis-border rounded-2xl shadow-tooltip w-80 p-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bookmark size={15} className="text-jarvis-accent" />
            <span className="text-sm font-semibold text-jarvis-text">
              {isSaved ? '✓ Bookmark saved!' : 'Add bookmark'}
            </span>
          </div>
          <button onClick={closeBookmarkDialog} className="jarvis-btn-icon w-7 h-7">
            <X size={13} />
          </button>
        </div>

        {!isSaved && (
          <>
            {/* Name */}
            <div className="mb-3">
              <label className="text-xs text-jarvis-textMuted block mb-1">Name</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="jarvis-input text-xs"
                autoFocus
              />
            </div>

            {/* URL (readonly) */}
            <div className="mb-3">
              <label className="text-xs text-jarvis-textMuted block mb-1">URL</label>
              <input
                value={bookmarkDialogUrl}
                readOnly
                className="jarvis-input text-xs opacity-60"
              />
            </div>

            {/* Folder */}
            <div className="mb-4">
              <label className="text-xs text-jarvis-textMuted block mb-1">Folder</label>
              <select
                value={folderId}
                onChange={e => setFolderId(Number(e.target.value))}
                className="jarvis-input text-xs"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={closeBookmarkDialog} className="jarvis-btn flex-1 text-xs bg-transparent border border-jarvis-border text-jarvis-textMuted hover:text-jarvis-text hover:border-jarvis-borderHi">
                Cancel
              </button>
              <button onClick={handleSave} className="jarvis-btn-primary flex-1 text-xs">
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
