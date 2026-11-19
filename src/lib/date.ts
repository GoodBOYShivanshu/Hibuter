/** Small, dependency-free date helpers. Everything is local-time and keyed by YYYY-MM-DD. */

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))

export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_MIN = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const copy = startOfDay(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function todayKey(): string {
  return dateKey(new Date())
}

export function shiftKey(key: string, days: number): string {
  return dateKey(addDays(parseKey(key), days))
}

export function isToday(key: string): boolean {
  return key === todayKey()
}

export function isFuture(key: string): boolean {
  return key > todayKey()
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86_400_000)
}

/** "Wednesday, November 19" */
export function longDate(key: string): string {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/** "Nov 19" */
export function shortDate(key: string): string {
  const d = parseKey(key)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

/** "Nov 19, 2025" */
export function fullDate(key: string): string {
  const d = parseKey(key)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function monthOf(key: string): string {
  return MONTH_SHORT[parseKey(key).getMonth()]
}

/** The last `count` days, oldest first, ending at `endKey` (inclusive). */
export function dayRange(endKey: string, count: number): string[] {
  const end = parseKey(endKey)
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--) out.push(dateKey(addDays(end, -i)))
  return out
}

/** Sunday of the week containing `key`. */
export function startOfWeek(key: string): string {
  const d = parseKey(key)
  d.setDate(d.getDate() - d.getDay())
  return dateKey(d)
}

/**
 * A heatmap grid: `weeks` columns of 7 day keys (Sunday → Saturday),
 * oldest first, ending in the week that contains `endKey`.
 */
export function heatmapGrid(endKey: string, weeks: number): string[][] {
  const lastWeekStart = parseKey(startOfWeek(endKey))
  const columns: string[][] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(lastWeekStart, -w * 7)
    const col: string[] = []
    for (let d = 0; d < 7; d++) col.push(dateKey(addDays(weekStart, d)))
    columns.push(col)
  }
  return columns
}

/** True when `key` is the first day of its week (used for month labels). */
export function isWeekStart(key: string): boolean {
  return parseKey(key).getDay() === 0
}
