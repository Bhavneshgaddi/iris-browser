import { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, Target, CheckCircle, Plus, Trash2, BookOpen } from 'lucide-react'
import clsx from 'clsx'

// ── Pomodoro ──────────────────────────────────────────────────────────────────
type PomodoroPhase = 'work' | 'short-break' | 'long-break'
const PHASES: Record<PomodoroPhase, { label: string; seconds: number; color: string }> = {
  work:         { label: 'Focus',       seconds: 25 * 60, color: '#6C7AFF' },
  'short-break':{ label: 'Short Break', seconds:  5 * 60, color: '#4ECDC4' },
  'long-break': { label: 'Long Break',  seconds: 15 * 60, color: '#B87FFF' },
}

// ── Goal tracker ──────────────────────────────────────────────────────────────
interface Goal { id: string; text: string; done: boolean }

export default function ExamPanel() {
  // Pomodoro state
  const [phase, setPhase] = useState<PomodoroPhase>('work')
  const [remaining, setRemaining] = useState(PHASES.work.seconds)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Goals
  const [goals, setGoals] = useState<Goal[]>(() => {
    try { return JSON.parse(localStorage.getItem('jarvis:exam-goals') ?? '[]') } catch { return [] }
  })
  const [goalInput, setGoalInput] = useState('')

  // Blocked sites
  const [blockedInput, setBlockedInput] = useState('')
  const [blocked, setBlocked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('jarvis:blocked-sites') ?? '[]') } catch { return [] }
  })

  // Timer tick
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false)
            if (phase === 'work') {
              setSessions(s => s + 1)
              setPhase(sessions > 0 && (sessions + 1) % 4 === 0 ? 'long-break' : 'short-break')
            } else {
              setPhase('work')
            }
            return PHASES[phase].seconds
          }
          return r - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, phase])

  useEffect(() => { setRemaining(PHASES[phase].seconds) }, [phase])

  const resetTimer = () => { setRunning(false); setRemaining(PHASES[phase].seconds) }
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const progress = 1 - remaining / PHASES[phase].seconds

  // Goals helpers
  const addGoal = () => {
    if (!goalInput.trim()) return
    const next = [...goals, { id: crypto.randomUUID(), text: goalInput.trim(), done: false }]
    setGoals(next); localStorage.setItem('jarvis:exam-goals', JSON.stringify(next)); setGoalInput('')
  }
  const toggleGoal = (id: string) => {
    const next = goals.map(g => g.id === id ? { ...g, done: !g.done } : g)
    setGoals(next); localStorage.setItem('jarvis:exam-goals', JSON.stringify(next))
  }
  const deleteGoal = (id: string) => {
    const next = goals.filter(g => g.id !== id)
    setGoals(next); localStorage.setItem('jarvis:exam-goals', JSON.stringify(next))
  }

  // Blocked sites helpers
  const addBlocked = () => {
    if (!blockedInput.trim()) return
    const next = [...blocked, blockedInput.trim().replace(/^https?:\/\//, '')]
    setBlocked(next); localStorage.setItem('jarvis:blocked-sites', JSON.stringify(next)); setBlockedInput('')
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Pomodoro Timer */}
      <div className="bg-jarvis-surfaceEl rounded-xl p-4 flex flex-col items-center gap-3">
        {/* Phase tabs */}
        <div className="flex gap-1 w-full">
          {(Object.keys(PHASES) as PomodoroPhase[]).map(p => (
            <button
              key={p}
              onClick={() => { setPhase(p); setRunning(false) }}
              className={clsx(
                'flex-1 py-1 rounded-md text-2xs font-medium transition-all',
                phase === p ? 'text-white' : 'text-jarvis-textMuted hover:text-jarvis-text bg-transparent'
              )}
              style={phase === p ? { background: PHASES[p].color } : {}}
            >
              {PHASES[p].label}
            </button>
          ))}
        </div>

        {/* Circular progress */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#2A2D3E" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={PHASES[phase].color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-jarvis-text">{mins}:{secs}</span>
            <span className="text-2xs text-jarvis-textDim">{PHASES[phase].label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={resetTimer} className="p-2 rounded-lg text-jarvis-textDim hover:text-jarvis-text transition-colors">
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => setRunning(v => !v)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-medium transition-all"
            style={{ background: PHASES[phase].color }}
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <div className="flex flex-col items-center text-xs">
            <span className="font-bold text-jarvis-text">{sessions}</span>
            <span className="text-jarvis-textDim text-2xs">sessions</span>
          </div>
        </div>
      </div>

      {/* Goals / Todo */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target size={13} className="text-jarvis-accent" />
          <span className="text-xs font-semibold text-jarvis-text">Study Goals</span>
          <span className="ml-auto text-2xs text-jarvis-textDim">{goals.filter(g => g.done).length}/{goals.length}</span>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            placeholder="Add a study goal..."
            className="flex-1 bg-jarvis-surfaceEl border border-jarvis-border rounded-lg px-2.5 py-1.5 text-xs text-jarvis-text outline-none"
          />
          <button onClick={addGoal} className="p-1.5 rounded-lg bg-jarvis-accent text-white"><Plus size={13} /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          {goals.map(g => (
            <div key={g.id} className="flex items-center gap-2 group">
              <button onClick={() => toggleGoal(g.id)} className={clsx('flex-shrink-0 transition-colors', g.done ? 'text-jarvis-green' : 'text-jarvis-textDim hover:text-jarvis-green')}>
                <CheckCircle size={14} />
              </button>
              <span className={clsx('flex-1 text-xs', g.done && 'line-through text-jarvis-textDim')}>{g.text}</span>
              <button onClick={() => deleteGoal(g.id)} className="opacity-0 group-hover:opacity-100 text-jarvis-textDim hover:text-jarvis-red transition-all">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Sites */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={13} className="text-jarvis-amber" />
          <span className="text-xs font-semibold text-jarvis-text">Focus Blocklist</span>
        </div>
        <div className="flex gap-2 mb-2">
          <input
            value={blockedInput}
            onChange={e => setBlockedInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBlocked()}
            placeholder="youtube.com, instagram.com..."
            className="flex-1 bg-jarvis-surfaceEl border border-jarvis-border rounded-lg px-2.5 py-1.5 text-xs text-jarvis-text outline-none"
          />
          <button onClick={addBlocked} className="p-1.5 rounded-lg bg-jarvis-amber text-jarvis-bg"><Plus size={13} /></button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {blocked.map(site => (
            <div key={site} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-jarvis-amber/10 border border-jarvis-amber/30 text-jarvis-amber text-2xs">
              {site}
              <button onClick={() => { const n = blocked.filter(s => s !== site); setBlocked(n); localStorage.setItem('jarvis:blocked-sites', JSON.stringify(n)) }} className="hover:text-white transition-colors font-bold">×</button>
            </div>
          ))}
          {blocked.length === 0 && <p className="text-2xs text-jarvis-textDim italic">No sites blocked. Add distracting sites to stay focused.</p>}
        </div>
      </div>
    </div>
  )
}
