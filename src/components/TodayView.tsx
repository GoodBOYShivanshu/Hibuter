import { useMemo } from 'react'
import type { Habit } from '../types'
import {
  WEEKDAY_MIN,
  dayRange,
  isToday,
  longDate,
  parseKey,
  todayKey,
} from '../lib/date'
import { currentStreak, isDone, isScheduled, scheduleLabel, totalsFor } from '../lib/stats'
import { HabitCard } from './HabitCard'
import { Ring } from './Ring'

type TodayViewProps = {
  habits: Habit[]
  refKey: string
  onSelectDate: (key: string) => void
  onToggle: (habitId: string, key: string) => void
  onOpen: (habitId: string) => void
  onNew: () => void
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Still up?'
  if (hour < 12) return 'Good morning.'
  if (hour < 18) return 'Good afternoon.'
  return 'Good evening.'
}

function message(done: number, total: number): string {
  if (total === 0) return 'Nothing scheduled today — a rest day worth enjoying.'
  if (done === total) return 'Every box ticked. That is how streaks are built.'
  if (done === 0) return 'One small check-in is all it takes to start.'
  const left = total - done
  if (left === 1) return 'One habit away from a clean sweep.'
  return `${left} habits left — keep the chain going.`
}

export function TodayView({
  habits,
  refKey,
  onSelectDate,
  onToggle,
  onOpen,
  onNew,
}: TodayViewProps) {
  const today = todayKey()
  const viewingToday = isToday(refKey)

  const due = useMemo(() => habits.filter((h) => isScheduled(h, refKey)), [habits, refKey])
  const rest = useMemo(() => habits.filter((h) => !isScheduled(h, refKey)), [habits, refKey])
  const done = due.filter((h) => isDone(h, refKey)).length
  const ratio = due.length === 0 ? 0 : done / due.length

  const strip = useMemo(() => dayRange(today, 7), [today])
  const longest = habits.reduce((max, h) => Math.max(max, currentStreak(h, today)), 0)

  return (
    <div className="view">
      <div className="day-strip" role="group" aria-label="Pick a day">
        {strip.map((key) => {
          const date = parseKey(key)
          const totals = totalsFor(habits, [key])
          const fill = totals.due === 0 ? 0 : totals.done / totals.due
          return (
            <button
              key={key}
              type="button"
              aria-pressed={key === refKey}
              className={`strip-day${key === refKey ? ' is-active' : ''}${
                key === today ? ' is-today' : ''
              }`}
              onClick={() => onSelectDate(key)}
              title={`${totals.done} of ${totals.due} completed`}
            >
              <span className="strip-dow">{WEEKDAY_MIN[date.getDay()]}</span>
              <span className="strip-num">{date.getDate()}</span>
              <span className="strip-bar">
                <span style={{ height: `${Math.round(fill * 100)}%` }} />
              </span>
            </button>
          )
        })}
      </div>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            {viewingToday ? longDate(refKey) : `${longDate(refKey)} · looking back`}
          </p>
          <h1>{viewingToday ? greeting() : 'Rewriting the past.'}</h1>
          <p className="hero-sub">{message(done, due.length)}</p>

          <div className="hero-meta">
            <span className="chip">
              <strong>{habits.length}</strong> active habits
            </span>
            <span className="chip">
              🔥 best live streak <strong>{longest}</strong>
            </span>
          </div>

          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onNew}>
              + New habit
            </button>
            {!viewingToday && (
              <button type="button" className="btn btn-ghost" onClick={() => onSelectDate(today)}>
                Back to today
              </button>
            )}
          </div>
        </div>

        <div className="hero-ring">
          <Ring value={ratio} size={168} stroke={12} label={`${done} of ${due.length} habits done`}>
            <span className="ring-big">
              {done}
              <span className="ring-of">/{due.length}</span>
            </span>
            <span className="ring-cap">{ratio === 1 && due.length > 0 ? 'perfect day' : 'done'}</span>
          </Ring>
        </div>
      </section>

      <section className="list-section">
        <header className="section-head">
          <h2>Scheduled {viewingToday ? 'today' : `on ${longDate(refKey).split(',')[0]}`}</h2>
          <span className="section-count">
            {done}/{due.length}
          </span>
        </header>

        {habits.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji" aria-hidden="true">
              🌱
            </div>
            <h3>Start with one tiny habit</h3>
            <p>
              Something you can do in two minutes. Once the chain starts, it gets easier to keep
              it alive.
            </p>
            <button type="button" className="btn btn-primary" onClick={onNew}>
              Add your first habit
            </button>
          </div>
        ) : due.length === 0 ? (
          <div className="empty empty-slim">
            <h3>A clean rest day</h3>
            <p>No habits are scheduled for this day. Enjoy it — or add one below.</p>
          </div>
        ) : (
          <div className="habit-list">
            {due.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                refKey={refKey}
                onToggle={(key) => onToggle(habit.id, key)}
                onOpen={() => onOpen(habit.id)}
              />
            ))}
          </div>
        )}
      </section>

      {rest.length > 0 && (
        <section className="list-section">
          <header className="section-head">
            <h2>Resting</h2>
            <span className="section-count">{rest.length}</span>
          </header>
          <div className="habit-list">
            {rest.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                refKey={refKey}
                onToggle={(key) => onToggle(habit.id, key)}
                onOpen={() => onOpen(habit.id)}
              />
            ))}
          </div>
          <p className="section-foot">
            Rest days still count as keeping the habit — {scheduleLabel(rest[0].schedule)}.
          </p>
        </section>
      )}
    </div>
  )
}
