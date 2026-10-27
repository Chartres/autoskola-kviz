// One prerendered page per official question (/otazka/<id>-<slug>/): the question, the official
// answer, why, and the sentence of law it rests on — readable without JavaScript, so search
// engines and AI assistants can quote it with its source. Used by prerender.mjs; tested in
// src/seo/questionPages.test.ts. Labels and links must match src/domain/explanations.ts.

const LAWS = {
  '361/2000 Sb.': { kind: 'zákona', url: 'https://www.zakonyprolidi.cz/cs/2000-361', name: 'Zákon č. 361/2000 Sb., o provozu na pozemních komunikacích' },
  '294/2015 Sb.': { kind: 'vyhláška', url: 'https://www.zakonyprolidi.cz/cs/2015-294', name: 'Vyhláška č. 294/2015 Sb., kterou se provádějí pravidla provozu na pozemních komunikacích' },
  '56/2001 Sb.': { kind: 'zákona', url: 'https://www.zakonyprolidi.cz/cs/2001-56', name: 'Zákon č. 56/2001 Sb., o podmínkách provozu vozidel na pozemních komunikacích' },
  '247/2000 Sb.': { kind: 'zákona', url: 'https://www.zakonyprolidi.cz/cs/2000-247', name: 'Zákon č. 247/2000 Sb., o získávání a zdokonalování odborné způsobilosti k řízení motorových vozidel' },
}

export function sourceLabel(s) {
  const law = LAWS[s.law]
  if (s.anchor.startsWith('sign-') || law?.kind === 'vyhláška') {
    return s.ref.startsWith('§') ? `${s.ref} vyhlášky č. ${s.law}` : `vyhláška č. ${s.law}, ${s.ref}`
  }
  return `${s.ref} zákona č. ${s.law}`
}

export function sourceUrl(s) {
  const base = LAWS[s.law]?.url ?? 'https://www.zakonyprolidi.cz/'
  return s.anchor.startsWith('sign-') ? base : `${base}#${s.anchor}`
}

export const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

/** "Chodec vstupující na přechod:" → "chodec-vstupujici-na-prechod" (≤ 60 chars, whole words). */
export function slugify(text) {
  const words = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  let out = ''
  for (const w of words) {
    const next = out ? `${out}-${w}` : w
    if (next.length > 60) break
    out = next
  }
  return out || words[0]?.slice(0, 60) || 'otazka'
}

export const questionPath = (q) => `/otazka/${q.id}-${slugify(q.q)}/`

const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`)
const OPTIONS = ['a', 'b', 'c']

/**
 * @param q   question from data/questions.json
 * @param e   its explanation from data/explanations.json
 * @param ctx { origin, topicSlug, prev?, next? } — prev/next are questions in the same okruh
 */
export function questionPage(q, e, ctx) {
  const { origin, topicSlug } = ctx
  const url = `${origin}${questionPath(q)}`
  const correct = q[q.correct] ?? `možnost ${q.correct.toUpperCase()}`
  const stem = q.q.replace(/[:\s]+$/, '')
  const title = `${clip(`${stem}: ${correct}`, 95)} | Autoškola kvíz (${q.id})`
  const description = clip(`Správná odpověď: ${correct} ${e.why}`, 160)
  const media = (name) => `${origin}/media/${name}`

  const options = OPTIONS.filter((o) => q[o] !== null && q[o] !== undefined)
    .map((o) => {
      const right = o === q.correct
      const img = q[`${o}Img`] ? `<img src="${media(q[`${o}Img`])}" alt="Možnost ${o.toUpperCase()}" loading="lazy" class="max-h-24 w-auto rounded-[2px] bg-white p-1" />` : ''
      return `
          <li class="mt-2 rounded-card border ${right ? 'border-moss-500 text-sand-50' : 'border-sand-700 text-sand-400'} px-4 py-3"><span class="font-mono text-xs uppercase">${o}</span> ${img}${esc(q[o] ?? '')}${right ? ' <strong class="ml-1 whitespace-nowrap text-xs text-moss-400">✓ Správná odpověď</strong>' : ''}</li>`
    })
    .join('')

  const sources = e.sources
    .map(
      (s) => `
          <figure class="mt-3">
            <blockquote class="italic text-sand-300">„${esc(s.quote)}“</blockquote>
            <figcaption class="mt-1"><a class="font-mono text-xs text-terra-400 hover:underline" href="${sourceUrl(s)}">${esc(sourceLabel(s))}</a></figcaption>
          </figure>`,
    )
    .join('')

  const pic = q.image
    ? `
        <figure class="mt-4 flex min-h-64 items-center justify-center rounded-card border border-sand-700 bg-white p-4">
          <img src="${media(q.image)}" alt="${esc(e.sign ? `Značka ${e.sign.code} ${e.sign.name}` : `Obrázek k otázce ${q.id}`)}" class="max-h-56 w-auto object-contain" />
        </figure>${e.sign ? `
        <p class="mt-2 text-sm"><span class="font-mono text-xs text-terra-300">${esc(e.sign.code)}</span> <span class="text-sand-300">${esc(e.sign.name)}</span></p>` : ''}${q.video ? `
        <p class="mt-2 font-mono text-xs text-sand-500">U zkoušky je tato otázka animace; v aplikaci si ji přehrajete.</p>` : ''}`
    : ''

  const nav = [
    ctx.prev ? `<a class="text-terra-400 hover:underline" href="${origin}${questionPath(ctx.prev)}">← Předchozí otázka</a>` : '',
    ctx.next ? `<a class="text-terra-400 hover:underline" href="${origin}${questionPath(ctx.next)}">Další otázka →</a>` : '',
  ].filter(Boolean).join(' · ')

  const body = `
      <article class="mx-auto w-full max-w-xl px-4 py-6">
        <p class="font-mono text-xs uppercase tracking-[0.15em] text-sand-500"><a class="hover:underline" href="${origin}/okruh/${topicSlug}/">${esc(q.cat)}</a> · otázka ${q.id} · ${q.points} ${q.points === 1 ? 'bod' : 'body'}</p>
        <h1 class="mt-2 font-display text-xl font-bold text-sand-50">${esc(q.q)}</h1>${pic}
        <ol class="mt-4 list-none p-0">${options}
        </ol>
        <section class="mt-5 border-l-2 border-sand-600 pl-4" aria-label="Proč">
          <h2 class="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-sand-500">Proč</h2>
          <p class="mt-1 text-sand-200">${esc(e.why)}</p>${e.flag ? `
          <p class="mt-2 text-sm text-terra-300">Pozor, oficiální odpověď je starší než dnešní stav: ${esc(e.flag)}</p>` : ''}${sources}
        </section>
        <p class="mt-6 text-sand-300"><a class="text-terra-400 hover:underline" href="${origin}/okruh/${topicSlug}/">Procvičit okruh ${esc(q.cat)} zdarma</a> — oficiální otázky Ministerstva dopravy, bez reklam a bez registrace.</p>${nav ? `
        <p class="mt-3 text-sm">${nav}</p>` : ''}
      </article>
`

  const citation = e.sources.map((s) => ({
    '@type': 'Legislation',
    name: LAWS[s.law]?.name ?? s.law,
    legislationIdentifier: s.law,
    url: sourceUrl(s),
  }))
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    url,
    inLanguage: 'cs',
    mainEntity: {
      '@type': 'Question',
      name: q.q,
      text: q.q,
      answerCount: 1,
      acceptedAnswer: { '@type': 'Answer', text: `${correct} ${e.why}`, url, ...(citation.length ? { citation } : {}) },
    },
  })

  return { url, title, description, body, jsonld }
}

/** The mock-exam guide (/zkouska-nanecisto/): the real exam format, from data/meta.json. */
export function examGuidePage(meta, { origin }) {
  const e = meta.exam
  const url = `${origin}/zkouska-nanecisto/`
  const rows = e.composition
    .map((c) => {
      const pts = c.count * c.pointsPerQuestion
      return `
          <tr><td class="py-1 pr-3">${esc(c.categories.join(', '))}</td><td class="py-1 pr-3 text-right">${c.count}</td><td class="py-1 pr-3 text-right">${c.pointsPerQuestion}</td><td class="py-1 text-right">${pts}</td></tr>`
    })
    .join('')
  const situace = e.composition.find((c) => c.categories.includes('Dopravní situace'))
  const faq = [
    ['Kolik otázek má zkouška z teorie a kolik je na ni času?',
      `Test má ${e.totalQuestions} otázek z ${e.composition.length} okruhů a na jeho vyplnění je ${e.timeLimitMinutes} minut.`],
    ['Kolik bodů je potřeba k úspěchu?',
      `Za správné odpovědi lze získat nejvýše ${e.maxPoints} bodů; uspěje, kdo získá alespoň ${e.passThreshold}. Prostor pro chyby je tedy ${e.maxPoints - e.passThreshold} bodů.`],
    ['Které otázky mají nejvíc bodů?',
      `Dopravní situace: ${situace.count} otázky po ${situace.pointsPerQuestion} bodech. Jedna chyba v situaci stojí ${situace.pointsPerQuestion} body, dvě chyby v situacích znamenají neúspěch.`],
    ['Jsou otázky v testu nanečisto stejné jako u zkoušky?',
      'Ano. Jde o oficiální zkušební otázky Ministerstva dopravy (eTesty) v doslovném znění, včetně animovaných dopravních situací, a test se skládá podle stejného klíče jako u zkoušky.'],
    ['Proč je správná odpověď správná?',
      'U každé otázky je vysvětlení a citace ustanovení zákona č. 361/2000 Sb. nebo vyhlášky č. 294/2015 Sb., ze kterého odpověď vychází.'],
  ]
  const body = `
      <article class="mx-auto w-full max-w-xl px-4 py-6">
        <h1 class="font-display text-2xl font-bold tracking-tight text-sand-50">Zkušební test jak u zkoušky — zdarma</h1>
        <p class="mt-3 text-sand-300">Test nanečisto ve stejném formátu jako teoretická zkouška v autoškole (skupina B): ${e.totalQuestions} otázek, ${e.timeLimitMinutes} minut, ${e.maxPoints} bodů, k úspěchu ${e.passThreshold}. Oficiální otázky Ministerstva dopravy, bez reklam a bez registrace.</p>
        <p class="mt-3"><a class="text-terra-400 hover:underline" href="${url}">Spustit zkušební test</a></p>
        <h2 class="mt-6 font-display text-lg font-semibold text-sand-50">Složení testu</h2>
        <table class="mt-2 w-full text-sm text-sand-300">
          <thead><tr><th class="py-1 pr-3 text-left">Okruh</th><th class="py-1 pr-3 text-right">Otázek</th><th class="py-1 pr-3 text-right">Bodů za otázku</th><th class="py-1 text-right">Celkem</th></tr></thead>
          <tbody>${rows}
          </tbody>
        </table>
        <h2 class="mt-6 font-display text-lg font-semibold text-sand-50">Časté otázky</h2>
        <dl class="mt-2 text-sand-300">${faq.map(([q, a]) => `
          <dt class="mt-3 font-semibold text-sand-100">${esc(q)}</dt>
          <dd>${esc(a)}</dd>`).join('')}
        </dl>
      </article>
`
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  })
  return {
    url,
    title: `Zkušební test z autoškoly jak u zkoušky — ${e.totalQuestions} otázek, ${e.timeLimitMinutes} minut | Autoškola kvíz`,
    description: `Test nanečisto zdarma: ${e.totalQuestions} oficiálních otázek, ${e.timeLimitMinutes} minut, k úspěchu ${e.passThreshold} z ${e.maxPoints} bodů. Bodování podle okruhů, vysvětlení s citací zákona.`,
    body,
    jsonld,
  }
}
