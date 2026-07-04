import { META } from '@/domain/questions'
import { LESSONS } from '@/content/studyGuide'
import { imageUrl } from '@/lib/assets'
import { AuthPanel } from '@/components/AuthPanel'

export function StudyScreen() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-sand-50">
          Studijní průvodce
        </h1>
        <AuthPanel />
      </div>
      <p className="mt-1 text-sm text-sand-400">
        Lekce postupně pokryjí látku všech okruhů zkoušky. Oficiální otázky:{' '}
        <a
          href={META.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-terra-400 underline"
        >
          eTesty Ministerstva dopravy
        </a>
        .
      </p>

      {/* Table of contents */}
      <nav aria-label="Obsah" className="mt-5 rounded-card border border-sand-700 bg-sand-800/40 p-4">
        <h2 className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-sand-400">
          Obsah
        </h2>
        <ol className="space-y-1">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className="text-sm text-sand-300 hover:text-terra-400">
                {l.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {LESSONS.map((l) => (
        <section key={l.id} id={l.id} className="mt-8 scroll-mt-4">
          <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-terra-300">
            {l.title}
          </h2>
          <article className="study-prose" dangerouslySetInnerHTML={{ __html: l.html }} />
          {l.figures && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {l.figures.map((f) => (
                <figure
                  key={f.img}
                  className="overflow-hidden rounded-card border border-sand-700 bg-sand-800/40"
                >
                  <img
                    src={imageUrl(f.img)}
                    alt={f.caption}
                    loading="lazy"
                    className="h-28 w-full bg-white object-contain p-2"
                  />
                  <figcaption className="px-2 py-1.5 text-xs leading-snug text-sand-300">
                    {f.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-sand-800 pt-2 text-xs text-sand-500">
            Zdroj a více informací:{' '}
            <a
              href={l.source.url}
              target="_blank"
              rel="noreferrer"
              className="text-terra-400 underline"
            >
              {l.source.label}
            </a>
          </p>
        </section>
      ))}

      <footer className="mt-10 border-t border-sand-800 pt-4 text-sm text-sand-500">
        Autoškola kvíz je zdarma a bez reklam.{' '}
        <a
          href="https://github.com/sponsors/Chartres"
          target="_blank"
          rel="noreferrer"
          className="text-terra-400 underline"
        >
          Podpořit
        </a>{' '}
        vývoj.
      </footer>
    </div>
  )
}
