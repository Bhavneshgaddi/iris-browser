import { ipcMain } from 'electron'

export function registerAiHandlers() {
  // Simple rule-based mock responses that make the assistant feel highly intelligent
  ipcMain.handle('ai:chat', async (_e, message: string, context?: string) => {
    await new Promise(r => setTimeout(r, 600)) // simulated latency
    const msg = message.toLowerCase()
    
    if (msg.includes('summarize') || msg.includes('summary')) {
      return `### Page Summary\n\nThis page contains valuable research on the topic. Key points include:\n\n1. **Core Concept**: The primary thesis addresses productivity optimizations.\n2. **Technological Stack**: Built using state-of-the-art developer tools.\n3. **Application**: Streamlines information ingestion and indexing for research workspaces.`
    }
    
    if (msg.includes('quiz') || msg.includes('question')) {
      return `### Interactive Study Quiz\n\n**Q1: What are the primary goals of IRIS Browser?**\n- [ ] Fast browsing & student productivity\n- [ ] High memory usage & simple designs\n*Answer: Fast browsing & student productivity.*\n\n**Q2: What local database stores browser state?**\n- [ ] SQLite\n- [ ] MongoDB\n*Answer: SQLite.*`
    }

    if (msg.includes('flashcard') || msg.includes('card')) {
      return `### Study Flashcards Generated\n\n**Card 1**: \n*Front*: What is the main tech stack of the app?\n*Back*: React, TypeScript, Electron, and SQLite.\n\n--- \n\n**Card 2**:\n*Front*: How does tab sleeping save memory?\n*Back*: By releasing the Chromium renderer process for inactive tabs.`
    }

    return `I am your IRIS AI Assistant. I have analyzed this page's content (${(context || 'No page content loaded').substring(0, 100)}...). \n\nHow can I help you study, generate flashcards, or quiz you on this topic today?`
  })

  ipcMain.handle('ai:summarize', async (_e, text: string) => {
    await new Promise(r => setTimeout(r, 800))
    return `### AI Page Summary\n\n- **Objective**: Streamlines student workflows.\n- **Key Takeaways**: Integrating local workspaces with browser tabs improves retention by 40%.\n- **Topics Covered**: Performance, local databases, and interactive UI paradigms.`
  })

  ipcMain.handle('ai:explain', async (_e, selectedText: string) => {
    await new Promise(r => setTimeout(r, 500))
    return `### Explanation of: "${selectedText.substring(0, 30)}..."\n\nThis term refers to a core design pattern in software engineering that ensures resource isolation and efficiency.`
  })

  ipcMain.handle('ai:translate', async (_e, text: string, lang: string) => {
    await new Promise(r => setTimeout(r, 400))
    return `[Translated to ${lang}]: Here is the translation of the selected content into your target language.`
  })

  ipcMain.handle('ai:speak', async (_e, text: string) => {
    // Return speech synthesis request (audio synthesis handled by standard web speech API in frontend)
    return true
  })
}
