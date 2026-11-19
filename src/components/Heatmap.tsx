import { useMemo } from 'react'
import { MONTH_SHORT, WEEKDAY_MIN, heatmapGrid, parseKey } from '../lib/date'

export type HeatCell = {
  kind: 'done' | 'miss' | 'off' | 'future'
  /** 0.25 – 1 opacity for "done" cells (aggregate views use partial credit). */
  alpha?: number
}

type HeatmapProps = {
  endKey: string
  weeks?: number
  color: string
  cellOf: (key: string) => HeatCell
  titleOf: (key: string) => string
  onPick?: (key: string) => void
}

const CELL = 13
const GAP = 4
const PITCH = CELL + GAP

export function Heatmap({
  endKey,
  weeks = 26,
  color,
  cellOf,
  titleOf,
  onPick,
}: HeatmapProps) {
  const grid = useMemo(() => heatmapGrid(endKey, weeks), [endKey, weeks])

  const months = useMemo(() => {
    const marks: { index: number; label: string }[] = []
    let last = ''
    grid.forEach((week, index) => {
      const label = MONTH_SHORT[parseKey(week[0]).getMonth()]
      if (label !== last) {
        if (index < grid.length - 1) marks.push({ index, label })
        last = label
      }
    })
    return marks
  }, [grid])

  return (
    <div className="heatmap">
      <div className="heatmap-inner" style={{ width: weeks * PITCH + 26 }}>
        <div className="heatmap-months" style={{ marginLeft: 26 }}>
          {months.map((m) => (
            <span key={`${m.label}-${m.index}`} style={{ left: m.index * PITCH }}>
              {m.label}
            </span>
          ))}
        </div>
        <div className="heatmap-body">
          <div className="heatmap-weekdays" aria-hidden="true">
            {WEEKDAY_MIN.map((d, i) => (
              <span key={i}>{i % 2 === 1 ? d : ''}</span>
            ))}
          </div>
          <div
            className="heatmap-grid"
            style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP }}
          >
            {grid.map((week, wi) => (
              <div className="heatmap-col" key={wi} style={{ gap: GAP }}>
                {week.map((key) => {
                  const cell = cellOf(key)
                  const clickable = !!onPick && cell.kind !== 'future'
                  const title = titleOf(key)
                  const style =
                    cell.kind === 'done'
                      ? {
                          background: color,
                          opacity: cell.alpha ?? 1,
                        }
                      : undefined
                  const className = `heat-cell is-${cell.kind}`
                  if (clickable) {
                    return (
                      <button
                        key={key}
                        type="button"
                        className={className}
                        style={{ ...style, width: CELL, height: CELL }}
                        title={title}
                        aria-label={title}
                        onClick={() => onPick?.(key)}
                      />
                    )
                  }
                  return (
                    <span
                      key={key}
                      className={className}
                      style={{ ...style, width: CELL, height: CELL }}
                      title={title}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
