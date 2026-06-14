import { ipcMain, app, session, powerMonitor } from 'electron'

export function registerPerformanceHandlers() {
  // Process memory (main + renderer combined via app metrics)
  ipcMain.handle('performance:metrics', () => {
    const metrics = app.getAppMetrics()
    const mem = process.memoryUsage()
    let totalMemoryMB = 0
    for (const m of metrics) {
      totalMemoryMB += (m.memory?.workingSetSize ?? 0) / 1024
    }
    return {
      mainHeapMB: Math.round(mem.heapUsed / 1024 / 1024),
      totalProcessMB: Math.round(totalMemoryMB),
      processCount: metrics.length,
      processes: metrics.map(m => ({
        pid: m.pid,
        type: m.type,
        memoryMB: Math.round((m.memory?.workingSetSize ?? 0) / 1024),
      })),
    }
  })

  // CPU usage (sampled over 200ms)
  ipcMain.handle('performance:cpu', async () => {
    const start = process.cpuUsage()
    await new Promise(r => setTimeout(r, 200))
    const delta = process.cpuUsage(start)
    return Math.min(Math.round((delta.user + delta.system) / 2000), 100)
  })

  // Battery status
  ipcMain.handle('performance:battery', () => {
    try {
      return {
        onBattery: powerMonitor.isOnBatteryPower(),
        percent: (powerMonitor as any).getBatteryPercent?.() ?? -1,
      }
    } catch {
      return { onBattery: false, percent: -1 }
    }
  })

  // Clear all caches
  ipcMain.handle('performance:clear-cache', async () => {
    await session.defaultSession.clearCache()
    return true
  })

  // Clear storage data (cookies, local storage, etc.)
  ipcMain.handle('performance:clear-storage', async (_e, origins: string[]) => {
    await session.defaultSession.clearStorageData({
      origin: origins.length ? origins[0] : undefined,
      storages: ['cookies', 'filesystem', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'],
    })
    return true
  })
}
