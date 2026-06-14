import { useEffect, useRef } from 'react'
import { useTabsStore } from '@/store/tabs.store'
import NewTabPage from '@/components/browser/NewTabPage'
import clsx from 'clsx'

const NEW_TAB_URL = 'iris://newtab'

export default function WebViewContainer() {
  const { tabs, activeTabId, updateTab } = useTabsStore()

  // Listen for navigation events dispatched by Toolbar / keyboard shortcuts
  useEffect(() => {
    const getActiveWebview = () => {
      if (!activeTabId) return null
      return document.getElementById(`webview-${activeTabId}`) as Electron.WebviewTag | null
    }

    const onBack = () => getActiveWebview()?.goBack()
    const onForward = () => getActiveWebview()?.goForward()
    const onReload = () => getActiveWebview()?.reload()
    const onStop = () => getActiveWebview()?.stop()

    document.addEventListener('browser:go-back', onBack)
    document.addEventListener('browser:go-forward', onForward)
    document.addEventListener('browser:reload', onReload)
    document.addEventListener('browser:stop', onStop)

    return () => {
      document.removeEventListener('browser:go-back', onBack)
      document.removeEventListener('browser:go-forward', onForward)
      document.removeEventListener('browser:reload', onReload)
      document.removeEventListener('browser:stop', onStop)
    }
  }, [activeTabId])

  return (
    <div className="relative w-full h-full bg-white">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={clsx(
            'absolute inset-0',
            tab.id === activeTabId ? 'z-10 visible' : 'z-0 invisible pointer-events-none'
          )}
        >
          {tab.url === NEW_TAB_URL ? (
            <NewTabPage tabId={tab.id} />
          ) : (
            <WebViewTab tab={tab} isActive={tab.id === activeTabId} updateTab={updateTab} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Individual WebView ──────────────────────────────────────────────────────
interface WebViewTabProps {
  tab: { id: string; url: string; isMuted: boolean; zoom: number; title?: string }
  isActive: boolean
  updateTab: (id: string, patch: any) => void
}

function WebViewTab({ tab, isActive, updateTab }: WebViewTabProps) {
  const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron')

  if (!isElectron) {
    return (
      <iframe
        id={`webview-${tab.id}`}
        src={tab.url}
        className="w-full h-full border-none"
        title={tab.title}
        onLoad={() => {
          updateTab(tab.id, {
            isLoading: false,
            status: 'complete',
            title: tab.title || tab.url,
          })
          if (tab.url && !tab.url.startsWith('iris://') && !tab.url.startsWith('jarvis://')) {
            window.jarvis?.history.add({ url: tab.url, title: tab.title || tab.url })
          }
        }}
      />
    )
  }

  const webviewRef = useRef<Electron.WebviewTag>(null)
  const isAttached = useRef(false)

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv || isAttached.current) return
    isAttached.current = true

    const onLoadStart = () => {
      updateTab(tab.id, { isLoading: true, status: 'loading' })
    }

    const onLoadStop = () => {
      updateTab(tab.id, {
        isLoading: false,
        status: 'complete',
        url: wv.getURL(),
        title: wv.getTitle() || wv.getURL(),
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
      })
      // Record history
      const url = wv.getURL()
      const title = wv.getTitle()
      if (url && !url.startsWith('jarvis://')) {
        window.jarvis?.history.add({ url, title })
      }
    }

    const onDidFailLoad = (e: any) => {
      if (e.errorCode === -3) return // Aborted (user navigated away)
      updateTab(tab.id, { isLoading: false, status: 'error' })
    }

    const onPageTitleUpdated = (e: any) => {
      updateTab(tab.id, { title: e.title })
    }

    const onPageFaviconUpdated = (e: any) => {
      if (e.favicons?.[0]) {
        updateTab(tab.id, { favicon: e.favicons[0] })
      }
    }

    const onDidNavigate = () => {
      updateTab(tab.id, {
        url: wv.getURL(),
        canGoBack: wv.canGoBack(),
        canGoForward: wv.canGoForward(),
      })
    }

    const onNewWindow = (e: any) => {
      // Open in new tab
      useTabsStore.getState().createTab(e.url, true)
    }

    wv.addEventListener('did-start-loading', onLoadStart)
    wv.addEventListener('did-stop-loading', onLoadStop)
    wv.addEventListener('did-fail-load', onDidFailLoad)
    wv.addEventListener('page-title-updated', onPageTitleUpdated)
    wv.addEventListener('page-favicon-updated', onPageFaviconUpdated)
    wv.addEventListener('did-navigate', onDidNavigate)
    wv.addEventListener('did-navigate-in-page', onDidNavigate)
    wv.addEventListener('new-window', onNewWindow)

    return () => {
      wv.removeEventListener('did-start-loading', onLoadStart)
      wv.removeEventListener('did-stop-loading', onLoadStop)
      wv.removeEventListener('did-fail-load', onDidFailLoad)
      wv.removeEventListener('page-title-updated', onPageTitleUpdated)
      wv.removeEventListener('page-favicon-updated', onPageFaviconUpdated)
      wv.removeEventListener('did-navigate', onDidNavigate)
      wv.removeEventListener('did-navigate-in-page', onDidNavigate)
      wv.removeEventListener('new-window', onNewWindow)
    }
  }, [])

  // Sync URL changes from store → webview
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    try {
      const current = wv.getURL()
      if (current !== tab.url && tab.url) {
        wv.loadURL(tab.url)
      }
    } catch {
      // webview not ready yet
    }
  }, [tab.url])

  // Mute/unmute
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    try { wv.setAudioMuted(tab.isMuted) } catch {}
  }, [tab.isMuted])

  // Zoom
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    try { wv.setZoomFactor(tab.zoom / 100) } catch {}
  }, [tab.zoom])

  return (
    <webview
      id={`webview-${tab.id}`}
      ref={webviewRef as any}
      src={tab.url}
      className="w-full h-full"
      allowpopups={true}
      partition="persist:main"
      webpreferences="contextIsolation=yes, javascript=yes"
    />
  )
}
