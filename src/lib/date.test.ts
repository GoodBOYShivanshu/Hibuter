import { describe, expect, it } from 'vitest'
import {
  addDays,
  dateKey,
  dayRange,
  heatmapGrid,
  isFuture,
  isToday,
  parseKey,
  shiftKey,
  startOfWeek,
} from './date'

describe('date keys', () => {
  it('round-trips a key through parseKey', () => {
    const d = new Date(2026, 0, 3)
    expect(dateKey(d)).toBe('2026-01-03')
    expect(dateKey(parseKey('2026-01-03'))).toBe('2026-01-03')
  })

  it('pads months and days', () => {
    expect(dateKey(new Date(2026, 8, 9))).toBe('2026-09-09')
  })

  it('adds days across month and year boundaries', () => {
    expect(dateKey(addDays(new Date(2025, 11, 31), 1))).toBe('2026-01-01')
    expect(dateKey(addDays(new Date(2026, 0, 1), -1))).toBe('2025-12-31')
  })

  it('shifts a key by a number of days', () => {
    expect(shiftKey('2026-02-28', 1)).toBe('2026-03-01')
    expect(shiftKey('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('detects today and the future', () => {
    expect(isToday(dateKey(new Date()))).toBe(true)
    expect(isFuture('2999-01-01')).toBe(true)
    expect(isFuture('2000-01-01')).toBe(false)
  })
})

describe('day ranges', () => {
  it('returns the window oldest first, inclusive of the end key', () => {
    expect(dayRange('2026-01-03', 5)).toEqual([
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ])
  })

  it('finds the Sunday that starts a week', () => {
    // 2026-01-15 is a Thursday.
    expect(startOfWeek('2026-01-15')).toBe('2026-01-11')
    expect(startOfWeek('2026-01-11')).toBe('2026-01-11')
  })

  it('builds a full heatmap grid ending in the current week', () => {
    const grid = heatmapGrid('2026-01-15', 3)
    expect(grid).toHaveLength(3)
    grid.forEach((column) => expect(column).toHaveLength(7))
    expect(grid[0][0]).toBe('2025-12-28')
    expect(grid[2][0]).toBe('2026-01-11')
    expect(grid[2][6]).toBe('2026-01-17')
    // Every column starts on a Sunday.
    grid.forEach((column) => expect(parseKey(column[0]).getDay()).toBe(0))
  })
})
