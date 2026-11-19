import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppState, Habit } from './types'
import { loadState, saveState, sanitizeState, exportPayload, uid, PALETTE } from './lib/storage'
import { shortDate, todayKey } from './lib/date'
import { TodayView } from './components/TodayView'
import { InsightsView } from './components/InsightsView'
import { HabitDetail } from './components/HabitDetail'
import { HabitDialog, type HabitDraft } from './components/HabitDialog'

type View = 'today' | 'insights'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [view, setView] = useState<View>('today')
  const [refKey, setRefKey] = useState<string>(() => todayKey())
  const [openId, setOpenId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; habit: Habit } | null>(
    null,
  )
  const [toast, setToast] = useState<string | null>(null)
  const [confirmErase, setConfirmErase] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /* ---------------- persistence & theme ---------------- */

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const notify = useCallback((message: string) => setToast(message), [])

  /* ---------------- derived data ---------------- */

  const activeHabits = useMemo(
    () => state.habits.filter((habit) => !habit.archived),
    [state.habits],
  )
  const openHabit = openId ? (state.habits.find((h) => h.id === openId) ?? null) : null
  const today = todayKey()

  /* ---------------- actions ---------------- */

  const toggleEntry = useCallback((habitId: string, key: string) => {
    if (key > todayKey()) return
    setState((current) => ({
      ...current,
      habits: current.habits.map((habit) => {
        if (habit.id !== habitId) return habit
        const entries = { ...habit.entries }
        if ((entries[key] ?? 0) > 0) delete entries[key]
        else entries[key] = 1
        return { ...habit, entries }
      }),
    }))
  }, [])

  const saveHabit = useCallback(
    (draft: HabitDraft, existing?: Habit | null) => {
      setState((current) => {
        if (existing) {
          return {
            ...current,
            habits: current.habits.map((habit) =>
              habit.id === existing.id ? { ...habit, ...draft } : habit,
            ),
          }
        }
        const habit: Habit = {
          id: uid(),
          name: draft.name,
          emoji: draft.emoji,
          color: draft.color || PALETTE[0],
          schedule: draft.schedule,
          createdAt: todayKey(),
          entries: {},
          archived: false,
        }
        return { ...current, habits: [habit, ...current.habits] }
      })
      notify(existing ? 'Habit updated' : 'Habit added — day one starts now')
      setDialog(null)
    },
    [notify],
  )

  const deleteHabit = useCallback(
    (habitId: string) => {
      setState((current) => ({
        ...current,
        habits: current.habits.filter((habit) => habit.id !== habitId),
      }))
      setOpenId(null)
      setDialog(null)
      notify('Habit deleted')
    },
    [notify],
  )

  const startFresh = useCallback(() => {
    setState((current) => ({ ...current, habits: [], demo: false }))
    notify('Demo habits cleared — your board is empty')
  }, [notify])

  const dismissDemo = useCallback(() => {
    setState((current) => ({ ...current, demo: false }))
  }, [])

  const eraseAll = useCallback(() => {
    if (!confirmErase) {
      setConfirmErase(true)
      return
    }
    setState((current) => ({ ...current, habits: [], demo: false }))
    setConfirmErase(false)
    setOpenId(null)
    notify('All habits erased from this browser')
  }, [confirmErase, notify])

  const exportJson = useCallback(() => {
    const payload = exportPayload(state)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hibxy-${todayKey()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    notify(`Exported ${payload.habits.length} habits`)
  }, [state, notify])

  const importJson = useCallback(
    async (file: File) => {
      try {
        const parsed: unknown = JSON.parse(await file.text())
        const record = parsed as { habits?: unknown }
        const rawHabits = Array.isArray(parsed) ? parsed : record.habits
        const clean = sanitizeState({
          version: 1,
          theme: state.theme,
          habits: rawHabits,
          demo: false,
        })
        if (!clean || clean.habits.length === 0) throw new Error('empty')
        const habits = clean.habits.map((habit) => ({ ...habit, id: uid() }))
        setState((current) => ({ ...current, habits, demo: false }))
        setRefKey(todayKey())
        notify(`Imported ${habits.length} habits`)
      } catch {
        notify('That file was not a valid Hibxy export')
      }
    },
    [state.theme, notify],
  )

  /* ---------------- keyboard shortcuts ---------------- */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (event.key === 'Escape') {
        if (dialog) setDialog(null)
        else if (openId) setOpenId(null)
        return
      }
      if (typing) return
      if ((event.key === 'n' || event.key === 'N') && !dialog && !openId) {
        event.preventDefault()
        setDialog({ mode: 'create' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, openId])

  /* ---------------- render ---------------- */

  return (
    <div className="app">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-a" />
        <span className="aurora-b" />
        <span className="aurora-c" />
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M4 14c0-5 4-9 9-9 4 0 7 2 7 6 0 5-5 8-10 8H4v-5z"
                fill="currentColor"
                opacity="0.9"
              />
              <circle cx="9" cy="9" r="2.4" fill="var(--brand-dot)" />
            </svg>
          </span>
          <span className="brand-name">Hibxy</span>
        </div>

        <nav className="tabs" aria-label="Views">
          <button
            type="button"
            className={view === 'today' ? 'is-active' : ''}
            aria-current={view === 'today' ? 'page' : undefined}
            onClick={() => setView('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={view === 'insights' ? 'is-active' : ''}
            aria-current={view === 'insights' ? 'page' : undefined}
            onClick={() => setView('insights')}
          >
            Insights
          </button>
        </nav>

        <div className="topbar-actions">
          <span className="today-pill" title="Today">
            {shortDate(today)}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() =>
              setState((current) => ({
                ...current,
                theme: current.theme === 'dark' ? 'light' : 'dark',
              }))
            }
            aria-label={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
            title="Toggle theme"
          >
            {state.theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setDialog({ mode: 'create' })}
          >
            + New
          </button>
        </div>
      </header>

      <main className="main">
        {state.demo && (
          <div className="demo-banner" role="status">
            <span className="demo-dot" aria-hidden="true" />
            <p>
              <strong>Demo data.</strong> Six sample habits with 20 weeks of history so you can see
              how Hibxy works.
            </p>
            <div className="demo-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={startFresh}>
                Clear demo habits
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={dismissDemo}>
                Keep exploring
              </button>
            </div>
          </div>
        )}

        {view === 'today' ? (
          <TodayView
            habits={activeHabits}
            refKey={refKey}
            onSelectDate={setRefKey}
            onToggle={toggleEntry}
            onOpen={setOpenId}
            onNew={() => setDialog({ mode: 'create' })}
          />
        ) : (
          <InsightsView
            habits={activeHabits}
            onOpen={setOpenId}
            onNew={() => setDialog({ mode: 'create' })}
          />
        )}
      </main>

      <footer className="foot">
        <p>
          Hibxy keeps every check-in in this browser. No account, no server, no tracking.
          <span className="foot-hint"> Press <kbd>N</kbd> for a new habit.</span>
        </p>
        <div className="foot-actions">
          <button type="button" className="link-btn" onClick={exportJson}>
            Export
          </button>
          <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button
            type="button"
            className={`link-btn${confirmErase ? ' is-danger' : ''}`}
            onClick={eraseAll}
            onBlur={() => setConfirmErase(false)}
          >
            {confirmErase ? 'Confirm erase' : 'Erase all'}
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importJson(file)
              event.target.value = ''
            }}
          />
        </div>
      </footer>

      {openHabit && (
        <HabitDetail
          habit={openHabit}
          refKey={refKey}
          onClose={() => setOpenId(null)}
          onEdit={() => setDialog({ mode: 'edit', habit: openHabit })}
          onToggle={(key) => toggleEntry(openHabit.id, key)}
          onDelete={() => deleteHabit(openHabit.id)}
        />
      )}

      {dialog && (
        <HabitDialog
          habit={dialog.mode === 'edit' ? dialog.habit : null}
          onCancel={() => setDialog(null)}
          onSubmit={(draft) => saveHabit(draft, dialog.mode === 'edit' ? dialog.habit : null)}
          onDelete={
            dialog.mode === 'edit' ? () => deleteHabit(dialog.habit.id) : undefined
          }
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      <span className="sr-only" aria-live="polite">
        {toast ?? ''}
      </span>
    </div>
  )
}
