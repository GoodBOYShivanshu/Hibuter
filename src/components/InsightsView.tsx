import { useMemo } from 'react'
import type { Habit } from '../types'
import { dayRange, fullDate, todayKey } from '../lib/date'
import {
  aggregateWeekdayRates,
  bestStreak,
  checkIns,
  completionRate,
  currentStreak,
  isDone,
  isScheduled,
  weeklyTrend,
} from '../lib/stats'
import { Heatmap, type HeatCell } from './Heatmap'
import { Sparkline, StatTile, WeekdayBars } from './Charts'

type InsightsViewProps = {
  habits: Habit[]
  onOpen: (habitId: string) => void
  onNew: () => void
}

export function InsightsView({ habits, onOpen, onNew }: InsightsViewProps) {
  const today = todayKey()

  const last7Keys = useMemo(() => dayRange(today, 7), [today])
  const last30Keys = useMemo(() => dayRange(today, 30), [today])
  const last7 = useMemo(
    () => habits.reduce((sum, h) => sum + last7Keys.filter((k) => isDone(h, k)).length, 0),
    [habits, last7Keys],
  )
  const rate30 = useMemo(() => {
    let due = 0
    let done = 0
    for (const key of last30Keys) {
      for (const habit of habits) {
        if (key < habit.createdAt || !isScheduled(habit, key)) continue
        due++
        if (isDone(habit, key)) done++
      }
    }
    return due === 0 ? 0 : done / due
  }, [habits, last30Keys])

  const bestLive = habits.reduce((max, h) => Math.max(max, currentStreak(h, today)), 0)
  const trend = useMemo(() => weeklyTrend(habits, today, 12), [habits, today])
  const weekdays = useMemo(() => aggregateWeekdayRates(habits, today, 8), [habits, today])
  const trendAvg = trend.length ? trend.reduce((a, b) => a + b, 0) / trend.length : 0

  const ranked = useMemo(
    () =>
      [...habits]
        .map((habit) => ({
          habit,
          streak: currentStreak(habit, today),
          best: Math.max(bestStreak(habit, today), currentStreak(habit, today)),
          rate: completionRate(habit, 30, today),
          total: checkIns(habit),
        }))
        .sort((a, b) => b.streak - a.streak || b.rate - a.rate),
    [habits, today],
  )

  const cellOf = (key: string): HeatCell => {
    if (key > today) return { kind: 'future' }
    let due = 0
    let done = 0
    for (const habit of habits) {
      if (key < habit.createdAt || !isScheduled(habit, key)) continue
      due++
      if (isDone(habit, key)) done++
    }
    if (due === 0) return { kind: 'off' }
    if (done === 0) return { kind: 'miss' }
    return { kind: 'done', alpha: 0.3 + 0.7 * (done / due) }
  }

  const titleOf = (key: string) => {
    if (key > today) return fullDate(key)
    let due = 0
    let done = 0
    for (const habit of habits) {
      if (key < habit.createdAt || !isScheduled(habit, key)) continue
      due++
      if (isDone(habit, key)) done++
    }
    return due === 0 ? `${fullDate(key)} · nothing scheduled` : `${fullDate(key)} · ${done}/${due} done`
  }

  return (
    <div className="view">
      <div className="insight-head">
        <div>
          <p className="eyebrow">The long view</p>
          <h1>Insights</h1>
          <p className="hero-sub">Patterns across every habit, straight from your history.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onNew}>
          + New habit
        </button>
      </div>

      <div className="stat-grid">
        <StatTile label="Active habits" value={habits.length} icon="📌" hint="across all schedules" />
        <StatTile label="Check-ins · 7 days" value={last7} icon="✅" accent="#31d0a5" hint="last seven days" />
        <StatTile
          label="Best live streak"
          value={bestLive}
          icon="🔥"
          accent="#ff8b5e"
          hint={bestLive === 1 ? 'day in a row' : 'days in a row'}
        />
        <StatTile
          label="30-day completion"
          value={`${Math.round(rate30 * 100)}%`}
          icon="📈"
          accent="#7c6cff"
          hint="of scheduled days"
        />
      </div>

      {habits.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji" aria-hidden="true">
            📊
          </div>
          <h3>No data yet</h3>
          <p>Add a habit and check in for a couple of days — the charts fill themselves in.</p>
          <button type="button" className="btn btn-primary" onClick={onNew}>
            Add a habit
          </button>
        </div>
      ) : (
        <>
          <section className="panel">
            <div className="panel-head">
              <h3>Consistency map</h3>
              <span className="panel-hint">last 26 weeks · all habits</span>
            </div>
            <Heatmap endKey={today} weeks={26} color="var(--accent)" cellOf={cellOf} titleOf={titleOf} />
            <div className="legend">
              <span>Missed</span>
              <span className="heat-cell is-miss" />
              <span>Partial</span>
              <span className="heat-cell is-done" style={{ background: 'var(--accent)', opacity: 0.4 }} />
              <span className="heat-cell is-done" style={{ background: 'var(--accent)', opacity: 0.7 }} />
              <span className="heat-cell is-done" style={{ background: 'var(--accent)' }} />
              <span>All done</span>
            </div>
          </section>

          <div className="detail-split">
            <section className="panel">
              <div className="panel-head">
                <h3>Weekly completion</h3>
                <span className="panel-hint">avg {Math.round(trendAvg * 100)}%</span>
              </div>
              <Sparkline values={trend} color="var(--accent)" height={104} labels={['12 weeks ago', 'now']} />
            </section>
            <section className="panel">
              <div className="panel-head">
                <h3>Best weekdays</h3>
                <span className="panel-hint">last 8 weeks</span>
              </div>
              <WeekdayBars values={weekdays} color="var(--accent)" />
            </section>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h3>Leaderboard</h3>
              <span className="panel-hint">by live streak</span>
            </div>
            <ol className="board">
              {ranked.map(({ habit, streak, best, rate, total }, index) => (
                <li key={habit.id}>
                  <button type="button" className="board-row" onClick={() => onOpen(habit.id)}>
                    <span className="board-rank">{index + 1}</span>
                    <span className="board-emoji" style={{ background: `${habit.color}22` }}>
                      {habit.emoji}
                    </span>
                    <span className="board-main">
                      <span className="board-name">{habit.name}</span>
                      <span className="board-bar">
                        <span style={{ width: `${Math.round(rate * 100)}%`, background: habit.color }} />
                      </span>
                    </span>
                    <span className="board-cell">
                      <strong>{Math.round(rate * 100)}%</strong>
                      <span>30 days</span>
                    </span>
                    <span className="board-cell">
                      <strong>{streak}</strong>
                      <span>streak</span>
                    </span>
                    <span className="board-cell board-cell--wide">
                      <strong>{best}</strong>
                      <span>best · {total} total</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}
