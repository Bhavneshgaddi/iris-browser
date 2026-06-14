import { useUIStore } from '@/store/ui.store'
import HistoryPanel from '@/components/features/history/HistoryPanel'
import BookmarksPanel from '@/components/features/bookmarks/BookmarksPanel'
import DownloadsPanel from '@/components/features/downloads/DownloadsPanel'
import SettingsPanel from '@/components/features/settings/SettingsPanel'
import PerformancePanel from '@/components/features/performance/PerformancePanel'
import PrivacyPanel from '@/components/features/privacy/PrivacyPanel'
import NotesPanel from '@/components/features/notes/NotesPanel'
import AIPanel from '@/components/features/ai/AIPanel'
import ResearchPanel from '@/components/features/research/ResearchPanel'
import ExamPanel from '@/components/features/exam/ExamPanel'
import { X } from 'lucide-react'

export default function SidePanel() {
  const { sidePanel, closePanel } = useUIStore()

  const panelTitles: Record<string, string> = {
    history: 'History',
    bookmarks: 'Bookmarks',
    downloads: 'Downloads',
    settings: 'Settings',
    performance: 'Performance Monitor',
    privacy: 'Privacy Dashboard',
    notes: 'My Notes',
    ai: 'Jarvis AI Assistant',
    research: 'Research Collections',
    exam: 'Exam Mode',
  }

  return (
    <div className="jarvis-panel w-full h-full flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-jarvis-border flex-shrink-0">
        <span className="text-sm font-semibold text-jarvis-text">
          {sidePanel ? panelTitles[sidePanel] : ''}
        </span>
        <button
          onClick={closePanel}
          className="jarvis-btn-icon w-7 h-7"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {sidePanel === 'history' && <HistoryPanel />}
        {sidePanel === 'bookmarks' && <BookmarksPanel />}
        {sidePanel === 'downloads' && <DownloadsPanel />}
        {sidePanel === 'settings' && <SettingsPanel />}
        {sidePanel === 'performance' && <PerformancePanel />}
        {sidePanel === 'privacy' && <PrivacyPanel />}
        {sidePanel === 'notes' && <NotesPanel />}
        {sidePanel === 'ai' && <AIPanel />}
        {sidePanel === 'research' && <ResearchPanel />}
        {sidePanel === 'exam' && <ExamPanel />}
      </div>
    </div>
  )
}
