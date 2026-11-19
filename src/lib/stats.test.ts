import { describe, expect, it } from 'vitest'
import type { Habit } from '../types'
import {
  bestStreak,
  checkIns,
  completionRate,
  currentStreak,
  isDone,
  isScheduled,
  scheduleLabel,
  totalsFor,
  weekdayRates,
  weeklyRates,
} from './stats'

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'test',
    name: 'Test habit',
    emoji: '✅',
    color: '#7c6cff',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    createdAt: '2026-01-01',
    entries: {},
    archived: false,
    ...overrides,
  }
}

function entriesFor(keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, 1]))
}

describe('scheduling', () => {
  it('knows which weekdays a habit is due', () => {
    const h = habit({ schedule: [1, 3, 5] })
    expect(isScheduled(h, '2026-01-05')).toBe(true) // Monday
    expect(isScheduled(h, '2026-01-06')).toBe(false) // Tuesday
  })

  it('labels common schedules', () => {
    expect(scheduleLabel([0, 1, 2, 3, 4, 5, 6])).toBe('Every day')
    expect(scheduleLabel([1, 2, 3, 4, 5])).toBe('Weekdays')
    expect(scheduleLabel([0, 6])).toBe('Weekends')
    expect(scheduleLabel([1, 3, 5])).toBe('Mon · Wed · Fri')
  })
})

describe('entries', () => {
  it('treats any positive count as done', () => {
    const h = habit({ entries: { '2026-01-02': 2 } })
    expect(isDone(h, '2026-01-02')).toBe(true)
    expect(isDone(h, '2026-01-03')).toBe(false)
    expect(checkIns(h)).toBe(1)
  })
})

describe('currentStreak', () => {
  it('counts consecutive completed days', () => {
    const h = habit({
      entries: entriesFor(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05']),
    })
    expect(currentStreak(h, '2026-01-05')).toBe(5)
  })

  it('does not break when today simply has not been logged yet', () => {
    const h = habit({
      entries: entriesFor(['2026-01-03', '2026-01-04', '2026-01-05']),
    })
    expect(currentStreak(h, '2026-01-06')).toBe(3)
  })

  it('breaks on a missed day', () => {
    const h = habit({ entries: entriesFor(['2026-01-04', '2026-01-05']) })
    expect(currentStreak(h, '2026-01-06')).toBe(2)
    expect(currentStreak(h, '2026-01-07')).toBe(0)
  })

  it('skips rest days instead of breaking the chain', () => {
    // Weekend-only habit: Jan 3, 4, 10, 11 of 2026 are the weekends.
    const h = habit({
      schedule: [0, 6],
      entries: entriesFor(['2026-01-03', '2026-01-04', '2026-01-10', '2026-01-11']),
    })
    expect(currentStreak(h, '2026-01-11')).toBe(4)
    expect(currentStreak(h, '2026-01-17')).toBe(4)
  })

  it('never counts days before the habit existed', () => {
    const h = habit({ createdAt: '2026-01-10', entries: entriesFor(['2026-01-10', '2026-01-11']) })
    expect(currentStreak(h, '2026-01-11')).toBe(2)
  })
})

describe('bestStreak', () => {
  it('finds the longest run in history', () => {
    const h = habit({
      entries: entriesFor([
        '2026-01-01',
        '2026-01-02',
        '2026-01-03',
        '2026-01-05',
        '2026-01-06',
        '2026-01-07',
        '2026-01-08',
        '2026-01-09',
      ]),
    })
    expect(bestStreak(h, '2026-01-10')).toBe(5)
    expect(currentStreak(h, '2026-01-10')).toBe(5)
  })
})

describe('completionRate', () => {
  it('only counts scheduled days in the window', () => {
    // Mondays in the 28 days before 2026-02-01: Jan 5, 12, 19, 26.
    const h = habit({
      schedule: [1],
      createdAt: '2025-12-01',
      entries: entriesFor(['2026-01-05', '2026-01-26']),
    })
    expect(completionRate(h, 28, '2026-02-01')).toBeCloseTo(0.5)
  })

  it('ignores days before the habit was created', () => {
    const h = habit({ createdAt: '2026-01-30', entries: entriesFor(['2026-01-30']) })
    // Only Jan 30 and Jan 31 count, not the other 28 days in the window.
    expect(completionRate(h, 30, '2026-01-31')).toBeCloseTo(0.5)
  })

  it('returns zero when nothing is scheduled', () => {
    const h = habit({ schedule: [], createdAt: '2026-01-01' })
    expect(completionRate(h, 30, '2026-01-31')).toBe(0)
  })
})

describe('aggregate helpers', () => {
  it('totals due and done across habits', () => {
    const a = habit({ id: 'a', entries: entriesFor(['2026-01-02']) })
    const b = habit({ id: 'b', schedule: [1, 2], entries: {} })
    const totals = totalsFor([a, b], ['2026-01-02', '2026-01-03'])
    // a: 2 due / 1 done; b: Jan 2 (Fri) not scheduled, Jan 3 (Sat) not scheduled.
    expect(totals.due).toBe(2)
    expect(totals.done).toBe(1)
    expect(totals.rate).toBeCloseTo(0.5)
  })

  it('produces seven weekday rates and a weekly series', () => {
    const h = habit({ entries: entriesFor(['2026-01-05', '2026-01-06']) })
    expect(weekdayRates(h, '2026-01-11', 4)).toHaveLength(7)
    const weeks = weeklyRates(h, '2026-01-11', 6)
    expect(weeks).toHaveLength(6)
    weeks.forEach((value) => expect(value).toBeGreaterThanOrEqual(0))
    expect(weeks[weeks.length - 1]).toBeCloseTo(2 / 7)
  })
})
