import type { CSSProperties } from 'react'
import type { Habit } from '../types'
import { dayRange, isToday, shortDate } from '../lib/date'
import { currentStreak, isDone, isScheduled, scheduleLabel } from '../lib/stats'

type HabitCardProps = {
  habit: Habit
  refKey: string
  onToggle: (key: string) => void
  onOpen: () => void
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HabitCard({ habit, refKey, onToggle, onOpen }: HabitCardProps) {
  const done = isDone(habit, refKey)
  const scheduled = isScheduled(habit, refKey)
  const streak = currentStreak(habit, refKey)
  const days = dayRange(refKey, 7)
  const when = isToday(refKey) ? 'today' : shortDate(refKey)

  return (
    <article
      className={`habit-card${done ? ' is-done' : ''}${scheduled ? '' : ' is-rest'}`}
      style={{ '--h': habit.color } as CSSProperties}
    >
      <button
        type="button"
        className="habit-check"
        aria-pressed={done}
        aria-label={done ? `Undo ${habit.name} for ${when}` : `Complete ${habit.name} for ${when}`}
        disabled={!scheduled}
        onClick={() => onToggle(refKey)}
      >
        {done && <CheckIcon />}
      </button>

      <button type="button" className="habit-main" onClick={onOpen}>
        <span className="habit-emoji" aria-hidden="true">
          {habit.emoji}
        </span>
        <span className="habit-text">
          <span className="habit-name">{habit.name}</span>
          <span className="habit-meta">
            {scheduleLabel(habit.schedule)}
            {!scheduled && <em className="habit-rest"> · rest day</em>}
          </span>
        </span>
      </button>

      <div className="habit-week" aria-hidden="true" title="Last 7 days">
        {days.map((key) => {
          const dayDone = isDone(habit, key)
          const dayScheduled = isScheduled(habit, key)
          const cls = dayDone ? 'is-on' : dayScheduled ? 'is-miss' : 'is-off'
          return (
            <span key={key} className={`week-dot ${cls}`}>
              <span className="week-dot-inner" />
            </span>
          )
        })}
      </div>

      <div className={`habit-streak${streak > 0 ? ' is-live' : ''}`} title={`${streak} day streak`}>
        <span aria-hidden="true">🔥</span>
        <span>{streak}</span>
      </div>

      <button
        type="button"
        className="habit-open"
        onClick={onOpen}
        aria-label={`Open details for ${habit.name}`}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M9 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </article>
  )
}
