import type { Habit } from '../types'
import { WEEKDAY_SHORT, addDays, dateKey, parseKey, shiftKey, todayKey } from './date'

const MAX_DAYS = 3660

export function isScheduled(habit: Habit, key: string): boolean {
  return habit.schedule.includes(parseKey(key).getDay())
}

export function isDone(habit: Habit, key: string): boolean {
  return (habit.entries[key] ?? 0) > 0
}

export function checkIns(habit: Habit): number {
  return Object.values(habit.entries).filter((v) => v > 0).length
}

/** Length of the run that is live *right now*. A not-yet-logged today doesn't break it. */
export function currentStreak(habit: Habit, ref: string = todayKey()): number {
  let cursor = parseKey(ref)
  if (isScheduled(habit, dateKey(cursor)) && !isDone(habit, dateKey(cursor))) {
    cursor = addDays(cursor, -1)
  }
  let streak = 0
  for (let i = 0; i < MAX_DAYS; i++) {
    const key = dateKey(cursor)
    if (key < habit.createdAt) break
    if (isScheduled(habit, key)) {
      if (!isDone(habit, key)) break
      streak++
    }
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest run the habit has ever had, counting only scheduled days. */
export function bestStreak(habit: Habit, ref: string = todayKey()): number {
  const span = Math.min(Math.max(shiftDiff(habit.createdAt, ref), 0) + 1, MAX_DAYS)
  let best = 0
  let run = 0
  let cursor = parseKey(habit.createdAt)
  for (let i = 0; i < span; i++) {
    const key = dateKey(cursor)
    if (isScheduled(habit, key)) {
      if (isDone(habit, key)) {
        run++
        if (run > best) best = run
      } else {
        run = 0
      }
    }
    cursor = addDays(cursor, 1)
  }
  return best
}

function shiftDiff(from: string, to: string): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86_400_000)
}

/** Share of scheduled days completed over the trailing `days` window (0–1). */
export function completionRate(habit: Habit, days = 30, ref: string = todayKey()): number {
  let due = 0
  let done = 0
  for (let i = 0; i < days; i++) {
    const key = shiftKey(ref, -i)
    if (key < habit.createdAt || key > ref) continue
    if (!isScheduled(habit, key)) continue
    due++
    if (isDone(habit, key)) done++
  }
  return due === 0 ? 0 : done / due
}

export type WeekProgress = { done: number; due: number; rate: number }

/** Progress for the current week (Sunday → `ref`). */
export function weekProgress(habit: Habit, ref: string = todayKey()): WeekProgress {
  const end = parseKey(ref)
  let done = 0
  let due = 0
  for (let i = 0; i < 7; i++) {
    const key = dateKey(addDays(end, -i))
    if (key < habit.createdAt) continue
    if (!isScheduled(habit, key)) continue
    due++
    if (isDone(habit, key)) done++
  }
  return { done, due, rate: due === 0 ? 0 : done / due }
}

export function scheduleLabel(schedule: number[]): string {
  const days = [...new Set(schedule)].sort((a, b) => a - b)
  if (days.length === 7) return 'Every day'
  if (days.length === 0) return 'No days set'
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return 'Weekdays'
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends'
  return days.map((d) => WEEKDAY_SHORT[d]).join(' · ')
}

/** Completion rate per weekday over the trailing `weeks` weeks. */
export function weekdayRates(habit: Habit, ref: string = todayKey(), weeks = 8): number[] {
  const due = new Array<number>(7).fill(0)
  const done = new Array<number>(7).fill(0)
  for (let i = 0; i < weeks * 7; i++) {
    const key = shiftKey(ref, -i)
    if (key < habit.createdAt) break
    const day = parseKey(key).getDay()
    if (!habit.schedule.includes(day)) continue
    due[day]++
    if (isDone(habit, key)) done[day]++
  }
  return due.map((d, i) => (d === 0 ? -1 : done[i] / d))
}

/** Completion rate for each of the trailing `weeks` weeks (oldest first). */
export function weeklyRates(habit: Habit, ref: string = todayKey(), weeks = 12): number[] {
  const out: number[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const end = shiftKey(ref, -w * 7)
    let due = 0
    let done = 0
    for (let i = 0; i < 7; i++) {
      const key = shiftKey(end, -i)
      if (key < habit.createdAt || key > ref) continue
      if (!isScheduled(habit, key)) continue
      due++
      if (isDone(habit, key)) done++
    }
    out.push(due === 0 ? 0 : done / due)
  }
  return out
}

/** Due/done totals across several habits for each key in `keys`. */
export function totalsFor(
  habits: Habit[],
  keys: string[],
): { done: number; due: number; rate: number } {
  let done = 0
  let due = 0
  for (const key of keys) {
    for (const habit of habits) {
      if (key < habit.createdAt) continue
      if (!isScheduled(habit, key)) continue
      due++
      if (isDone(habit, key)) done++
    }
  }
  return { done, due, rate: due === 0 ? 0 : done / due }
}

/** Aggregate weekday completion (0–1, -1 when a weekday never applies). */
export function aggregateWeekdayRates(habits: Habit[], ref: string, weeks = 8): number[] {
  const due = new Array<number>(7).fill(0)
  const done = new Array<number>(7).fill(0)
  for (let i = 0; i < weeks * 7; i++) {
    const key = shiftKey(ref, -i)
    const day = parseKey(key).getDay()
    for (const habit of habits) {
      if (key < habit.createdAt) continue
      if (!habit.schedule.includes(day)) continue
      due[day]++
      if (isDone(habit, key)) done[day]++
    }
  }
  return due.map((d, i) => (d === 0 ? -1 : done[i] / d))
}

export function weeklyTrend(habits: Habit[], ref: string, weeks = 12): number[] {
  const out: number[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const end = shiftKey(ref, -w * 7)
    const keys: string[] = []
    for (let i = 0; i < 7; i++) keys.push(shiftKey(end, -i))
    const { due, done } = totalsFor(habits, keys)
    out.push(due === 0 ? 0 : done / due)
  }
  return out
}
