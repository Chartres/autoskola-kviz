// Post-build prerender: one static, crawlable HTML page per okruh
// (/okruh/<slug>/) + sitemap.xml. No SSR framework — the pages are copies of
// the built index.html with topic-specific <title>/meta/#root content; the app
// bundle boots on top and starts that topic's practice (see AppContext).
// Usage: node scripts/prerender.mjs   (after `vite build`)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const ORIGIN = 'https://autoskola.dravec.org'
const topics = JSON.parse(readFileSync(`${root}data/topics.json`, 'utf8'))
const meta = JSON.parse(readFileSync(`${root}data/meta.json`, 'utf8'))
const template = readFileSync(`${root}dist/index.html`, 'utf8')

const countFor = (category) =>
  meta.categories.find((c) => c.name === category).count

const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

for (const t of topics) {
  const fill = (s) => s.replaceAll('{count}', String(countFor(t.category)))
  const url = `${ORIGIN}/okruh/${t.slug}/`
  const others = topics.filter((o) => o.slug !== t.slug)
  const body = `
      <div class="mx-auto w-full max-w-xl px-4 py-6">
        <h1 class="font-display text-2xl font-bold tracking-tight text-sand-50">${esc(fill(t.h1))}</h1>
        <p class="mt-3 text-sand-300">${esc(fill(t.intro))}</p>
        <p class="mt-3 text-sand-300"><a class="text-terra-400 hover:underline" href="${url}">Spustit test zdarma</a> — bez reklam a bez registrace, funguje offline i na mobilu.</p>
        <h2 class="mt-6 font-display text-lg font-semibold text-sand-50">Časté otázky</h2>
        <dl class="mt-2 text-sand-300">${t.faq
          .map(
            (f) => `
          <dt class="mt-3 font-semibold text-sand-100">${esc(fill(f.q))}</dt>
          <dd>${esc(fill(f.a))}</dd>`,
          )
          .join('')}
        </dl>
        <h2 class="mt-6 font-display text-lg font-semibold text-sand-50">Další okruhy</h2>
        <ul class="mt-2 text-sand-300">
          <li><a class="text-terra-400 hover:underline" href="${ORIGIN}/">Všechny testy autoškoly zdarma</a></li>${others
            .map(
              (o) => `
          <li><a class="text-terra-400 hover:underline" href="${ORIGIN}/okruh/${o.slug}/">${esc(o.category)}</a></li>`,
            )
            .join('')}
        </ul>
      </div>
`
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(fill(t.title))}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${esc(fill(t.description))}$2`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${url}" />`,
    )
    .replace(/<!--seo-->[\s\S]*<!--\/seo-->/, `<!--seo-->${body}<!--/seo-->`)
  mkdirSync(`${root}dist/okruh/${t.slug}`, { recursive: true })
  writeFileSync(`${root}dist/okruh/${t.slug}/index.html`, html)
}

const today = new Date().toISOString().slice(0, 10)
const urls = ['/', ...topics.map((t) => `/okruh/${t.slug}/`)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(`${root}dist/sitemap.xml`, sitemap)
console.log(`prerendered ${topics.length} topic pages + sitemap.xml`)
