import { useMemo, useState, type CSSProperties } from 'react'
import type { Habit } from '../types'
import { MONTH_SHORT, fullDate, isToday, parseKey, shiftKey, shortDate, todayKey } from '../lib/date'
import {
  bestStreak,
  checkIns,
  completionRate,
  currentStreak,
  isDone,
  isScheduled,
  scheduleLabel,
  weekProgress,
  weekdayRates,
  weeklyRates,
} from '../lib/stats'
import { Heatmap, type HeatCell } from './Heatmap'
import { Sparkline, WeekdayBars } from './Charts'

type HabitDetailProps = {
  habit: Habit
  refKey: string
  onClose: () => void
  onEdit: () => void
  onToggle: (key: string) => void
  onDelete: () => void
}

export function HabitDetail({
  habit,
  refKey,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: HabitDetailProps) {
  const today = todayKey()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const streak = currentStreak(habit, today)
  const best = Math.max(bestStreak(habit, today), streak)
  const rate30 = completionRate(habit, 30, today)
  const total = checkIns(habit)
  const week = weekProgress(habit, today)
  const weekdays = useMemo(() => weekdayRates(habit, today, 8), [habit, today])
  const weeks = useMemo(() => weeklyRates(habit, today, 12), [habit, today])

  const cellOf = (key: string): HeatCell => {
    if (key > today) return { kind: 'future' }
    if (!isScheduled(habit, key)) return { kind: 'off' }
    return isDone(habit, key) ? { kind: 'done' } : { kind: 'miss' }
  }

  const titleOf = (key: string) => {
    if (key > today) return fullDate(key)
    if (!isScheduled(habit, key)) return `${fullDate(key)} · rest day`
    return `${fullDate(key)} · ${isDone(habit, key) ? 'done' : 'missed'}`
  }

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
        style={{ '--h': habit.color } as CSSProperties}
      >
        <header className="drawer-head">
          <div className="drawer-emoji" aria-hidden="true">
            {habit.emoji}
          </div>
          <div className="drawer-titles">
            <h2 id="drawer-title">{habit.name}</h2>
            <p>
              {scheduleLabel(habit.schedule)} · started {MONTH_SHORT[parseKey(habit.createdAt).getMonth()]}{' '}
              {parseKey(habit.createdAt).getDate()}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </header>

        <div className="drawer-body">
          <section className="detail-hero">
            <div>
              <span className="detail-hero-label">Current streak</span>
              <span className="detail-hero-value">
                {streak}
                <small> {streak === 1 ? 'day' : 'days'}</small>
              </span>
            </div>
            <div className="detail-hero-side">
              <span className={`pill${isDone(habit, refKey) ? ' is-good' : ''}`}>
                {isDone(habit, refKey) ? '✓ logged' : 'not logged'}
                {isToday(refKey) ? '' : ` · ${shortDate(refKey)}`}
              </span>
              <span className="detail-hero-note">
                This week {week.done}/{week.due}
              </span>
            </div>
          </section>

          <section className="detail-stats">
            <div>
              <span>Best streak</span>
              <strong>{best}</strong>
            </div>
            <div>
              <span>30-day rate</span>
              <strong>{Math.round(rate30 * 100)}%</strong>
            </div>
            <div>
              <span>Check-ins</span>
              <strong>{total}</strong>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>History</h3>
              <span className="panel-hint">tap a day to log it</span>
            </div>
            <Heatmap
              endKey={today}
              weeks={26}
              color={habit.color}
              cellOf={cellOf}
              titleOf={titleOf}
              onPick={onToggle}
            />
            <div className="legend">
              <span>Less</span>
              <span className="heat-cell is-miss" />
              <span className="heat-cell is-done" style={{ background: habit.color, opacity: 0.35 }} />
              <span className="heat-cell is-done" style={{ background: habit.color, opacity: 0.7 }} />
              <span className="heat-cell is-done" style={{ background: habit.color }} />
              <span>More</span>
            </div>
          </section>

          <div className="detail-split">
            <section className="panel">
              <div className="panel-head">
                <h3>Weekly rate</h3>
                <span className="panel-hint">12 weeks</span>
              </div>
              <Sparkline
                values={weeks}
                color={habit.color}
                labels={['12 weeks ago', 'now']}
              />
            </section>
            <section className="panel">
              <div className="panel-head">
                <h3>By weekday</h3>
                <span className="panel-hint">8 weeks</span>
              </div>
              <WeekdayBars values={weekdays} color={habit.color} />
            </section>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h3>Log a day</h3>
              <span className="panel-hint">backfill up to 7 days</span>
            </div>
            <div className="backfill">
              {Array.from({ length: 7 }, (_, i) => shiftKey(today, -i)).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`backfill-day${isDone(habit, key) ? ' is-on' : ''}`}
                  onClick={() => onToggle(key)}
                  aria-pressed={isDone(habit, key)}
                >
                  <span>{MONTH_SHORT[parseKey(key).getMonth()]}</span>
                  <strong>{parseKey(key).getDate()}</strong>
                </button>
              ))}
            </div>
          </section>
        </div>

        <footer className="drawer-foot">
          <button
            type="button"
            className={`btn btn-danger-ghost${confirmDelete ? ' is-confirm' : ''}`}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          >
            {confirmDelete ? 'Tap again to delete' : 'Delete habit'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            Edit habit
          </button>
        </footer>
      </aside>
    </div>
  )
}
