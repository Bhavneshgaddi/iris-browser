import { useEffect, useState } from 'react'
import { Plus, Trash2, Link, Search, FileText, Save, Tag } from 'lucide-react'
import { useNotesStore, Note } from '@/store/notes.store'
import { useTabsStore } from '@/store/tabs.store'
import clsx from 'clsx'

export default function NotesPanel() {
  const { notes, activeNoteId, searchQuery, load, create, update, delete: deleteNote, search, setActive, getActive } = useNotesStore()
  const activeTab = useTabsStore(s => s.getActiveTab())
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => { load() }, [])

  const activeNote = getActive()

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title)
      setContent(activeNote.content)
      setTags(activeNote.tags)
    } else {
      setTitle('')
      setContent('')
      setTags([])
    }
  }, [activeNoteId, activeNote])

  const handleSave = async () => {
    if (!activeNoteId) return
    await update(activeNoteId, { title, content, tags })
  }

  const handleCreateNote = async () => {
    const currentUrl = activeTab && activeTab.url !== 'jarvis://newtab' ? activeTab.url : undefined
    const note = await create({
      title: 'New Note',
      content: '',
      url: currentUrl,
      tags: [],
    })
    setActive(note.id)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim())) {
        const nextTags = [...tags, tagInput.trim()]
        setTags(nextTags)
        if (activeNoteId) update(activeNoteId, { tags: nextTags })
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (t: string) => {
    const nextTags = tags.filter(x => x !== t)
    setTags(nextTags)
    if (activeNoteId) update(activeNoteId, { tags: nextTags })
  }

  return (
    <div className="flex flex-col h-full bg-jarvis-bg border-l border-jarvis-border">
      {/* Top action bar: Search & Add */}
      <div className="p-3 border-b border-jarvis-border flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-2.5 text-jarvis-textDim" />
            <input
              value={searchQuery}
              onChange={e => search(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-jarvis-surfaceEl border border-jarvis-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-jarvis-text outline-none placeholder:text-jarvis-textDim"
            />
          </div>
          <button
            onClick={handleCreateNote}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-jarvis-accent hover:bg-jarvis-accentHi text-white transition-colors"
            title="Create note"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Main split area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeNoteId ? (
          /* Note Editor */
          <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActive(null)}
                className="text-xs text-jarvis-textMuted hover:text-jarvis-text"
              >
                ← Back to list
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded hover:bg-white/5 text-jarvis-textMuted hover:text-jarvis-accent"
                  title="Save Note"
                >
                  <Save size={13} />
                </button>
                <button
                  onClick={() => deleteNote(activeNoteId)}
                  className="p-1.5 rounded hover:bg-white/5 text-jarvis-textMuted hover:text-jarvis-red"
                  title="Delete Note"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <input
              value={title}
              onChange={e => { setTitle(e.target.value); if (activeNoteId) update(activeNoteId, { title: e.target.value }) }}
              className="bg-transparent text-sm font-semibold text-jarvis-text outline-none placeholder:text-jarvis-textDim"
              placeholder="Title"
            />

            {activeNote?.url && (
              <a
                href={activeNote.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-2xs text-jarvis-purple hover:underline truncate"
              >
                <Link size={10} />
                {activeNote.url}
              </a>
            )}

            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); if (activeNoteId) update(activeNoteId, { content: e.target.value }) }}
              className="flex-1 bg-transparent text-xs text-jarvis-textMuted placeholder:text-jarvis-textDim outline-none resize-none font-sans leading-relaxed"
              placeholder="Type note content..."
            />

            {/* Tags area */}
            <div className="border-t border-jarvis-border pt-2.5 flex flex-col gap-1.5 flex-shrink-0">
              <div className="flex flex-wrap gap-1">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-jarvis-surfaceEl text-jarvis-textMuted text-2xs">
                    {t}
                    <button onClick={() => handleRemoveTag(t)} className="text-jarvis-textDim hover:text-jarvis-text font-bold">×</button>
                  </span>
                ))}
              </div>
              <div className="relative flex items-center">
                <Tag size={10} className="absolute left-2 text-jarvis-textDim" />
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag (Press Enter)..."
                  className="w-full bg-jarvis-surfaceEl border border-jarvis-border rounded-md pl-6 pr-2 py-1 text-2xs text-jarvis-text outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Notes List */
          <div className="flex-1 overflow-y-auto divide-y divide-jarvis-border/40">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={24} className="text-jarvis-textDim mb-2" />
                <p className="text-xs text-jarvis-textDim">No notes found</p>
              </div>
            ) : (
              notes.map(n => (
                <button
                  key={n.id}
                  onClick={() => setActive(n.id)}
                  className="w-full flex flex-col text-left p-3 hover:bg-white/5 transition-colors gap-1 group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-jarvis-text truncate flex-1 pr-2">
                      {n.title || 'Untitled Note'}
                    </span>
                    <span className="text-2xs text-jarvis-textDim flex-shrink-0">
                      {new Date(n.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-2xs text-jarvis-textDim line-clamp-2">
                    {n.content || 'Empty note...'}
                  </p>
                  {n.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {n.tags.slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-jarvis-surfaceEl text-2xs text-jarvis-textMuted font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
