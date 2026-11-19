import { useId, type ReactNode } from 'react'
import { WEEKDAY_MIN } from '../lib/date'

export function Sparkline({
  values,
  color,
  height = 84,
  labels,
}: {
  values: number[]
  color: string
  height?: number
  labels?: [string, string]
}) {
  const id = useId().replace(/:/g, '')
  const w = 100
  const h = 40
  const pad = 3
  const points = values.map((v, i) => {
    const x = values.length === 1 ? w : (i / (values.length - 1)) * w
    const y = h - pad - Math.min(1, Math.max(0, v)) * (h - pad * 2)
    return [x, y] as const
  })
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const last = points[points.length - 1]

  return (
    <div className="spark">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ height }}
        role="img"
        aria-label="Weekly completion trend"
      >
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#spark-${id})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {last && <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />}
      </svg>
      {labels && (
        <div className="spark-labels">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  )
}

export function WeekdayBars({ values, color }: { values: number[]; color: string }) {
  return (
    <div className="bars">
      {values.map((v, i) => {
        const pct = v < 0 ? 0 : Math.round(v * 100)
        return (
          <div className="bar-col" key={i}>
            <div className="bar-track" title={v < 0 ? 'Not scheduled' : `${pct}% complete`}>
              <div
                className={`bar-fill${v < 0 ? ' is-off' : ''}`}
                style={{
                  height: v < 0 ? '2px' : `${Math.max(6, pct)}%`,
                  background: v < 0 ? 'var(--line)' : color,
                }}
              />
            </div>
            <span>{WEEKDAY_MIN[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  accent?: string
  icon?: string
}) {
  return (
    <div className="stat-tile" style={accent ? { borderColor: `${accent}33` } : undefined}>
      <div className="stat-label">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  )
}
