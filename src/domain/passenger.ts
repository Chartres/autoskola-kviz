// Spolujezdec: an optional passenger who comments in the margin, like a gloss in a statute book.
// It only reacts. It never states a rule of the road; the explanation from the law does that
// (a test keeps paragraph signs, speeds and distances out of the lines). Off by default and
// never shown in the mock exam or on first-aid questions.

export type PassengerId = 'kuzel' | 'panak' | 'stromecek' | 'karel'
export type Moment =
  | 'wrong' // a mistake
  | 'tilt' // the third mistake in a row
  | 'streak5'
  | 'streak10'
  | 'passed'
  | 'failed'
  | 'almost' // a mock exam failed by three points or fewer
  | 'perfect' // a set or exam without a single mistake
  | 'corrected' // every mistake of the set put right

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
        'Já jsem taky jednou stál správně. Byl to hezký čtvrtek.',
        'Kdyby za chyby dávali pruhy, jsem zebra.',
        'Tohle nic není. Mě jednou přejel i ten, kdo mě stavěl.',
        'Vedle. Nevadí, já jsem vedle celý život. Vedle silnice.',
        'Klid. Od toho jsem oranžový, aby bylo vidět, že se tu ještě pracuje.',
        'Špatně. Řekl bych to šetrněji, ale jsem z plastu.',
        'Znám ten pocit. Zní jako „dunk“.',
        'Chyby jsou jako já. Stačí je jednou objet a už víš kudy.',
        'Dneska ty, zítra já. Vlastně dneska taky já.',
        'Kolegové z řady vzkazují, že se to stává. Všem sedmi.',
        'Neboj. Do mě už couvali i lidé s řidičákem.',
        'Tohle si zapamatuješ. Já si pamatuju každý nárazník.',
        'Spletl se i bagr. A ten na mě má výhled.',
        'Jedna chyba. Já mám na sobě čtrnáct černých šmouh a každá má příběh.',
        'To nebyla chyba, to byla objížďka. Delší.',
        'Kdybych měl ruce, jednu ti podám. Mám jen podstavec.',
        'Nevěš hlavu. Já ji nemám kam věšet, jsem do špičky.',
        'Tak. Zvedáme se. Ty první, já to mám dál.',
      ],
      tilt: [
        'Třikrát za sebou. Vítej v klubu, ležíme tu všichni.',
        'Tři v řadě. U nás se tomu říká pracovní úsek.',
        'Tolikrát za sebou mě neporazil ani kamion. Ten to stihl najednou.',
      ],
      streak5: [
        'Pět správně za sebou. Takhle rovně mě ještě nikdo neobjel.',
        'Pět. Stojím a nevěřím vlastnímu podstavci.',
        'Pět bez dotyku. Kolegové z řady tleskají. Tiše, jsme z plastu.',
        'Pět v řadě. Skoro jako my na dálnici.',
        'Pětkrát kolem mě a ani škrábnutí. Kdo jsi?',
        'Pět. Začínám si připadat zbytečný. Je to krásný pocit.',
      ],
      streak10: [
        'Deset. Začínám věřit, že zůstanu stát.',
        'Deset za sebou. Tohle už není jízda, to je slalom na jedničku.',
        'Deset. Jestli to takhle půjde dál, sbalí mě a odvezou do skladu.',
        'Deset bez chyby. Dojal bych se, ale nemám čím.',
      ],
      passed: [
        'Je to tam a já pořád stojím. Dobrý den pro nás oba.',
        'Hotovo, čistě. Dneska mě nikdo zvedat nemusí.',
        'Prošlo to. Až pojedeš kolem, zpomal. Budu to já, ten vlevo.',
        'Tak takhle vypadá úsek bez omezení.',
        'Výborně. Uklízím se z cesty, tady už nejsem potřeba.',
        'Je to tam. Řeknu to ostatním kuželům, budou nervózní.',
      ],
      failed: [
        'Dneska to nevyšlo. Zvedni mě, zvednu tebe.',
        'Nevyšlo to. Zítra tu budu stát znovu. Jako vždycky.',
        'Tohle bylo nanečisto. Já jsem nanečisto celý.',
        'Neprošlo to. Práce na silnici taky nikdy neskončí napoprvé.',
        'Dneska ležíme oba. Zítra vstáváme, já v tom mám praxi.',
        'Nevadí. Uzavírka je dočasná. Píšou to na cedulích.',
      ],
      almost: [
        'O fous. Znám to, mě taky vždycky jen líznou.',
        'Těsně. Příště mě objedeš i se zrcátky.',
        'Kousek. Asi tolik, o kolik mě minou ti lepší.',
      ],
      perfect: [
        'Bez jediné chyby. Celou dobu jsem stál. Nevím, co s rukama, které nemám.',
        'Čistá sada. Nikdo se mě ani nedotkl. Chybí mi to? Ne.',
        'Nula chyb. Tohle si napíšu na podstavec.',
        'Bezchybně. Dneska jsem byl jen dekorace.',
      ],
      corrected: [
        'Všechno narovnáno. Mě takhle ještě nikdo nenarovnal.',
        'Chyby postavené zpátky do řady. Hezký pohled.',
        'Opraveno. Kéž by mě někdo taky objel napodruhé.',
        'Srovnáno. Takhle uklizený úsek jsem neviděl od kolaudace.',
        'Opraveno do poslední. Úsek je průjezdný.',
        'Všechno zpátky na místě. I já. Zatím.',
      ],
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
        'Naměřeno: jedna chyba. Poškození: žádné. Záviděl bych, kdybych uměl.',
        'Klid. Mám za sebou stovky nárazů a pořád nevím, kdo řídil.',
        'Chyba. Airbag nevystřelil, takže dobré.',
        'Mně po každém pokusu vymění krk. Tobě stačí zkusit to znovu.',
        'Ve zpomaleném záběru to bylo ještě horší. Viděl jsem záznam.',
        'Špatná odpověď. Mám v hrudi samá čidla a žádné nic necítilo.',
        'To byl jen test. Vím, o čem mluvím. Jsem jen test.',
        'Chyba zaznamenána. Technik kývá hlavou. Dělá to pořád.',
        'Neber si to. Já si nic neberu, nemám kam.',
        'Tady se chybuje zadarmo. Venku to stojí nárazník.',
        'Vedle. Pořád lepší výsledek než moje poslední středa.',
        'Zajímavé. Tuhle chybu jsme v laboratoři ještě neměli.',
        'Nic se nestalo. Poznám to. Mně se obvykle něco stane.',
        'Jsem žlutý, abych byl vidět na záznamu. Tahle odpověď bude vidět taky.',
        'Chyba. Sedím rovně dál. Jinak to neumím.',
        'Tohle nebyl náraz. Tohle bylo ťuknutí. Ťuknutí nepočítáme.',
        'Kdybych mohl mrknout, mrknu. Zkus to znovu.',
        'Pokus číslo další. Jsem připoutaný, můžeme.',
      ],
      tilt: [
        'Třetí náraz v řadě. Začíná to připomínat můj pracovní den.',
        'Tři za sebou. Technici by už svačili.',
        'Série. Doporučuji přestávku. Mně ji dávají na výměnu dílů.',
      ],
      streak5: [
        'Pět bez nárazu. Na to nejsem zvyklý.',
        'Pět správně. Čidla hlásí klid. Podezřelé.',
        'Pět. Technik odložil kleště.',
        'Pět za sebou. Takhle dlouho jsem v jednom kuse nebyl od výroby.',
        'Pět bez chyby. Zeď se ptá, jestli ještě přijedeme.',
        'Pět. Poprvé mám čas prohlédnout si interiér.',
      ],
      streak10: [
        'Deset bez nárazu. Nudím se a jsem za to rád.',
        'Deset. Kdyby tohle uměli všichni, jsem bez práce. Souhlasím s tím.',
        'Deset správně. Sundávám pomyslnou přilbu.',
        'Deset. Záznam z tohohle testu nikdo nebude chtít vidět. To je pochvala.',
      ],
      passed: [
        'Prošlo to. Bez airbagu.',
        'Výsledek: vyhověl. To o mně nikdy nenapsali.',
        'Prošlo to. Pět hvězdiček, kdyby se mě někdo ptal.',
        'Hotovo, celé v jednom kuse. Vzácný pohled.',
        'Splněno. Odepínám si pás. Symbolicky.',
        'Prošlo to. Zeď dnes zůstala bez práce.',
      ],
      failed: [
        'Neprošlo to. Náraz přežit, data sebrána. Zítra znovu.',
        'Nevyhovělo. Mě po takovém dni složí a jedu zas.',
        'Neprošlo to. Dobrá zpráva: karoserie drží.',
        'Dneska ne. Data jsou ale výborná. Přesně víme, co opravit.',
        'Neprošlo. U nás se tomu říká úspěšný test. Něco se zjistilo.',
        'Nevyšlo to. Narovnat, připoutat, jedeme znovu.',
      ],
      almost: [
        'Těsně. Zastavili jsme kousek před zdí. Skoro.',
        'O kousek. Tolik mi obvykle chybí ke zdi. Krátce.',
        'Těsně vedle. Příště ubereme o trochu dřív.',
      ],
      perfect: [
        'Bez chyby. Nemám co hlásit. To se mi ještě nestalo.',
        'Nula nárazů. Dnešní test se ruší pro nedostatek škod.',
        'Čistá sada. Čidla spí.',
        'Bezchybně. Odcházím po svých. Obrazně.',
      ],
      corrected: [
        'Opraveno. Mě po testu taky skládají dohromady.',
        'Všechny díly zpátky na místě. Poznám to, mám v tom praxi.',
        'Opraveno. Kéž by to u mě šlo taky bez šroubováku.',
        'Srovnáno. Technik by řekl „dobrý“ a šel na oběd.',
        'Chyby vyměněny za správné odpovědi. Kus za kus.',
        'Opraveno. Zpátky v továrním stavu.',
      ],
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
        'Já vydržím sedm týdnů. Ta chyba vydrží do konce sady.',
        'Vedle. Zatočili jsme a já to cítil první.',
        'To nic. Mě taky nejdřív nechali v celofánu, abych to nepřehnal.',
        'Špatně, ale provoněně.',
        'Tohle zavánělo. Ne mnou.',
        'Visím tu a nesoudím. Jen se trochu víc houpu.',
        'Chyba. Otevři okýnko, pustíme ji ven.',
        'Každý začíná silně a pak vyčichne. Ty to máš obráceně, to je lepší.',
        'Nevadí. Já taky nevím, proč se jmenuju Oceán.',
        'Zhoupl jsem se. To je u mě maximum rozrušení.',
        'Tohle byla vůně Tělocvična. Jedeme dál.',
        'Klid. Ze zrcátka jsem viděl horší věci. Hlavně na zadním sedadle.',
        'Chyba je jako já. Nejdřív jí je plné auto, pak si zvykneš.',
        'Vedle. Zrcátko říká, že za náma nikdo není. Nikdo to neviděl.',
        'Špatně. Nadechni se. Jsem tu od toho.',
        'Nespěchej. Visím na gumičce a taky nikam neletím.',
        'To se vyvětrá.',
        'Podle vůně soudím, že příště to vyjde.',
      ],
      tilt: [
        'Třetí za sebou. Začíná to tu být cítit. Přidám.',
        'Tři v řadě. Houpu se už i bez zatáček.',
        'Série. Stáhni okýnka, já to tu mezitím srovnám.',
      ],
      streak5: [
        'Pět správně. Voní to tu jako nové auto.',
        'Pět za sebou. Ani jsem se nehnul.',
        'Pět. Tohle je vůně Borovice, plný výkon.',
        'Pět správně. Visím klidně jako v neděli.',
        'Pět. Zrcátko se na tebe dívá s respektem. Já taky, jen z profilu.',
        'Pět v řadě. Voním jako první den.',
      ],
      streak10: [
        'Deset. Lesní směs, plná síla.',
        'Deset za sebou. Tohle už je parfém.',
        'Deset. Kdybych uměl víc než viset, zatleskám.',
        'Deset správně. Auto voní úspěchem. Trochu i mnou.',
      ],
      passed: [
        'Prošlo to. Pověs si mě výš, zasloužím si výhled.',
        'Je to tam. Voní to řidičákem.',
        'Hotovo. Můžeš větrat, já tu vůni podržím.',
        'Prošlo to. Zhoupnu se na oslavu. Jednou.',
        'Výborně. Takhle hezky tu nebylo cítit od první jízdy.',
        'Je to tam. Řekni v autoškole, že stromeček věřil.',
      ],
      failed: [
        'Neprošlo to. Otevři okno, vyvětrej, zkus to znova.',
        'Dneska ne. Já tu visím i zítra.',
        'Nevyšlo to. Vůně Druhý pokus je taky hezká.',
        'Neprošlo. Nic se neděje, já jsem taky už po záruce.',
        'Dneska to nevonělo. Zítra jo.',
        'Nevyšlo to. Zhoupnu se a jedeme dál.',
      ],
      almost: [
        'Těsně. Bylo to cítit už od půlky. Příště to dojedeme.',
        'O kousek. Tolik se houpu v zatáčce.',
        'Skoro. Vůně Skoro je nejprodávanější, ale my chceme tu další.',
      ],
      perfect: [
        'Bez chyby. Ani jednou jsem se nezhoupl.',
        'Čistá sada. Voní to tu jako v autosalonu.',
        'Nula chyb. Dneska jsem tu byl jen na ozdobu. Jako vždycky.',
        'Bezchybně. Tuhle vůni bych prodával.',
      ],
      corrected: [
        'Opraveno. Zase to tu voní.',
        'Všechno vyvětráno. Čistý vzduch, čistá sada.',
        'Opraveno. Cítím se jako čerstvě rozbalený.',
        'Chyby pryč. Zůstal jsem jen já a lehká borovice.',
        'Srovnáno. Můžeš zavřít okýnko.',
        'Opraveno. Tomu říkám osvěžení.',
      ],
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
        'Měl jsem žáka, co tohle spletl sedmkrát. Dneska mě zdraví z kamionu.',
        'Nic neříkám. Jen si píšu. Tužkou, dá se to vygumovat.',
        'Dobře. Tedy špatně. Ale klidně.',
        '(Šlápl na svůj pedál. Ze zvyku.)',
        'To nevadí. Od toho je to nanečisto a já na hodinovou mzdu.',
        'Tuhle chybu znám osobně. Chodí ke mně třicet let.',
        'Podívejte, auto stojí, nikdo nekřičí. Dobrá hodina.',
        'Hm. Zapíšu si to k ostatním. Mám na to sešit. Třetí.',
        'Špatně. Dám si lok a vy si to přečtěte ještě jednou.',
        'Klid, na tohle jsem stavěný. Mám dvojí pedály a žaludek.',
        'Tohle budu vyprávět doma. Beze jména.',
        'Chyba. Sundávám si brýle a zase si je nasazuju. To je celé.',
        'Kdybych měl korunu za každou takovou, mám novější termosku.',
        'Nevzdychám na vás. Vzdychám obecně.',
        'Minule to bylo horší. Minule to byl sloup.',
        'Hm. Ještě jednou a pomalu. Jako když se couvá k babičce na dvůr.',
        'To přijde. U někoho v úterý, u někoho v listopadu.',
        '(Dívá se z okýnka.) Hezky je. Tak znova.',
      ],
      tilt: [
        'Třetí v řadě. Zastavíme, dáme si kafe. Vy nemáte? Tak si dám já.',
        'Tři za sebou. To už není chyba, to je styl. Předěláme ho.',
        'Série. Nevadí, mám dneska čas až do čtyř.',
      ],
      streak5: [
        'Pět za sebou. Odkládám termosku.',
        'Pět. Poprvé dneska nemám nohu nad pedálem.',
        'Pět správně. Neříkám nic. To je u mě pochvala.',
        'Pět v řadě. Skoro jsem se usmál. Skoro.',
        'Pět. Tohle si zapíšu propiskou.',
        'Pět za sebou. Takhle jezdí lidi, co mi pak pošlou pohled.',
      ],
      streak10: [
        'Deset. Sundal jsem nohu z pedálu. Nikomu to neříkejte.',
        'Deset za sebou. Dopil jsem kafe v klidu. To se nestává.',
        'Deset. Kdyby takhle jezdili všichni, jdu do důchodu o pět let dřív.',
        'Deset správně. Ukážu vás příštímu ročníku. Jako příklad, nebojte.',
      ],
      passed: [
        'No vida. Takhle to ukažte i komisaři.',
        'Prošlo to. Dneska vzdychat nebudu. Zkusím to.',
        'Hotovo. Jdu to říct ostatním učitelům, nebudou věřit.',
        'Dobře. Řeknu to jen jednou, tak si to pamatujte: dobře.',
        'Prošlo to. Dolévám si na oslavu. Kafe, jsem ve službě.',
        'Tak. A teď totéž ve čtvrtek ráno před komisařem.',
      ],
      failed: [
        'Dneska ne. Zítra v osm, kafe beru já.',
        'Nevyšlo to. Nevadí, trpělivost mám placenou.',
        'Neprošlo to. Polovina mých nejlepších žáků začínala přesně takhle.',
        'Dneska to nebylo ono. Zítra to bude ono. Mám to v diáři.',
        'Hm. Vyspat, najíst, znova. V tomhle pořadí.',
        'Nevyšlo to. Auto je celé, nikdo neplakal, zbytek doladíme.',
      ],
      almost: [
        'Těsně. To znám, takhle se u nás parkuje.',
        'O kousek. Příště to dotáhneme, chybí tomu jedno kafe.',
        'Skoro. A skoro se u zkoušky nepočítá, tak ještě jednou.',
      ],
      perfect: [
        'Bez chyby. Třicet let učím a pořád mě to překvapí.',
        'Čistá sada. Nemám co říct. Užijte si to, moc často se to nestává.',
        'Nula chyb. Dneska jsem se vezl zadarmo.',
        'Bezchybně. Zavolám domů, že přijdu v dobré náladě.',
      ],
      corrected: [
        'Opraveno. To je celé řemeslo: udělat chybu jen jednou.',
        'Všechno opraveno. Tohle mám na té práci rád.',
        'Tak vidíte. Napodruhé to jde vždycky. Proto máme druhé pedály.',
        'Opraveno. Zavírám sešit.',
        'Srovnáno. Za odměnu vám neřeknu žádnou historku.',
        'Opraveno do poslední. Dopíjím a jedeme dál.',
      ],
    },
  },
]

export function getPassenger(id: string | null | undefined): Passenger | undefined {
  return PASSENGERS.find((p) => p.id === id)
}

function pick(lines: string[], n: number): string {
  return lines[((n % lines.length) + lines.length) % lines.length]
}

/** A stable number for a set, so different sets start at different places in the battery. */
export function seedFor(ids: readonly (string | number)[]): number {
  let h = 0
  for (const id of ids.slice(0, 6)) for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/**
 * What the passenger says after the latest answer, or null to stay quiet. `outcomes` are the
 * answers of this set so far, oldest first, the latest last. A mistake always gets a line: the
 * nth mistake of a set takes the next line of the battery, starting where `seed` puts it, so a
 * set never repeats itself and two sets rarely start alike. The third mistake in a row gets a
 * line of its own. A right answer gets one only at five and at ten in a row. First-aid questions
 * get no remark at all: injuries are not a place for a joke.
 */
export function noteAfterAnswer(p: Passenger, outcomes: boolean[], category?: string, seed = 0): string | null {
  if (!outcomes.length || category === 'Zdravotnická příprava') return null
  let run = 0
  const last = outcomes[outcomes.length - 1]
  for (let i = outcomes.length - 1; i >= 0 && outcomes[i] === last; i--) run++
  if (!last) {
    if (run === 3) return pick(p.lines.tilt, seed)
    const nth = outcomes.filter((ok) => !ok).length - 1
    return pick(p.lines.wrong, seed + nth)
  }
  if (run === 5) return pick(p.lines.streak5, seed)
  if (run === 10) return pick(p.lines.streak10, seed)
  return null
}

export interface ResultKind {
  exam: boolean
  passed?: boolean
  /** Exam only: points scored and points needed. */
  score?: number
  needed?: number
  /** Mistakes in the first attempt. */
  wrong: number
  /** Mistakes put right in the correction round. */
  corrected: number
}

/** Which moment a finished set or exam is. */
export function resultMoment(r: ResultKind): Moment {
  if (r.wrong === 0) return 'perfect'
  if (r.exam) {
    if (r.passed) return 'passed'
    return r.score != null && r.needed != null && r.needed - r.score <= 3 ? 'almost' : 'failed'
  }
  return r.corrected >= r.wrong ? 'corrected' : 'failed'
}

/** One line for the results screen. */
export function noteForResult(p: Passenger, r: ResultKind, seed = 0): string {
  return pick(p.lines[resultMoment(r)], seed)
}
