import { describe, expect, it } from 'vitest'
import { createDemoHabits, exportPayload, sanitizeState, PALETTE } from './storage'
import { currentStreak, isScheduled } from './stats'
import { shiftKey, todayKey } from './date'

describe('sanitizeState', () => {
  it('rejects junk', () => {
    expect(sanitizeState(null)).toBeNull()
    expect(sanitizeState({ habits: 'nope' })).toBeNull()
  })

  it('repairs habits and drops unusable entries', () => {
    const state = sanitizeState({
      theme: 'light',
      demo: false,
      habits: [
        {
          id: 'a',
          name: '  Walk  ',
          emoji: '🚶',
          color: '#123456',
          schedule: [1, 3, 9, 'x'],
          createdAt: '2026-01-01',
          entries: { '2026-01-02': 1, '2026-01-03': 0, nope: 4 },
          archived: false,
        },
        { id: 'b' },
        { name: 'no id' },
      ],
    })

    expect(state).not.toBeNull()
    expect(state!.theme).toBe('light')
    expect(state!.habits).toHaveLength(2)
    const [first, second] = state!.habits
    expect(first.name).toBe('Walk')
    expect(first.schedule).toEqual([1, 3])
    expect(first.entries).toEqual({ '2026-01-02': 1 })
    expect(second.schedule).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(second.color).toBe(PALETTE[0])
  })
})

describe('demo habits', () => {
  it('creates six habits with history inside the schedule', () => {
    const habits = createDemoHabits()
    expect(habits).toHaveLength(6)
    for (const habit of habits) {
      expect(habit.entries).toBeTypeOf('object')
      const keys = Object.keys(habit.entries)
      expect(keys.length).toBeGreaterThan(10)
      // Every stored day must actually be one of the habit's days.
      for (const key of keys) {
        expect(isScheduled(habit, key)).toBe(true)
        expect(key >= habit.createdAt).toBe(true)
        expect(key <= todayKey()).toBe(true)
      }
    }
  })

  it('leaves something to tick off today', () => {
    const habits = createDemoHabits()
    const today = todayKey()
    const open = habits.filter((habit) => isScheduled(habit, today) && !habit.entries[today])
    expect(open.length).toBeGreaterThan(0)
  })

  it('produces believable streaks', () => {
    const habits = createDemoHabits()
    const streaks = habits.map((habit) => currentStreak(habit, todayKey()))
    expect(Math.max(...streaks)).toBeGreaterThan(2)
    expect(shiftKey(todayKey(), -140)).toBe(habits[0].createdAt)
  })
})

describe('exportPayload', () => {
  it('omits ids so imports can be re-identified', () => {
    const payload = exportPayload({
      version: 1,
      theme: 'dark',
      demo: false,
      habits: [
        {
          id: 'abc',
          name: 'Read',
          emoji: '📚',
          color: PALETTE[1],
          schedule: [1],
          createdAt: '2026-01-01',
          entries: { '2026-01-05': 1 },
          archived: false,
        },
      ],
    })
    expect(payload.app).toBe('hibxy')
    expect(payload.habits).toHaveLength(1)
    expect(payload.habits[0]).not.toHaveProperty('id')
    expect(payload.habits[0].entries).toEqual({ '2026-01-05': 1 })
  })
})
