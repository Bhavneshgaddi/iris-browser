import { useState, useEffect } from 'react'
import { Layers, Folder, Plus, FolderPlus, Tag, Globe, Trash2 } from 'lucide-react'
import { useTabsStore } from '@/store/tabs.store'
import clsx from 'clsx'

interface Collection { id: string; name: string; color: string; tabIds: string[] }

const COLORS = ['#6C7AFF', '#4ECDC4', '#FFB347', '#FF6B6B', '#B87FFF', '#56CCF2']

export default function ResearchPanel() {
  const tabs = useTabsStore(s => s.tabs)
  const activateTab = useTabsStore(s => s.activateTab)
  const [collections, setCollections] = useState<Collection[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jarvis:research-collections')
    if (saved) try { setCollections(JSON.parse(saved)) } catch {}
  }, [])

  const persist = (cols: Collection[]) => {
    setCollections(cols)
    localStorage.setItem('jarvis:research-collections', JSON.stringify(cols))
  }

  const createCollection = () => {
    if (!newName.trim()) return
    const col: Collection = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      color: COLORS[collections.length % COLORS.length],
      tabIds: [],
    }
    persist([...collections, col])
    setNewName('')
    setAdding(false)
    setActiveCollection(col.id)
  }

  const addCurrentTab = (colId: string) => {
    const activeTab = useTabsStore.getState().getActiveTab()
    if (!activeTab || activeTab.url === 'jarvis://newtab') return
    persist(collections.map(c =>
      c.id === colId && !c.tabIds.includes(activeTab.id)
        ? { ...c, tabIds: [...c.tabIds, activeTab.id] }
        : c
    ))
  }

  const removeFromCollection = (colId: string, tabId: string) => {
    persist(collections.map(c => c.id === colId ? { ...c, tabIds: c.tabIds.filter(t => t !== tabId) } : c))
  }

  const deleteCollection = (colId: string) => {
    persist(collections.filter(c => c.id !== colId))
    if (activeCollection === colId) setActiveCollection(null)
  }

  const activeColl = collections.find(c => c.id === activeCollection)
  const collectionTabs = activeColl?.tabIds.map(id => tabs.find(t => t.id === id)).filter(Boolean) ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header with "Create collection" */}
      <div className="p-3 border-b border-jarvis-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider">Research Collections</span>
          <button onClick={() => setAdding(v => !v)} className="p-1 rounded hover:bg-white/5 text-jarvis-textMuted hover:text-jarvis-accent transition-colors">
            <FolderPlus size={13} />
          </button>
        </div>
        {adding && (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createCollection()}
              placeholder="Collection name..."
              className="flex-1 bg-jarvis-surfaceEl border border-jarvis-border rounded-lg px-2.5 py-1 text-xs text-jarvis-text outline-none"
            />
            <button onClick={createCollection} className="px-2 py-1 rounded-lg bg-jarvis-accent text-white text-xs">
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Collections list */}
      <div className="flex-shrink-0 overflow-x-auto">
        <div className="flex gap-2 p-3">
          {collections.length === 0 ? (
            <p className="text-xs text-jarvis-textDim italic">No collections yet. Create one to group research tabs.</p>
          ) : collections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id === activeCollection ? null : col.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all whitespace-nowrap',
                activeCollection === col.id
                  ? 'border-transparent text-white'
                  : 'bg-jarvis-surfaceEl border-jarvis-border text-jarvis-textMuted hover:text-jarvis-text'
              )}
              style={activeCollection === col.id ? { background: col.color } : {}}
            >
              <Folder size={11} />
              {col.name}
              <span className="opacity-60 text-2xs">{col.tabIds.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active collection detail */}
      <div className="flex-1 overflow-y-auto">
        {activeColl ? (
          <div className="p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-jarvis-text">{activeColl.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => addCurrentTab(activeColl.id)}
                  className="flex items-center gap-1 text-2xs px-2 py-1 rounded bg-jarvis-surfaceEl border border-jarvis-border text-jarvis-textMuted hover:text-jarvis-accent transition-colors"
                >
                  <Plus size={10} /> Add current tab
                </button>
                <button onClick={() => deleteCollection(activeColl.id)} className="p-1 rounded text-jarvis-textDim hover:text-jarvis-red transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            {collectionTabs.length === 0 ? (
              <p className="text-xs text-jarvis-textDim italic py-4 text-center">No tabs in this collection. Add the current tab using the button above.</p>
            ) : collectionTabs.map(tab => tab && (
              <div key={tab.id} className="flex items-center gap-2 p-2 rounded-lg bg-jarvis-surfaceEl border border-jarvis-border group">
                {tab.favicon ? <img src={tab.favicon} className="w-4 h-4 rounded" alt="" /> : <Globe size={14} className="text-jarvis-textDim" />}
                <button onClick={() => activateTab(tab.id)} className="flex-1 text-left truncate text-xs text-jarvis-text hover:text-jarvis-accent">
                  {tab.title || tab.url}
                </button>
                <button onClick={() => removeFromCollection(activeColl.id, tab.id)} className="opacity-0 group-hover:opacity-100 text-jarvis-textDim hover:text-jarvis-red transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Layers size={28} className="text-jarvis-textDim mb-3" />
            <p className="text-xs text-jarvis-textDim">Select a collection to view its tabs, or create a new one to start organizing your research.</p>
          </div>
        )}
      </div>
    </div>
  )
}
