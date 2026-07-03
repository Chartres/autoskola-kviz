import { useState } from 'react'
import { feedback } from '@/analytics'

// Flywheel feedback widget (datlino pattern). User-initiated → always sends
// (no consent gate). Collapsed by default so it never crowds the results page.
type Ellis = 'very' | 'somewhat' | 'not'

const ELLIS_LABELS: Record<Ellis, string> = {
  very: 'Hodně by mi chybělo',
  somewhat: 'Trochu by mi chybělo',
  not: 'Nechybělo by mi',
}

export function FeedbackCard({ context = 'results' }: { context?: string }) {
  const [open, setOpen] = useState(false)
  const [ellis, setEllis] = useState<Ellis | null>(null)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const canSend = !!ellis || text.trim().length > 0

  function submit() {
    if (!canSend) return
    feedback({
      sean_ellis: ellis ?? undefined,
      text: text.trim() ? `[${context}] ${text.trim()}` : undefined,
    })
    setSent(true)
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-2xl rounded-card border border-sand-700 bg-sand-800/40 px-4 py-3">
      {sent ? (
        <p className="text-sm text-sand-300">Díky! Zpětnou vazbu jsme dostali.</p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-terra-400 hover:underline"
        >
          Máš nápad nebo jsi našel/našla chybu? Napiš nám
        </button>
      ) : (
        <div>
          <p className="text-sm text-sand-300">
            Co by ti pomohlo? Co nefunguje? Píšeš přímo autorovi.
          </p>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-sand-400">
            Kdyby tenhle trenér zítra zmizel…
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['very', 'somewhat', 'not'] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={ellis === key}
                onClick={() => setEllis(ellis === key ? null : key)}
                className={`rounded-card border px-3 py-1.5 text-sm ${
                  ellis === key
                    ? 'border-terra-500 bg-terra-500 text-sand-950'
                    : 'border-sand-600 text-sand-200 hover:border-sand-400'
                }`}
              >
                {ELLIS_LABELS[key]}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Napiš cokoli (volitelné)…"
            aria-label="Zpětná vazba"
            className="mt-3 w-full rounded-card border border-sand-600 bg-sand-900/50 p-2 text-sm text-sand-100 placeholder:text-sand-500"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-card border border-sand-600 px-4 py-1.5 text-sm font-semibold text-sand-200 hover:border-sand-400"
            >
              Zavřít
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={submit}
              className="rounded-card bg-terra-500 px-4 py-1.5 text-sm font-semibold text-sand-950 hover:bg-terra-400 disabled:opacity-50"
            >
              Odeslat
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
