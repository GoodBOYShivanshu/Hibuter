import { useId, type ReactNode } from 'react'

type RingProps = {
  /** 0 – 1 */
  value: number
  size?: number
  stroke?: number
  color?: string
  colorTo?: string
  children?: ReactNode
  /** Accessible description, e.g. "3 of 5 habits done". */
  label?: string
}

export function Ring({
  value,
  size = 132,
  stroke = 10,
  color = '#7c6cff',
  colorTo = '#31d0a5',
  children,
  label,
}: RingProps) {
  const id = useId().replace(/:/g, '')
  const clamped = Math.min(1, Math.max(0, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * clamped

  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(clamped * 100)} percent complete`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
