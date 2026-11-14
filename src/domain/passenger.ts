// Spolujezdec: an optional passenger who comments in the margin, like a gloss in a statute book.
// It only reacts. It never states a rule of the road; the explanation from the law does that
// (a test keeps paragraph signs, speeds and distances out of the lines). Off by default and
// never shown in the mock exam.

export type PassengerId = 'kuzel' | 'panak' | 'stromecek' | 'karel'
export type Moment = 'wrong' | 'streak5' | 'streak10' | 'passed' | 'failed' | 'corrected'

export interface Passenger {
  id: PassengerId
  name: string
  /** Set like a sign plate (Obraz a jméno): what it officially is. */
  plate: string
  /** First-person introduction: one true fact, one attitude, one promise. */
  intro: string
  lines: Record<Moment, string[]>
}

export const PASSENGERS: Passenger[] = [
  {
    id: 'kuzel',
    name: 'Dopravní kužel',
    plate: 'Z 1 · příloha č. 10 vyhlášky č. 294/2015 Sb.',
    intro:
      'Jsem dopravní kužel, úředně značka Z 1. Stojím tam, kde se něco pokazilo, a většinou ležím. Pojedu s tebou. Poraženější než já už nebudeš.',
    lines: {
      wrong: [
        'Nic si z toho nedělej. Mě dneska porazili třikrát.',
        'Pád. Znám. Vstáváme.',
        'To se stane. Mně se to stává profesionálně.',
        'Vedle. Ale stojíš, a to je víc, než můžu říct o sobě.',
        'Lepší tady než na parkovišti. Tam jsem ležel já.',
        'Chyba. Postavím se k ní, ať ji příště objedeš.',
      ],
      streak5: ['Pět správně za sebou. Takhle rovně mě ještě nikdo neobjel.'],
      streak10: ['Deset. Začínám věřit, že zůstanu stát.'],
      passed: ['Je to tam a já pořád stojím. Dobrý den pro nás oba.'],
      failed: ['Dneska to nevyšlo. Zvedni mě, zvednu tebe.'],
      corrected: ['Všechno narovnáno. Mě takhle ještě nikdo nenarovnal.'],
    },
  },
  {
    id: 'panak',
    name: 'Testovací panák',
    plate: 'figurína pro nárazové zkoušky, typ Hybrid III, 78 kg',
    intro:
      'Jsem testovací panák, typ Hybrid III, sedmdesát osm kilo. Do zdi jsem narazil víckrát, než kolikrát ty zaparkuješ. Tady nic nebolí, tak to zkus.',
    lines: {
      wrong: [
        'Špatně. Ale věř mi, tady to nebolí.',
        'Chyba. Zapsáno, vyhodnoceno, jedeme znovu. Tak se to u nás dělá.',
        'Vedle. Zeď by byla horší.',
        'Nevadí. Já se učím jen nárazem. Ty máš i jiné možnosti.',
        'Od toho testy jsou. Aby se to rozbilo tady.',
        'Tohle jsem viděl zblízka. Hodně zblízka.',
      ],
      streak5: ['Pět bez nárazu. Na to nejsem zvyklý.'],
      streak10: ['Deset bez nárazu. Nudím se a jsem za to rád.'],
      passed: ['Prošlo to. Bez airbagu.'],
      failed: ['Neprošlo to. Náraz přežit, data sebrána. Zítra znovu.'],
      corrected: ['Opraveno. Mě po testu taky skládají dohromady.'],
    },
  },
  {
    id: 'stromecek',
    name: 'Vonný stromeček',
    plate: 'osvěžovač vzduchu na zpětné zrcátko, vyrábí se od roku 1952',
    intro:
      'Jsem vonný stromeček. Na zrcátkách visím od roku 1952 a nikam nespěchám. Budu se houpat na okraji a vonět, ať to dopadne jakkoli.',
    lines: {
      wrong: [
        'V klidu. Zítra to bude vonět líp.',
        'Špatně. Mně to nevadí, já tu jen visím.',
        'Tahle odpověď byla Mokrý pes. Příští bude Vanilka.',
        'Houpu se dál. Zkus to znova.',
        'Chyba s vůní nového auta. Ta vyprchá.',
        'Nikam nespěchám. Ty taky nemusíš.',
      ],
      streak5: ['Pět správně. Voní to tu jako nové auto.'],
      streak10: ['Deset. Lesní směs, plná síla.'],
      passed: ['Prošlo to. Pověs si mě výš, zasloužím si výhled.'],
      failed: ['Neprošlo to. Otevři okno, vyvětrej, zkus to znova.'],
      corrected: ['Opraveno. Zase to tu voní.'],
    },
  },
  {
    id: 'karel',
    name: 'Pan Karel',
    plate: 'učitel autoškoly, třicet let praxe, jedna termoska',
    intro:
      'Karel. V autoškole učím třicet let a pedál spolujezdce mám prošlápnutý. Sednu si vedle, naliju si kafe a budu vzdychat. Je to můj způsob, jak chválit.',
    lines: {
      wrong: [
        'Hm. Já bych brzdil. Já jsem brzdil.',
        '(Nalévá si z termosky.) Tak znova.',
        'Tohle mi dělá každý ročník. Vy za to nemůžete. Skoro.',
        'Nevadí. Kafe mám ještě na tři takové.',
        'Vzdychl jsem. To se počítá jako zpětná vazba.',
        'Klid. V roce 2009 to bylo horší a ten kluk dneska jezdí s autobusem.',
      ],
      streak5: ['Pět za sebou. Odkládám termosku.'],
      streak10: ['Deset. Sundal jsem nohu z pedálu. Nikomu to neříkejte.'],
      passed: ['No vida. Takhle to ukažte i komisaři.'],
      failed: ['Dneska ne. Zítra v osm, kafe beru já.'],
      corrected: ['Opraveno. To je celé řemeslo: udělat chybu jen jednou.'],
    },
  },
]

export function getPassenger(id: string | null | undefined): Passenger | undefined {
  return PASSENGERS.find((p) => p.id === id)
}

/**
 * What the passenger says after the latest answer, or null to stay quiet. `outcomes` are the
 * answers of this set so far, oldest first, the latest last. A mistake always gets a line (the
 * nth mistake the nth line, so a set doesn't repeat itself); a right answer only at five and at
 * ten in a row. First-aid questions get no remark at all: injuries are not a place for a joke.
 */
export function noteAfterAnswer(p: Passenger, outcomes: boolean[], category?: string): string | null {
  if (!outcomes.length || category === 'Zdravotnická příprava') return null
  if (!outcomes[outcomes.length - 1]) {
    const nth = outcomes.filter((ok) => !ok).length - 1
    return p.lines.wrong[nth % p.lines.wrong.length]
  }
  let run = 0
  for (let i = outcomes.length - 1; i >= 0 && outcomes[i]; i--) run++
  if (run === 5) return p.lines.streak5[0]
  if (run === 10) return p.lines.streak10[0]
  return null
}

export interface ResultKind {
  exam: boolean
  passed?: boolean
  /** Mistakes in the first attempt. */
  wrong: number
  /** Mistakes put right in the correction round. */
  corrected: number
}

/** One line for the results screen. */
export function noteForResult(p: Passenger, r: ResultKind): string {
  if (r.exam) return (r.passed ? p.lines.passed : p.lines.failed)[0]
  if (r.wrong === 0) return p.lines.passed[0]
  return (r.corrected >= r.wrong ? p.lines.corrected : p.lines.failed)[0]
}
