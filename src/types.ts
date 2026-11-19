export type Habit = {
  id: string
  name: string
  emoji: string
  /** Accent colour used for the card, dots, heatmap and charts. */
  color: string
  /** Days of the week the habit is due. 0 = Sunday … 6 = Saturday. */
  schedule: number[]
  /** YYYY-MM-DD — no check-in before this date counts. */
  createdAt: string
  /** YYYY-MM-DD -> number of check-ins that day. */
  entries: Record<string, number>
  archived: boolean
}

export type Theme = 'dark' | 'light'

export type AppState = {
  version: 1
  theme: Theme
  habits: Habit[]
  /** False until the demo habits have been removed or replaced. */
  demo: boolean
}
