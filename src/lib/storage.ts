import type { AppState, Habit } from '../types'
import { parseKey, shiftKey, todayKey } from './date'

export const STORAGE_KEY = 'hibxy.state.v1'

/** Colour palette used for new habits (also the swatches in the editor). */
export const PALETTE = [
  '#7c6cff',
  '#31d0a5',
  '#ff8b5e',
  '#4cb8f5',
  '#f978b6',
  '#f5c451',
  '#9fd65a',
  '#ff6f7d',
]

export const EMOJI_CHOICES = [
  '🧘',
  '🏃',
  '📚',
  '💧',
  '🎸',
  '🌙',
  '🥗',
  '💪',
  '✍️',
  '🧹',
  '🌱',
  '☀️',
  '🧠',
  '🎯',
  '💊',
  '🚴',
  '🛌',
  '📵',
  '🧑‍💻',
  '🎨',
  '🐕',
  '🪥',
]

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `h_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function emptyState(): AppState {
  return { version: 1, theme: 'dark', habits: [], demo: false }
}

export function sanitizeState(value: unknown): AppState | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<AppState>
  if (!Array.isArray(raw.habits)) return null
  const habits: Habit[] = raw.habits
    .filter((h): h is Habit => !!h && typeof h === 'object' && typeof (h as Habit).id === 'string')
    .map((h) => ({
      id: h.id,
      name: typeof h.name === 'string' && h.name.trim() ? h.name.trim().slice(0, 60) : 'Habit',
      emoji: typeof h.emoji === 'string' && h.emoji ? h.emoji.slice(0, 4) : '✅',
      color: typeof h.color === 'string' ? h.color : PALETTE[0],
      schedule: Array.isArray(h.schedule)
        ? h.schedule.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
        : [0, 1, 2, 3, 4, 5, 6],
      createdAt: typeof h.createdAt === 'string' ? h.createdAt : todayKey(),
      entries:
        h.entries && typeof h.entries === 'object'
          ? Object.fromEntries(
              Object.entries(h.entries).filter(
                ([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(v) && v > 0,
              ),
            )
          : {},
      archived: !!h.archived,
    }))
  return {
    version: 1,
    theme: raw.theme === 'light' ? 'light' : 'dark',
    habits,
    demo: !!raw.demo,
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = sanitizeState(JSON.parse(raw))
    if (!parsed) return createSeedState()
    return parsed
  } catch {
    return createSeedState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be full or blocked; the app still works for this session.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4_294_967_296
  }
}

type Spec = {
  name: string
  emoji: string
  color: string
  schedule: number[]
  /** Base chance of completing a scheduled day. */
  chance: number
  /** How much better the habit gets over the 20 weeks (0–0.3). */
  improve: number
  seed: number
}

const DEMO: Spec[] = [
  {
    name: 'Meditate for 10 minutes',
    emoji: '🧘',
    color: PALETTE[0],
    schedule: [0, 1, 2, 3, 4, 5, 6],
    chance: 0.72,
    improve: 0.22,
    seed: 11,
  },
  {
    name: 'Morning run',
    emoji: '🏃',
    color: PALETTE[2],
    schedule: [1, 3, 5, 6],
    chance: 0.7,
    improve: 0.2,
    seed: 23,
  },
  {
    name: 'Read 20 pages',
    emoji: '📚',
    color: PALETTE[1],
    schedule: [0, 1, 2, 3, 4, 5, 6],
    chance: 0.8,
    improve: 0.15,
    seed: 37,
  },
  {
    name: 'Drink 2L of water',
    emoji: '💧',
    color: PALETTE[3],
    schedule: [0, 1, 2, 3, 4, 5, 6],
    chance: 0.86,
    improve: 0.1,
    seed: 41,
  },
  {
    name: 'Practice guitar',
    emoji: '🎸',
    color: PALETTE[4],
    schedule: [0, 2, 4],
    chance: 0.62,
    improve: 0.25,
    seed: 53,
  },
  {
    name: 'Lights out by 11pm',
    emoji: '🌙',
    color: PALETTE[6],
    schedule: [0, 1, 2, 3, 4, 5, 6],
    chance: 0.58,
    improve: 0.3,
    seed: 67,
  },
]

export function createDemoHabits(): Habit[] {
  const today = todayKey()
  const days = 140
  return DEMO.map((spec, index) => {
    const random = rng(spec.seed)
    const entries: Record<string, number> = {}
    const createdAt = shiftKey(today, -days)

    for (let i = days; i >= 0; i--) {
      const key = shiftKey(today, -i)
      const weekday = parseKey(key).getDay()
      if (!spec.schedule.includes(weekday)) continue
      const progress = (days - i) / days // 0 older → 1 recent
      // Fresh starts should be a little shaky, recent weeks strong.
      const chance = spec.chance + spec.improve * Math.pow(progress, 1.4)
      if (random() < chance) entries[key] = 1
    }

    // Leave a couple of today's demo habits open so there's something to tick.
    if (index % 3 === 0) delete entries[today]

    return {
      id: uid(),
      name: spec.name,
      emoji: spec.emoji,
      color: spec.color,
      schedule: spec.schedule,
      createdAt,
      entries,
      archived: false,
    }
  })
}

export function createSeedState(): AppState {
  return { version: 1, theme: 'dark', habits: createDemoHabits(), demo: true }
}

/** Turns any habit's history into a fresh export-friendly shape. */
export function exportPayload(state: AppState) {
  return {
    app: 'hibxy',
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: state.habits.map((h) => ({
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      schedule: h.schedule,
      createdAt: h.createdAt,
      archived: h.archived,
      entries: h.entries,
    })),
  }
}
