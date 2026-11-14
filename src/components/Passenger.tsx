import { useSyncExternalStore } from 'react'
import { PASSENGERS, getPassenger, type Passenger, type PassengerId } from '@/domain/passenger'
import { loadPassenger, savePassenger } from '@/domain/storage'
import { track } from '@/analytics'
import kuzel from './passengers/kuzel.svg?raw'
import panak from './passengers/panak.svg?raw'
import stromecek from './passengers/stromecek.svg?raw'
import karel from './passengers/karel.svg?raw'
import './passengers/passengers.css'

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

const ART: Record<PassengerId, string> = { kuzel, panak, stromecek, karel }

/** The drawing: our own inline SVG, moved by CSS only (see passengers.css). Decorative. */
export function PassengerPortrait({ id, mood = 'calm', size = 56 }: { id: PassengerId; mood?: Mood; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`sp is-${mood}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: ART[id] }}
    />
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
      <PassengerPortrait id={passenger.id} mood={mood} size={76} />
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
    <section className="mb-4 rounded-card border border-sand-700 bg-white p-5 shadow-[5px_5px_0_var(--color-sand-50)]" aria-labelledby="spolujezdec-title">
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
              current?.id === p.id ? 'border-sand-700 bg-sign-yellow' : 'border-sand-700 bg-sand-950 hover:bg-sand-900'
            }`}
          >
            <PassengerPortrait id={p.id} size={50} />
          </button>
        ))}
        <button
          type="button"
          aria-pressed={!current}
          onClick={() => pick(null)}
          className={`min-h-16 rounded-card border px-1 text-sm text-sand-300 transition-colors ${
            !current ? 'border-sand-700 bg-sign-yellow' : 'border-sand-700 bg-sand-950 hover:bg-sand-900'
          }`}
        >
          Nikdo
        </button>
      </div>
      {current && (
        <div className="mt-4 flex items-start gap-4" data-testid="passenger-card">
          <PassengerPortrait id={current.id} size={112} />
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
