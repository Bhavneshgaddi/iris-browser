import { create } from 'zustand'

export interface Note {
  id: number
  title: string
  content: string
  url?: string
  tags: string[]
  created_at: string
  updated_at: string
}

interface NotesState {
  notes: Note[]
  activeNoteId: number | null
  searchQuery: string
  isLoaded: boolean
  load: () => Promise<void>
  create: (data?: Partial<Note>) => Promise<Note>
  update: (id: number, patch: Partial<Note>) => Promise<void>
  delete: (id: number) => Promise<void>
  search: (q: string) => Promise<void>
  setActive: (id: number | null) => void
  getActive: () => Note | undefined
}

function parseNote(raw: any): Note {
  return { ...raw, tags: typeof raw.tags === 'string' ? JSON.parse(raw.tags) : (raw.tags ?? []) }
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [], activeNoteId: null, searchQuery: '', isLoaded: false,

  load: async () => {
    const raw = await window.jarvis?.notes?.getAll() ?? []
    set({ notes: raw.map(parseNote), isLoaded: true })
  },

  create: async (data = {}) => {
    const raw = await window.jarvis?.notes?.create(data)
    const note = parseNote(raw)
    set(s => ({ notes: [note, ...s.notes], activeNoteId: note.id }))
    return note
  },

  update: async (id, patch) => {
    const raw = await window.jarvis?.notes?.update(id, patch)
    if (!raw) return
    const note = parseNote(raw)
    set(s => ({ notes: s.notes.map(n => n.id === id ? note : n) }))
  },

  delete: async (id) => {
    await window.jarvis?.notes?.delete(id)
    set(s => ({
      notes: s.notes.filter(n => n.id !== id),
      activeNoteId: s.activeNoteId === id ? null : s.activeNoteId,
    }))
  },

  search: async (q) => {
    set({ searchQuery: q })
    if (!q.trim()) { get().load(); return }
    const raw = await window.jarvis?.notes?.search(q) ?? []
    set({ notes: raw.map(parseNote) })
  },

  setActive: (id) => set({ activeNoteId: id }),
  getActive: () => get().notes.find(n => n.id === get().activeNoteId),
}))
