interface ProgressBarProps {
  value: number
  max: number
  label?: string
  /** Accessible name when no visible label is shown. */
  ariaLabel?: string
  /** Spoken value, when a percentage would mislead ("7,2 z 12 bodů"). */
  valueText?: string
  tone?: 'terra' | 'moss'
}

export function ProgressBar({ value, max, label, ariaLabel, valueText, tone = 'terra' }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const fill = tone === 'moss' ? 'bg-moss-500' : 'bg-terra-500'
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-sand-400">
          <span>{label}</span>
          <span className="font-mono tabular-nums">
            {value}/{max}
          </span>
        </div>
      )}
      <div
        className="h-1.5 overflow-hidden rounded-[1px] bg-sand-800"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueText}
        aria-label={label ?? ariaLabel}
      >
        <div
          className={`h-full rounded-[1px] transition-[width] duration-500 ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
