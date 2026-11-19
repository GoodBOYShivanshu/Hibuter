import { useEffect, useRef, useState } from 'react'
import type { Habit } from '../types'
import { WEEKDAY_SHORT } from '../lib/date'
import { EMOJI_CHOICES, PALETTE } from '../lib/storage'

export type HabitDraft = {
  name: string
  emoji: string
  color: string
  schedule: number[]
}

type HabitDialogProps = {
  habit?: Habit | null
  onCancel: () => void
  onSubmit: (draft: HabitDraft) => void
  onDelete?: () => void
}

const PRESETS: { label: string; days: number[] }[] = [
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
  { label: '3× a week', days: [1, 3, 5] },
]

export function HabitDialog({ habit, onCancel, onSubmit, onDelete }: HabitDialogProps) {
  const editing = !!habit
  const [name, setName] = useState(habit?.name ?? '')
  const [emoji, setEmoji] = useState(habit?.emoji ?? '🎯')
  const [color, setColor] = useState(habit?.color ?? PALETTE[0])
  const [schedule, setSchedule] = useState<number[]>(habit?.schedule ?? [0, 1, 2, 3, 4, 5, 6])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    nameRef.current?.select()
  }, [])

  const toggleDay = (day: number) => {
    setSchedule((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    )
  }

  const valid = name.trim().length > 0 && schedule.length > 0

  return (
    <div className="dialog-layer" role="presentation" onMouseDown={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-head">
          <div>
            <h2 id="habit-dialog-title">{editing ? 'Edit habit' : 'New habit'}</h2>
            <p className="dialog-sub">
              {editing ? 'Change the details or the days it repeats.' : 'Small, specific, repeatable.'}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </header>

        <form
          className="dialog-body"
          onSubmit={(event) => {
            event.preventDefault()
            if (!valid) return
            onSubmit({
              name: name.trim(),
              emoji: emoji.trim() || '✅',
              color,
              schedule: [...schedule].sort(),
            })
          }}
        >
          <label className="field">
            <span className="field-label">Habit name</span>
            <input
              ref={nameRef}
              value={name}
              maxLength={60}
              placeholder="e.g. Stretch for 5 minutes"
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <div className="field">
            <span className="field-label">Icon</span>
            <div className="emoji-row">
              <input
                className="emoji-input"
                value={emoji}
                maxLength={4}
                aria-label="Custom emoji"
                onChange={(event) => setEmoji(event.target.value)}
              />
              <div className="emoji-grid">
                {EMOJI_CHOICES.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={`emoji-chip${emoji === choice ? ' is-active' : ''}`}
                    onClick={() => setEmoji(choice)}
                    aria-label={`Use ${choice}`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Colour</span>
            <div className="swatch-row">
              {PALETTE.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`swatch${color === swatch ? ' is-active' : ''}`}
                  style={{ background: swatch }}
                  onClick={() => setColor(swatch)}
                  aria-label={`Use colour ${swatch}`}
                  aria-pressed={color === swatch}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Repeat on</span>
            <div className="day-row">
              {WEEKDAY_SHORT.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  className={`day-pill${schedule.includes(index) ? ' is-active' : ''}`}
                  onClick={() => toggleDay(index)}
                  aria-pressed={schedule.includes(index)}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="preset-row">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="preset"
                  onClick={() => setSchedule(preset.days)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {schedule.length === 0 && (
              <p className="field-error">Pick at least one day of the week.</p>
            )}
          </div>

          <footer className="dialog-foot">
            {editing && onDelete && (
              <button
                type="button"
                className={`btn btn-danger-ghost${confirmDelete ? ' is-confirm' : ''}`}
                onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              >
                {confirmDelete ? 'Tap again to delete' : 'Delete'}
              </button>
            )}
            <div className="dialog-foot-right">
              <button type="button" className="btn btn-ghost" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!valid}>
                {editing ? 'Save changes' : 'Add habit'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
