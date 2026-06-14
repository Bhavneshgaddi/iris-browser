import { useState, useEffect } from 'react'
import { Download, File, CheckCircle, XCircle, AlertCircle, Folder, Trash2, RefreshCw } from 'lucide-react'
import type { Download as DownloadType } from '@/types'
import { formatBytes, formatSpeed } from '@/utils/format'
import clsx from 'clsx'

export default function DownloadsPanel() {
  const [downloads, setDownloads] = useState<DownloadType[]>([])

  useEffect(() => {
    loadDownloads()

    const unsubProgress = window.jarvis?.downloads.onProgress(({ id, progress, speed }) => {
      setDownloads(prev =>
        prev.map(d => d.id === Number(id) ? { ...d, progress, speed, recv_bytes: Math.floor(d.total_bytes * progress) } : d)
      )
    })

    const unsubComplete = window.jarvis?.downloads.onComplete(({ id }) => {
      // Refresh list when a download completes so status updates from DB
      loadDownloads()
    })

    return () => {
      unsubProgress?.()
      unsubComplete?.()
    }
  }, [])

  const loadDownloads = async () => {
    const all = await window.jarvis?.downloads.getAll() ?? []
    setDownloads(all)
  }

  const deleteDownload = async (id: number) => {
    await window.jarvis?.downloads.delete(id)
    setDownloads(prev => prev.filter(d => d.id !== id))
  }

  const clearCompleted = async () => {
    await window.jarvis?.downloads.clear()
    setDownloads(prev => prev.filter(d => d.status === 'downloading'))
  }

  const active = downloads.filter(d => d.status === 'downloading')
  const finished = downloads.filter(d => d.status !== 'downloading')

  return (
    <div className="flex flex-col h-full">
      {downloads.length > 0 && finished.length > 0 && (
        <div className="px-3 py-2 border-b border-jarvis-border">
          <button
            onClick={clearCompleted}
            className="flex items-center gap-1.5 text-xs text-jarvis-textMuted hover:text-jarvis-text transition-colors"
          >
            <Trash2 size={12} />
            Clear completed
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Download size={28} className="text-jarvis-textDim mb-3" />
            <p className="text-sm text-jarvis-textMuted">No downloads yet</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider bg-jarvis-bg/50">
                  Active
                </div>
                {active.map(d => <DownloadItem key={d.id} download={d} onDelete={deleteDownload} />)}
              </div>
            )}
            {finished.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider bg-jarvis-bg/50">
                  Completed
                </div>
                {finished.map(d => <DownloadItem key={d.id} download={d} onDelete={deleteDownload} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DownloadItem({ download, onDelete }: { download: DownloadType; onDelete: (id: number) => void }) {
  const progress = download.total_bytes > 0
    ? (download.recv_bytes / download.total_bytes) * 100
    : download.progress ? download.progress * 100 : 0

  const StatusIcon = {
    completed: <CheckCircle size={14} className="text-jarvis-green" />,
    failed: <XCircle size={14} className="text-jarvis-red" />,
    cancelled: <AlertCircle size={14} className="text-jarvis-textDim" />,
    downloading: <div className="w-3.5 h-3.5 border-2 border-jarvis-accent border-t-transparent rounded-full animate-spin" />,
    pending: <RefreshCw size={14} className="text-jarvis-textDim animate-spin-slow" />,
  }[download.status]

  const openFolder = () => {
    if (download.file_path) {
      window.jarvis?.downloads.openFolder(download.file_path)
    }
  }

  return (
    <div className="group flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        <File size={18} className="text-jarvis-textDim" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-jarvis-text truncate font-medium">{download.filename}</span>
          {StatusIcon}
        </div>
        {download.status === 'downloading' && (
          <>
            <div className="mt-1.5 h-1 bg-jarvis-surfaceEl rounded-full overflow-hidden">
              <div
                className="h-full bg-jarvis-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 flex items-center gap-2 text-2xs text-jarvis-textDim">
              <span>{formatBytes(download.recv_bytes)} / {formatBytes(download.total_bytes)}</span>
              {download.speed && <span>• {formatSpeed(download.speed)}</span>}
            </div>
          </>
        )}
        {download.status === 'completed' && (
          <div className="text-2xs text-jarvis-textDim mt-0.5">{formatBytes(download.total_bytes)}</div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {download.status === 'completed' && (
          <button
            onClick={openFolder}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-jarvis-textDim hover:text-jarvis-text transition-all"
            title="Show in folder"
          >
            <Folder size={12} />
          </button>
        )}
        <button
          onClick={() => onDelete(download.id)}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-jarvis-textDim hover:text-jarvis-red transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
