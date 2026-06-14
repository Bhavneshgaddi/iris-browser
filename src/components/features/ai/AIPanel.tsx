import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Mic, MicOff, FileText, Lightbulb, Languages, BookOpen, X, Loader } from 'lucide-react'
import { useTabsStore } from '@/store/tabs.store'
import clsx from 'clsx'

interface Message { role: 'user' | 'ai'; content: string; ts: number }

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Summarize Page', prompt: 'summarize this page' },
  { icon: Lightbulb, label: 'Explain Selection', prompt: 'explain selected text' },
  { icon: BookOpen, label: 'Make Flashcards', prompt: 'generate flashcards from this page' },
  { icon: Languages, label: 'Translate', prompt: 'translate this page to Spanish' },
]

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm **Jarvis AI**. I can summarize pages, generate flashcards, explain selected text, translate content, and more. What can I help you with?", ts: Date.now() }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeTab = useTabsStore(s => s.getActiveTab())

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text = input) => {
    if (!text.trim() || isLoading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    try {
      const ctx = activeTab?.url && activeTab.url !== 'jarvis://newtab' ? `Current page: ${activeTab.url}` : undefined
      const reply = await window.jarvis?.ai?.chat(text, ctx) ?? 'AI is not available in this environment.'
      setMessages(prev => [...prev, { role: 'ai', content: reply, ts: Date.now() }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong. Please try again.', ts: Date.now() }])
    } finally {
      setIsLoading(false)
    }
  }

  const speakLast = () => {
    const lastAi = [...messages].reverse().find(m => m.role === 'ai')
    if (!lastAi) return
    if (isSpeaking) { speechSynthesis.cancel(); setIsSpeaking(false); return }
    const utt = new SpeechSynthesisUtterance(lastAi.content.replace(/[#*`]/g, ''))
    utt.onend = () => setIsSpeaking(false)
    setIsSpeaking(true)
    speechSynthesis.speak(utt)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions */}
      <div className="p-3 border-b border-jarvis-border flex-shrink-0">
        <p className="text-2xs font-semibold text-jarvis-textDim uppercase tracking-wider mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => send(a.prompt)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-jarvis-surfaceEl border border-jarvis-border text-2xs text-jarvis-textMuted hover:text-jarvis-accent hover:border-jarvis-accent/40 transition-all"
            >
              <a.icon size={11} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={clsx('flex gap-2', m.role === 'user' && 'flex-row-reverse')}>
            <div className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              m.role === 'ai' ? 'bg-jarvis-accent/20 text-jarvis-accent' : 'bg-jarvis-surfaceEl text-jarvis-textMuted'
            )}>
              {m.role === 'ai' ? <Bot size={12} /> : <span className="text-2xs font-bold">U</span>}
            </div>
            <div className={clsx(
              'max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed',
              m.role === 'ai'
                ? 'bg-jarvis-surfaceEl text-jarvis-text'
                : 'bg-jarvis-accent/15 text-jarvis-text border border-jarvis-accent/20'
            )}>
              {m.content.split('\n').map((line, j) => (
                <p key={j} className={line.startsWith('###') ? 'font-semibold text-jarvis-accent mb-1' : line.startsWith('**') ? 'font-medium' : ''}>{
                  line.replace(/###\s?/, '').replace(/\*\*/g, '')
                }</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-jarvis-accent/20 text-jarvis-accent flex items-center justify-center">
              <Bot size={12} />
            </div>
            <div className="bg-jarvis-surfaceEl px-3 py-2 rounded-xl flex items-center gap-2">
              <Loader size={11} className="animate-spin text-jarvis-accent" />
              <span className="text-xs text-jarvis-textMuted">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-jarvis-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={speakLast}
            className={clsx('p-2 rounded-lg transition-colors', isSpeaking ? 'text-jarvis-accent bg-jarvis-accent/10' : 'text-jarvis-textDim hover:text-jarvis-text')}
            title="Read aloud last response"
          >
            {isSpeaking ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask Jarvis AI..."
            className="flex-1 bg-jarvis-surfaceEl border border-jarvis-border rounded-lg px-3 py-2 text-xs text-jarvis-text outline-none placeholder:text-jarvis-textDim focus:border-jarvis-accent/60 transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-jarvis-accent text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-jarvis-accentHi transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
