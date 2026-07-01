import { useEffect, useState } from 'react'

interface ExamTimerProps {
  endsAt: number
  onExpire: () => void
}

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ExamTimer({ endsAt, onExpire }: ExamTimerProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = endsAt - now
  useEffect(() => {
    if (remaining <= 0) onExpire()
  }, [remaining, onExpire])

  const urgent = remaining <= 5 * 60 * 1000
  return (
    <span
      className={`border px-3 py-1 font-mono text-sm tabular-nums ${
        urgent
          ? 'border-rust-500 text-rust-400'
          : 'border-sand-700 text-sand-300'
      }`}
      aria-label="Zbývající čas"
      role="timer"
    >
      ⏱ {format(remaining)}
    </span>
  )
}
