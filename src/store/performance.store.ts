import { create } from 'zustand'

interface ProcessInfo { pid: number; type: string; memoryMB: number }
interface Metrics {
  mainHeapMB: number
  totalProcessMB: number
  processCount: number
  processes: ProcessInfo[]
}

interface PerformanceState {
  metrics: Metrics | null
  cpuPercent: number
  battery: { onBattery: boolean; percent: number } | null
  isMonitoring: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
  clearCache: () => Promise<void>
  refresh: () => Promise<void>
}

export const usePerformanceStore = create<PerformanceState>((set, get) => {
  let timer: ReturnType<typeof setInterval> | null = null

  const poll = async () => {
    try {
      const [metrics, cpuPercent, battery] = await Promise.all([
        window.jarvis?.performance?.metrics(),
        window.jarvis?.performance?.cpu(),
        window.jarvis?.performance?.battery(),
      ])
      set({ metrics: metrics ?? null, cpuPercent: cpuPercent ?? 0, battery: battery ?? null })
    } catch {}
  }

  return {
    metrics: null, cpuPercent: 0, battery: null, isMonitoring: false,
    startMonitoring: () => {
      if (timer) return
      set({ isMonitoring: true })
      poll()
      timer = setInterval(poll, 3000)
    },
    stopMonitoring: () => {
      if (timer) { clearInterval(timer); timer = null }
      set({ isMonitoring: false })
    },
    clearCache: async () => { await window.jarvis?.performance?.clearCache() },
    refresh: async () => { await poll() },
  }
})
