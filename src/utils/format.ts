export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export function truncateUrl(url: string, maxLen = 60): string {
  try {
    const parsed = new URL(url)
    const display = parsed.hostname + parsed.pathname
    return display.length > maxLen ? display.slice(0, maxLen - 3) + '…' : display
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen - 3) + '…' : url
  }
}
