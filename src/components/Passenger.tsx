import { useSyncExternalStore } from 'react'
import { PASSENGERS, getPassenger, type Passenger, type PassengerId } from '@/domain/passenger'
import { loadPassenger, savePassenger } from '@/domain/storage'
import { track } from '@/analytics'

// The chosen passenger lives in localStorage (per device, like the unfinished round).
const listeners = new Set<() => void>()
function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function choosePassenger(id: PassengerId | null) {
  savePassenger(id)
  listeners.forEach((fn) => fn())
}
export function usePassenger(): Passenger | undefined {
  return getPassenger(useSyncExternalStore(subscribe, loadPassenger, () => null))
}

export type Mood = 'calm' | 'down' | 'up'

const INK = 'var(--color-sand-50)'
const PAPER = 'var(--color-sand-950)'
const TERRA = 'var(--color-terra-500)'
const MOSS = 'var(--color-moss-400)'
const line = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

function Mouth({ x, y, w, mood }: { x: number; y: number; w: number; mood: Mood }) {
  const d =
    mood === 'up'
      ? `M${x} ${y} q${w / 2} ${w / 2.6} ${w} 0`
      : mood === 'down'
        ? `M${x} ${y + 1.5} q${w / 2} ${-w / 2.6} ${w} 0`
        : `M${x + 0.5} ${y + 0.5} h${w - 1}`
  return <path d={d} fill="none" {...line} strokeWidth={2} />
}

/** A quartered disc, the mark on a crash-test dummy. */
function Quarter({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={PAPER} {...line} strokeWidth={1.6} />
      <path d={`M${cx} ${cy} V${cy - r} A${r} ${r} 0 0 1 ${cx + r} ${cy} Z`} fill={INK} />
      <path d={`M${cx} ${cy} V${cy + r} A${r} ${r} 0 0 1 ${cx - r} ${cy} Z`} fill={INK} />
    </g>
  )
}

function Kuzel({ mood }: { mood: Mood }) {
  // A mistake knocks the cone over a little; it is used to that.
  return (
    <g transform={mood === 'down' ? 'rotate(-17 32 56)' : undefined}>
      <rect x="9" y="49" width="46" height="8" rx="2.5" fill={TERRA} {...line} />
      <path d="M26.5 8 h11 l9.5 41 h-30 z" fill={TERRA} {...line} />
      <path d="M22.4 25.5 H41.6 L44.9 40 H19.1 Z" fill={PAPER} {...line} strokeWidth={2} />
      <circle cx="27.5" cy="31.5" r="1.9" fill={INK} />
      <circle cx="36.5" cy="31.5" r="1.9" fill={INK} />
      <Mouth x={28} y={35.4} w={8} mood={mood} />
    </g>
  )
}

function Panak() {
  // Stoic: the face does not change, whatever happens.
  return (
    <g>
      <path d="M9 62 q1 -19 23 -19 q22 0 23 19 z" fill={TERRA} {...line} />
      <rect x="27" y="35" width="10" height="9" fill="var(--color-sand-700)" {...line} strokeWidth={2} />
      <path d="M27 39.5 h10" {...line} strokeWidth={1.6} />
      <circle cx="32" cy="21" r="14.5" fill="var(--color-sand-800)" {...line} />
      <Quarter cx={41} cy={12.5} r={5} />
      <circle cx="26.5" cy="22" r="1.9" fill={INK} />
      <circle cx="35.5" cy="22" r="1.9" fill={INK} />
      <path d="M27 28.5 h8" {...line} strokeWidth={2} />
      <Quarter cx={32} cy={53.5} r={4.5} />
    </g>
  )
}

function Stromecek({ mood }: { mood: Mood }) {
  // It hangs and sways: one way when things go well, the other when they don't.
  const sway = mood === 'up' ? 7 : mood === 'down' ? -7 : 0
  return (
    <g transform={`rotate(${sway} 32 1)`}>
      <path d="M32 1 V10" {...line} strokeWidth={1.8} />
      <path
        d="M32 8 L42 23 H37 L46.5 37 H40.5 L51 51 H36.5 V59 H27.5 V51 H13 L23.5 37 H17.5 L27 23 H22 Z"
        fill={MOSS}
        {...line}
      />
      <circle cx="32" cy="14.5" r="1.7" fill={PAPER} {...line} strokeWidth={1.4} />
      <circle cx="28" cy="38.5" r="1.9" fill={INK} />
      <circle cx="36" cy="38.5" r="1.9" fill={INK} />
      <Mouth x={28.5} y={43} w={7} mood={mood} />
    </g>
  )
}

function Karel({ mood }: { mood: Mood }) {
  return (
    <g>
      <path d="M4 63 q1 -18 22 -18 q21 0 22 18 z" fill="var(--color-sand-500)" {...line} />
      <circle cx="26" cy="27" r="13.5" fill="var(--color-sand-800)" {...line} />
      {/* flat cap */}
      <path d="M12.5 21.5 q3 -13 15 -13 q10 0 14 9 l7.5 2.5 q0.5 3 -3 3 H13 z" fill={INK} {...line} />
      {/* glasses and a raised or sunk brow */}
      <circle cx="21.5" cy="28" r="3.6" fill={PAPER} {...line} strokeWidth={1.8} />
      <circle cx="31.5" cy="28" r="3.6" fill={PAPER} {...line} strokeWidth={1.8} />
      <path d="M25.1 28 h2.8" {...line} strokeWidth={1.8} />
      <circle cx="21.5" cy={mood === 'down' ? 28.8 : 28} r="1.2" fill={INK} />
      <circle cx="31.5" cy={mood === 'down' ? 28.8 : 28} r="1.2" fill={INK} />
      {/* moustache: it droops with a sigh */}
      <path
        d={
          mood === 'down'
            ? 'M18.5 37.5 q4 -4.5 8 -1.5 q4 -3 8 1.5 q-4 0.5 -8 -0.5 q-4 1 -8 0.5 z'
            : 'M18.5 35 q4 -2.5 8 0 q4 -2.5 8 0 q-4 3 -8 1.2 q-4 1.8 -8 -1.2 z'
        }
        fill={INK}
        {...line}
        strokeWidth={1.2}
      />
      {/* the thermos; it steams unless it has been put down for a good run */}
      <rect x="48" y="35" width="11" height="24" rx="3" fill={TERRA} {...line} />
      <rect x="49.5" y="29" width="8" height="7" rx="1.8" fill="var(--color-sand-700)" {...line} strokeWidth={2} />
      <path d="M48 43 h11" {...line} strokeWidth={1.6} />
      {mood !== 'up' && <path d="M53.5 25 q-3 -3 0 -6 q3 -3 0 -6" fill="none" {...line} strokeWidth={1.8} />}
    </g>
  )
}

export function PassengerPortrait({ id, mood = 'calm', size = 56 }: { id: PassengerId; mood?: Mood; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="shrink-0">
      {id === 'kuzel' && <Kuzel mood={mood} />}
      {id === 'panak' && <Panak />}
      {id === 'stromecek' && <Stromecek mood={mood} />}
      {id === 'karel' && <Karel mood={mood} />}
    </svg>
  )
}

/** The gloss in the margin: the passenger's portrait and one line. */
export function PassengerNote({ passenger, text, mood }: { passenger: Passenger; text: string; mood: Mood }) {
  return (
    <aside
      role="note"
      aria-label={`Spolujezdec: ${passenger.name}`}
      data-testid="passenger-note"
      className="mt-5 flex items-center gap-3 border-t border-dashed border-sand-600 pt-4"
    >
      <PassengerPortrait id={passenger.id} mood={mood} />
      <p className="min-w-0 leading-snug text-sand-200">
        <span className="block font-mono text-[0.7rem] uppercase tracking-[0.15em] text-sand-500">{passenger.name}</span>
        {text}
      </p>
    </aside>
  )
}

/** Home: pick who rides along, or nobody (the default). */
export function PassengerPicker() {
  const current = usePassenger()
  const pick = (id: PassengerId | null) => {
    choosePassenger(id)
    track('key_action', { action: 'passenger_chosen', passenger: id ?? 'none' })
  }
  return (
    <section className="mb-3 rounded-card border border-sand-700 bg-sand-800/40 p-5" aria-labelledby="spolujezdec-title">
      <h2 id="spolujezdec-title" className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
        Spolujezdec
      </h2>
      <p className="mt-1 text-sm text-sand-300">
        Kdo vám do toho bude mluvit. Komentuje chyby v tréninku, u zkušebního testu mlčí.
      </p>
      <div role="group" aria-label="Výběr spolujezdce" className="mt-3 grid grid-cols-5 gap-1.5">
        {PASSENGERS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={current?.id === p.id}
            aria-label={p.name}
            onClick={() => pick(p.id)}
            className={`flex min-h-16 items-center justify-center rounded-card border py-1.5 transition-colors ${
              current?.id === p.id ? 'border-terra-500 bg-terra-500/10' : 'border-sand-700 hover:border-sand-500'
            }`}
          >
            <PassengerPortrait id={p.id} size={46} />
          </button>
        ))}
        <button
          type="button"
          aria-pressed={!current}
          onClick={() => pick(null)}
          className={`min-h-16 rounded-card border px-1 text-sm text-sand-300 transition-colors ${
            !current ? 'border-terra-500 bg-terra-500/10' : 'border-sand-700 hover:border-sand-500'
          }`}
        >
          Nikdo
        </button>
      </div>
      {current && (
        <div className="mt-4 flex items-start gap-4" data-testid="passenger-card">
          <PassengerPortrait id={current.id} size={84} />
          <div className="min-w-0">
            <p className="font-display text-lg font-bold tracking-tight text-sand-50">{current.name}</p>
            {/* Set like a sign plate (Obraz a jméno): what it officially is. */}
            <p className="font-mono text-xs text-terra-300">{current.plate}</p>
            <p className="mt-2 leading-relaxed text-sand-200">{current.intro}</p>
          </div>
        </div>
      )}
    </section>
  )
}
