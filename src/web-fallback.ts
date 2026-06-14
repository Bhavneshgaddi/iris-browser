// Web and Mobile fallback simulation layer for IRIS (when running outside of Electron)
if (typeof window !== 'undefined' && !window.jarvis) {
  console.log('[IRIS Web Fallback] Initializing local storage mocks for web/mobile compatibility...');

  // Helper to load/save state
  const loadState = <T>(key: string, def: T): T => {
    try {
      const v = localStorage.getItem(`iris:${key}`);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  };

  const saveState = (key: string, val: any) => {
    try {
      localStorage.setItem(`iris:${key}`, JSON.stringify(val));
    } catch {}
  };

  // Mock settings
  let settings = loadState('settings', {
    theme: 'system',
    search_engine: 'google',
    homepage: 'iris://newtab',
    show_bookmarks_bar: true,
    restore_tabs_on_startup: true,
  });

  // Mock history
  let history = loadState<any[]>('history', [
    { id: 1, url: 'https://github.com', title: 'GitHub: Let\'s build from here', visit_count: 3, last_visit: new Date().toISOString() },
    { id: 2, url: 'https://google.com', title: 'Google', visit_count: 5, last_visit: new Date().toISOString() },
  ]);

  // Mock bookmarks
  let bookmarks = loadState<any[]>('bookmarks', [
    { id: 1, url: 'https://news.ycombinator.com', title: 'Hacker News', folder_id: 1 },
    { id: 2, url: 'https://react.dev', title: 'React Documentation', folder_id: 1 },
  ]);

  let bookmarkFolders = loadState<any[]>('folders', [
    { id: 1, name: 'Bookmarks Bar' },
    { id: 2, name: 'Other Bookmarks' },
  ]);

  // Mock notes
  let notes = loadState<any[]>('notes', [
    { id: 1, title: 'Study Plan', content: 'Prepare for exams by using IRIS Research collections.', tags: ['study', 'iris'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ]);

  // Mock downloads
  let downloads = loadState<any[]>('downloads', []);

  // Set up mock window.jarvis
  (window as any).jarvis = {
    window: {
      minimize: () => console.log('minimize (mock)'),
      maximize: () => console.log('maximize (mock)'),
      close: () => console.log('close (mock)'),
      isMaximized: async () => false,
    },
    theme: {
      get: async () => settings.theme,
      set: async (t: string) => {
        settings.theme = t;
        saveState('settings', settings);
      },
      onChange: (cb: any) => () => {},
    },
    history: {
      add: async (e: any) => {
        const entry = { id: Date.now(), visit_count: 1, last_visit: new Date().toISOString(), ...e };
        history = [entry, ...history];
        saveState('history', history);
      },
      getAll: async () => history,
      search: async (q: string) => history.filter(h => h.title.toLowerCase().includes(q.toLowerCase()) || h.url.includes(q)),
      delete: async (id: number) => {
        history = history.filter(h => h.id !== id);
        saveState('history', history);
      },
      clear: async () => {
        history = [];
        saveState('history', history);
      },
    },
    bookmarks: {
      add: async (b: any) => {
        const id = Date.now();
        bookmarks.push({ id, ...b });
        saveState('bookmarks', bookmarks);
        return id;
      },
      getAll: async () => bookmarks,
      getFolders: async () => bookmarkFolders,
      createFolder: async (name: string) => {
        const id = Date.now();
        bookmarkFolders.push({ id, name });
        saveState('folders', bookmarkFolders);
        return id;
      },
      delete: async (id: number) => {
        bookmarks = bookmarks.filter(b => b.id !== id);
        saveState('bookmarks', bookmarks);
      },
      deleteFolder: async (id: number) => {
        bookmarkFolders = bookmarkFolders.filter(f => f.id !== id);
        saveState('folders', bookmarkFolders);
      },
      update: async (id: number, data: any) => {
        bookmarks = bookmarks.map(b => b.id === id ? { ...b, ...data } : b);
        saveState('bookmarks', bookmarks);
      },
      isBookmarked: async (url: string) => {
        const found = bookmarks.find(b => b.url === url);
        return found ? found.id : null;
      },
    },
    downloads: {
      getAll: async () => downloads,
      delete: async (id: number) => {
        downloads = downloads.filter(d => d.id !== id);
        saveState('downloads', downloads);
      },
      clear: async () => {
        downloads = [];
        saveState('downloads', downloads);
      },
      openFolder: async () => {},
      onProgress: () => () => {},
      onComplete: () => () => {},
    },
    settings: {
      get: async (key: string) => (settings as any)[key],
      set: async (key: string, val: any) => {
        (settings as any)[key] = val;
        saveState('settings', settings);
      },
      getAll: async () => settings,
      reset: async () => {
        settings = { theme: 'system', search_engine: 'google', homepage: 'iris://newtab', show_bookmarks_bar: true, restore_tabs_on_startup: true };
        saveState('settings', settings);
      },
    },
    app: {
      version: async () => '1.0.0 (Web/Mobile)',
      path: async () => 'LocalStorage://',
    },
    session: {
      save: async (tabs: any) => saveState('session_tabs', tabs),
      load: async () => loadState('session_tabs', []),
      clear: async () => saveState('session_tabs', []),
    },
    dialog: {
      save: async () => ({ canceled: true }),
      open: async () => ({ canceled: true, filePaths: [] }),
    },
    performance: {
      metrics: async () => ({
        mainHeapMB: 42,
        totalProcessMB: 120,
        processCount: 3,
        processes: [{ pid: 1, type: 'browser', memoryMB: 80 }, { pid: 2, type: 'tab', memoryMB: 40 }],
      }),
      cpu: async () => Math.floor(Math.random() * 8) + 2,
      battery: async () => {
        if ('getBattery' in navigator) {
          try {
            const b = await (navigator as any).getBattery();
            return { onBattery: !b.charging, percent: Math.round(b.level * 100) };
          } catch {}
        }
        return { onBattery: false, percent: 100 };
      },
      clearCache: async () => {},
      clearStorage: async () => localStorage.clear(),
    },
    privacy: {
      setBlocking: async (e: boolean) => e,
      getStats: async () => ({ blockedCount: loadState('blocked_count', 0), blockingEnabled: true }),
      resetStats: async () => saveState('blocked_count', 0),
      getCookies: async () => [],
      removeCookie: async () => {},
      clearCookies: async () => {},
      clearAll: async () => localStorage.clear(),
    },
    notes: {
      getAll: async () => notes,
      get: async (id: number) => notes.find(n => n.id === id),
      create: async (data: any) => {
        const item = { id: Date.now(), title: 'New Note', content: '', tags: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data };
        notes = [item, ...notes];
        saveState('notes', notes);
        return item;
      },
      update: async (id: number, patch: any) => {
        notes = notes.map(n => n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n);
        saveState('notes', notes);
        const item = notes.find(n => n.id === id);
        return item;
      },
      delete: async (id: number) => {
        notes = notes.filter(n => n.id !== id);
        saveState('notes', notes);
      },
      search: async (q: string) => notes.filter(n => n.title.toLowerCase().includes(q.toLowerCase()) || n.content.toLowerCase().includes(q.toLowerCase())),
    },
    ai: {
      chat: async (message: string, context?: string) => {
        await new Promise(r => setTimeout(r, 650));
        const msg = message.toLowerCase();
        if (msg.includes('summarize')) {
          return `### IRIS Web Summary\n\nThis page introduces the web-compatible version of IRIS. Standard features include study note compilation, tabs session recovery, and local device analytics.`;
        }
        if (msg.includes('quiz')) {
          return `### Web Study Quiz\n\n**Q1: What does IRIS stand for?**\n- [ ] Interactive Research Intelligence System\n*Answer: Interactive Research Intelligence System.*`;
        }
        return `I am IRIS, your AI Companion. I run directly in your mobile or desktop browser using localStorage. How can I help you study?`;
      },
      summarize: async () => '### IRIS Web Summary\n\nResponsive web interface loaded.',
      explain: async (txt: string) => `Explanation of "${txt}": Refers to standard browser storage utilities.`,
      translate: async (txt: string, l: string) => `[Translated to ${l}]: Translated content.`,
      speak: async () => true,
    },
    on: () => () => {},
  };
}
