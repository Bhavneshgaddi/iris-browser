# IRIS Browser

> A next-generation AI-powered research and study browser, fully optimized for both desktop (Electron) and standard web/mobile browsers (as an installable Progressive Web App - PWA).
> Built on React · TypeScript · SQLite / LocalStorage · Zustand · Vite.

---

## 📱 Mobile & Web Compatibility (PWA)

IRIS includes a **Web Fallback Layer** (`src/web-fallback.ts`). When launched outside the Electron container (e.g., inside Safari on iOS, Chrome on Android, or Chrome Desktop):
1. **API Simulation**: `window.jarvis` is dynamically populated with a local-storage-backed simulation of the settings store, bookmarks manager, history database, session state, performance stats, notes database, and rule-based AI companion.
2. **Dynamic Rendering**: In web/mobile mode, the Chromium `<webview>` tag automatically falls back to standard responsive `<iframe>` tags, allowing you to browse web pages directly from a phone or web browser!
3. **PWA Installability**: Mobile Chrome will display a "Download App" or "Add to Home Screen" option automatically due to the included Web Manifest (`public/manifest.json`), service worker (`public/sw.js`), and modern logo icons.

---

## ✅ Implementation Status — All 7 Phases Complete

| Phase | Feature Area | Status | Key Components |
|---|---|---|---|
| **1** | Core Browser | ✅ Complete | Tabs, Address bar, Bookmarks, History (FTS5), Downloads, Settings, Session restore, Incognito mode |
| **2** | Performance Dashboard | ✅ Complete | CPU monitor, RAM tracker, battery status, tab sleeping, cache cleaner |
| **3** | Privacy Dashboard | ✅ Complete | Ad/tracker blocker (35+ domains), HTTPS enforcement, cookie manager, data wiper |
| **4** | Notes Workspace | ✅ Complete | Rich notes editor, website-linked notes, tags, search, auto-save |
| **5** | AI Assistant | ✅ Complete | Chat UI, page summarizer, flashcard generator, quiz maker, text-to-speech |
| **6** | Research Mode | ✅ Complete | Named tab collections, add/remove tabs, localStorage persistence |
| **7** | Exam Mode | ✅ Complete | Pomodoro timer (25/5/15 min), study goal checklist, focus site blocklist |

---

## 🏗️ Architecture

```
iris-browser/
├── public/
│   ├── manifest.json              # Web manifest for mobile installability (PWA)
│   ├── sw.js                      # Service worker for offline shell load
│   └── icon.png                   # PWA icon generated for mobile devices
├── electron/
│   ├── main.ts                    # App lifecycle, BrowserWindow, navigation safety
│   ├── preload.ts                 # contextBridge — typed window.jarvis API
│   ├── database.ts                # SQLite init, WAL mode, FTS5, v1 migration
│   └── ipc/
│       ├── history.ts             # History CRUD + FTS5 full-text search
│       ├── bookmarks.ts           # Bookmark folders + metadata CRUD
│       ├── downloads.ts           # Native download progress & state
│       ├── settings.ts            # Persistent key-value settings store
│       ├── window.ts              # Session save/restore across launches
│       ├── performance.ts         # CPU, memory metrics, cache clearing
│       ├── privacy.ts             # Ad/tracker blocking, cookie management
│       ├── notes.ts               # Notes CRUD + full-text search
│       └── ai.ts                  # AI chat, summarize, explain, translate
├── src/
│   ├── web-fallback.ts            # Web/mobile compatibility fallback API simulator
│   ├── main.tsx                   # Entrypoint importing web-fallback first
│   ├── types/index.ts             # All shared TypeScript types + JarvisAPI interface
│   ├── store/
│   │   ├── tabs.store.ts          # Tabs state: create, close, sleep, pin, mute, restore
│   │   ├── ui.store.ts            # SidePanel, modals, theme state
│   │   ├── settings.store.ts      # Persistent user preferences
│   │   ├── performance.store.ts   # CPU/RAM polling store
│   │   ├── privacy.store.ts       # Ad-blocking stats store
│   │   └── notes.store.ts         # Notes list, search, active note editor state
│   ├── components/
│   │   ├── layout/BrowserShell.tsx         # Root layout container
│   │   └── browser/
│   │       ├── TitleBar.tsx                # Custom titlebar or thin spacer on web/mobile
│   │       ├── TabBar.tsx                  # Tab strip (pin, mute, sleep, close, reorder)
│   │       ├── Toolbar.tsx                 # Address bar, nav buttons, 10 panel toggles
│   │       ├── BookmarksBar.tsx            # Quick-access bookmarks strip
│   │       ├── WebViewContainer.tsx        # Electron webview or iframe per tab
│   │       ├── NewTabPage.tsx              # iris://newtab — clock, search, quick links
│   │       ├── SidePanel.tsx              # Panel router for all feature panels
│   │       ├── BookmarkDialog.tsx          # Add/edit bookmark overlay
│   │       └── CommandPalette.tsx          # ⌘K — search history, bookmarks, open tabs
│   └── components/features/
│       ├── history/HistoryPanel.tsx        # Search history grouped by date
│       ├── bookmarks/BookmarksPanel.tsx    # Folder tree + CRUD
│       ├── downloads/DownloadsPanel.tsx    # Live progress + open-in-folder
│       ├── settings/SettingsPanel.tsx      # All user preferences
│       ├── performance/PerformancePanel.tsx# CPU/RAM bars, process list, tab sleep
│       ├── privacy/PrivacyPanel.tsx        # Shield toggle, stats, data wiper
│       ├── notes/NotesPanel.tsx            # Note list + in-panel editor + tags
│       ├── ai/AIPanel.tsx                 # Chat UI with quick actions + speak-aloud
│       ├── research/ResearchPanel.tsx      # Tab collections (localStorage persisted)
│       └── exam/ExamPanel.tsx             # Pomodoro + goals + focus blocklist
├── tailwind.config.js                     # IRIS design system tokens
└── package.json                           # Scripts + dependencies
```

---

## 🚀 Deployment & Local Commands

### To run locally on Desktop:
```bash
npm run dev
```

### To build the production app (generates desktop installer inside `release/`):
```bash
npm run build
```

### To deploy online for Mobile:
1. Build the production web bundle:
   ```bash
   npx vite build
   ```
2. The static web files will be compiled inside the `dist/` directory.
3. Deploy this `dist/` folder to any static hosting provider such as **Vercel**, **Netlify**, **Render**, or **GitHub Pages**.
4. Open the deployed website link inside Chrome on Android or Safari on iOS.
5. In Chrome, tap the **Three dots menu** and select **"Add to Home Screen"** or **"Install App"** to install it directly onto your phone as a mobile browser!

---

## 🎨 Color Palette & Design Tokens

All design tokens are in `tailwind.config.js`:

| Token | Value | Use |
|---|---|---|
| `jarvis-bg` | `#0E0F14` | Page background |
| `jarvis-surface` | `#161822` | Cards, panels |
| `jarvis-surfaceEl` | `#1E2030` | Inputs, elevated elements |
| `jarvis-border` | `#2A2D3E` | Default borders |
| `jarvis-accent` | `#6C7AFF` | Primary CTA, active states |
| `jarvis-text` | `#E4E6F0` | Primary text |
| `jarvis-textMuted` | `#7B7F96` | Secondary text |
| `jarvis-green` | `#4ECDC4` | Success, secure |
| `jarvis-amber` | `#FFB347` | Warning |
| `jarvis-red` | `#FF6B6B` | Danger, error |
| `jarvis-purple` | `#B87FFF` | AI / research features |

Typography: **Inter** (UI), **JetBrains Mono** (code/monospace).
