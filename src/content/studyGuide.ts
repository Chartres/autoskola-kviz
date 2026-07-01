// Study guide — PLACEHOLDER. Real lessons per okruh come with the official
// question bank (paraphrased from public legal texts: zákon č. 361/2000 Sb.
// and related predpisy; legal texts are úřední díla, outside copyright).

export interface LessonSource {
  label: string
  url: string
}
export interface Figure {
  img: string
  caption: string
}
export interface Lesson {
  id: string
  title: string
  html: string
  source: LessonSource
  /** Captioned question images (the image-based questions) for visual learning. */
  figures?: Figure[]
}

const ZAKON: LessonSource = {
  label: 'Zákon č. 361/2000 Sb., o provozu na pozemních komunikacích',
  url: 'https://www.zakonyprolidi.cz/cs/2000-361',
}
const ETESTY: LessonSource = {
  label: 'Ministerstvo dopravy ČR — eTesty (oficiální zkušební otázky)',
  url: 'https://etesty2.mdcr.cz/',
}

export const LESSONS: Lesson[] = [
  {
    id: 'zkouska',
    title: '1 · Jak zkouška probíhá',
    source: ETESTY,
    html: `
<p>Teoretická zkouška v autoškole je elektronický test z oficiální databáze otázek
Ministerstva dopravy. Test má <strong>25 otázek</strong> vybíraných ze sedmi okruhů
(pravidla provozu, dopravní značky, dopravní situace, zásady bezpečné jízdy,
podmínky provozu vozidel, související předpisy a zdravotnická příprava),
na jeho vyplnění je <strong>30 minut</strong> a otázky jsou bodované —
z 50 možných bodů je k úspěchu potřeba <strong>alespoň 43</strong>.</p>
<p>Nejlepší příprava je projít si všechny okruhy vlastním tempem a nechat chyby
vracet se, dokud nesedí — přesně to tahle aplikace dělá.</p>`,
  },
  {
    id: 'zdroje',
    title: '2 · Kde je látka závazně popsaná',
    source: ZAKON,
    html: `
<p>Závazné znění pravidel je vždy v předpisech samotných, především v
<strong>zákoně č. 361/2000 Sb.</strong> (pravidla provozu) a v prováděcí vyhlášce
o dopravních značkách. Lekce, které látku okruh po okruhu shrnou, sem přibudou
spolu s oficiální bankou otázek.</p>`,
  },
]
