import { useEffect } from 'react'
import { Cpu, HardDrive, Zap, BatteryLow, Trash2, RefreshCw, Moon } from 'lucide-react'
import { usePerformanceStore } from '@/store/performance.store'
import { useTabsStore } from '@/store/tabs.store'
import clsx from 'clsx'

function Bar({ value, color = 'bg-jarvis-accent' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-jarvis-surfaceEl rounded-full overflow-hidden">
      <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

function Stat({ label, value, unit, icon }: { label: string; value: string | number; unit?: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-jarvis-surfaceEl rounded-lg">
      <div className="text-jarvis-accent">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-2xs text-jarvis-textDim uppercase tracking-wider">{label}</div>
        <div className="text-sm font-semibold text-jarvis-text">{value}{unit && <span className="text-jarvis-textDim text-xs ml-1">{unit}</span>}</div>
      </div>
    </div>
  )
}

export default function PerformancePanel() {
  const { metrics, cpuPercent, battery, isMonitoring, startMonitoring, stopMonitoring, clearCache } = usePerformanceStore()
  const tabs = useTabsStore(s => s.tabs)
  const sleepTab = useTabsStore(s => s.sleepTab)

  useEffect(() => { startMonitoring(); return stopMonitoring }, [])

  const inactiveTabs = tabs.filter(t => !t.isActive && !t.isSleeping && t.url !== 'jarvis://newtab')
  const sleepingTabs = tabs.filter(t => t.isSleeping)

  const cpuColor = cpuPercent > 80 ? 'bg-jarvis-red' : cpuPercent > 50 ? 'bg-jarvis-amber' : 'bg-jarvis-green'
  const memPercent = metrics ? Math.round((metrics.mainHeapMB / Math.max(metrics.totalProcessMB, 1)) * 100) : 0

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* CPU */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-jarvis-textMuted">CPU</span>
          <span className="text-xs font-mono text-jarvis-text">{cpuPercent}%</span>
        </div>
        <Bar value={cpuPercent} color={cpuColor} />
      </div>

      {/* Memory */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-jarvis-textMuted">Memory</span>
          <span className="text-xs font-mono text-jarvis-text">{metrics?.totalProcessMB ?? '—'} MB</span>
        </div>
        <Bar value={memPercent} color={metrics && metrics.totalProcessMB > 1000 ? 'bg-jarvis-red' : 'bg-jarvis-accent'} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-2">
        <Stat icon={<Cpu size={14} />} label="Processes" value={metrics?.processCount ?? '—'} unit="running" />
        <Stat icon={<HardDrive size={14} />} label="Heap Used" value={metrics?.mainHeapMB ?? '—'} unit="MB" />
        {battery && <Stat icon={<BatteryLow size={14} />} label="Battery" value={battery.percent > 0 ? `${battery.percent}%` : '—'} unit={battery.onBattery ? 'on battery' : 'charging'} />}
        <Stat icon={<Zap size={14} />} label="Tab Count" value={tabs.length} unit={`(${sleepingTabs.length} sleeping)`} />
      </div>

      {/* Tab Sleeping */}
      {inactiveTabs.length > 0 && (
        <div className="border border-jarvis-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-jarvis-text">Inactive Tabs</span>
            <button
              onClick={() => inactiveTabs.forEach(t => sleepTab(t.id))}
              className="flex items-center gap-1 text-2xs text-jarvis-accent hover:text-jarvis-accentHi transition-colors"
            >
              <Moon size={11} /> Sleep all
            </button>
          </div>
          {inactiveTabs.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between py-1">
              <span className="text-xs text-jarvis-textMuted truncate flex-1">{t.title || t.url}</span>
              <button onClick={() => sleepTab(t.id)} className="text-2xs text-jarvis-textDim hover:text-jarvis-accent transition-colors ml-2">
                <Moon size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={clearCache}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-jarvis-surfaceEl border border-jarvis-border text-xs text-jarvis-textMuted hover:text-jarvis-text hover:border-jarvis-borderHi transition-all"
        >
          <Trash2 size={13} /> Clear Cache
        </button>
        <button
          onClick={usePerformanceStore.getState().refresh}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-jarvis-surfaceEl border border-jarvis-border text-xs text-jarvis-textMuted hover:text-jarvis-text hover:border-jarvis-borderHi transition-all"
        >
          <RefreshCw size={13} /> Refresh Metrics
        </button>
      </div>
    </div>
  )
}
