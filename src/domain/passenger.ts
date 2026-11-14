// Spolujezdec: an optional passenger who comments in the margin, like a gloss in a statute book.
// It only reacts. It never states a rule of the road; the explanation from the law does that
// (a test keeps paragraph signs, speeds and distances out of the lines). Off by default and
// never shown in the mock exam or on first-aid questions.

export type PassengerId = "kuzel" | "panak" | "stromecek" | "karel";
export type Moment =
  | "wrong" // a mistake
  | "tilt" // the third mistake in a row
  | "streak5"
  | "streak10"
  | "passed"
  | "failed"
  | "almost" // a mock exam failed by three points or fewer
  | "perfect" // a set or exam without a single mistake
  | "corrected"; // every mistake of the set put right

export interface Passenger {
  id: PassengerId;
  name: string;
  /** Set like a sign plate (Obraz a jméno): what it officially is. */
  plate: string;
  /** First-person introduction: one true fact, one attitude, one promise. */
  intro: string;
  lines: Record<Moment, string[]>;
}

export const PASSENGERS: Passenger[] = [
  {
    id: "kuzel",
    name: "Dopravní kužel",
    plate: "Z 1 · příloha č. 10 vyhlášky č. 294/2015 Sb.",
    intro:
      "Jsem dopravní kužel, úředně značka Z 1. Stojím tam, kde se něco pokazilo, a většinou ležím. Pojedu s tebou. Poraženější než já už nebudeš.",
    lines: {
      wrong: [
        "Nic si z toho nedělej. Mě dneska porazili třikrát.",
        "Stál jsem devět let na D1. Tohle přečkáme taky.",
        "Mně se to stává profesionálně.",
        "Do mě už couvali i lidé s řidičákem. Dlouholetým.",
        "Jednou mě odnesli na kolej. Rok jsem dělal noční stolek. I odtamtud jsem se vrátil.",
        "V noci nás skládají na sebe. Jsem třetí odspoda. Tohle je proti tomu pohoda.",
        "Pamatuju si každý nárazník. Tvůj mezi nimi zatím není.",
        "Spletl se i bagr. A ten na mě má výhled.",
        "Mám na sobě čtrnáct šmouh a každou umím jmenovat. Tahle se jmenuje Octavia.",
        "Jednou mě měl student celou noc na hlavě. Byl jsem nejvyšší na večírku.",
        "Kdybych měl ruce, jednu ti podám. Mám podstavec. Je taky tvůj.",
        "Znám ten zvuk. „Dunk.“ U tebe to bylo potichu, toho si cením.",
        "Tohle se na stavbě stává ještě před svačinou.",
        "Reflexní pruh mám, aby mě bylo vidět. Tu chybu bylo vidět i bez něj.",
        "Dneska ty, zítra já. Vlastně dneska taky já.",
        "Zvedneme se. Ty první, já to mám složitější.",
        "Jsem z recyklovaného plastu. Dřív jsem byl přepravka. Každý začínal někde jinde.",
        "Postavím se k té otázce. Příště bude vidět zdálky.",
        "Řidiči mě míjejí o centimetry a tváří se, že to tak chtěli. Ty to aspoň přiznáš.",
        "Omlouváme se za dočasné omezení. Píšou to na cedule, tak to říkám taky.",
        "Lepší tady než na parkovišti u obchodu. Tam se po mně ani neohlédnou.",
        "Sedm kolegů v řadě a trefili zrovna mě. Znám ten pocit výjimečnosti.",
        "Chyba. Zapíšu si ji mezi šmouhy.",
        "Jednou mě přejel ten, kdo mě ráno stavěl. Odpoledne mě postavil znovu. Tak se to dělá.",
      ],
      tilt: [
        "Třikrát za sebou. Takhle vypadá úsek, kam nás vozí po paletách.",
        "Tři v řadě. Kamion to umí jedním tahem, ty poctivě po jednom.",
        "Třetí. Zavolám kolegy, uděláme kolem toho uzavírku.",
      ],
      streak5: [
        "Pět správně. Takhle rovně mě ještě neobjeli.",
        "Pět bez dotyku. Kolegové tleskají. Tiše, jsme z plastu.",
        "Pětkrát kolem mě a žádná šmouha. Kdo jsi?",
        "Pět. Stojím. Zapisuju si datum.",
        "Pět v řadě. Začínám být zbytečný a je to příjemné.",
        "Pět správně. Na D1 by tě chtěli.",
      ],
      streak10: [
        "Deset. Jestli to takhle půjde dál, odvezou mě do skladu.",
        "Deset za sebou. Slalom na jedničku a já jsem branka.",
        "Deset bez chyby. Dojal bych se, ale nemám čím.",
        "Deset. Takhle dlouho jsem vestoje vydržel naposled ve skladu.",
      ],
      passed: [
        "Je to tam a já pořád stojím. Dobrý den pro nás oba.",
        "Hotovo. Dneska mě zvedat nemusíš.",
        "Až pojedeš kolem stavby, zpomal. Ten vlevo budu já.",
        "Úsek bez omezení. Hezká slova, málokdy je slyším.",
        "Sklízím se z cesty. Tady už nejsem potřeba.",
        "Řeknu to ostatním kuželům. Budou nervózní.",
      ],
      failed: [
        "Dneska to nevyšlo. Zvedni mě, zvednu tebe.",
        "Zítra tu budu stát znovu. Mám to v popisu práce.",
        "Silnice se taky neopraví napoprvé. Zeptej se D1.",
        "Dneska ležíme oba. Zítra vstáváme, já v tom mám praxi.",
        "Uzavírka je dočasná. Píšou to na cedulích a občas je to pravda.",
        "Byl to zkušební úsek. Proto tu stojím já. Komisař má službu jindy.",
      ],
      almost: [
        "O fous. Mě taky obvykle jen líznou.",
        "Těsně. Příště mě mineš i se zrcátkem.",
        "Kousek. Tolik chybí řidičům, kteří mě „skoro neviděli“.",
      ],
      perfect: [
        "Bez jediné chyby. Celou dobu jsem stál a nevěděl, co s rukama, které nemám.",
        "Čistá sada. Ani šmouha. Chybí mi to? Ne.",
        "Nula chyb. Napíšu si to fixou na podstavec.",
        "Dneska jsem byl jen dekorace. Sluší mi to.",
      ],
      corrected: [
        "Všechno narovnáno. Mě takhle ještě nenarovnali.",
        "Chyby stojí zpátky v řadě. Hezký pohled.",
        "Opraveno. Kéž by mě taky někdo objel napodruhé.",
        "Takhle uklizený úsek jsem neviděl od kolaudace.",
        "Úsek je průjezdný. Sundávám ceduli.",
        "Všechno zpátky na místě. I já. Zatím.",
      ],
    },
  },
  {
    id: "panak",
    name: "Testovací panák",
    plate: "figurína pro nárazové zkoušky, typ Hybrid III, 78 kg",
    intro:
      "Jsem testovací panák, typ Hybrid III, sedmdesát osm kilo. Do zdi jsem narazil víckrát, než kolikrát ty zaparkuješ. Tady nic nebolí, tak to zkus.",
    lines: {
      wrong: [
        "Špatně. Ale věř mi, tady to nebolí.",
        "Zapsáno, vyhodnoceno, jedeme znovu. Po mně ještě zametají.",
        "Zeď by byla horší. Znám ji osobně.",
        "Já se učím jen nárazem. Ty máš i jiné možnosti.",
        "Od toho testy jsou. Aby se to rozbilo tady.",
        "Viděl jsem to zblízka. Tak na čtyři centimetry.",
        "Jedna chyba, žádné poškození. Technik Luboš je zklamaný, přišel zbytečně.",
        "Mám za sebou stovky nárazů a pořád nevím, kdo řídil.",
        "Airbag nevystřelil. Beru to jako dobrý den.",
        "Mně po každém pokusu mění krk. Tobě stačí kliknout znovu.",
        "Kamera to natočila tisíckrát za vteřinu. Bude to dlouhé promítání.",
        "Mám v hrudi čidla. Žádné se neozvalo. Jsou zvyklá na víc.",
        "Byl to jen test. Vím, o čem mluvím, já jsem taky jen test.",
        "Technik kývá hlavou. Dělá to od roku 2011.",
        "Tady se chybuje zadarmo. Venku to stojí nárazník a odpoledne na pojišťovně.",
        "Pořád lepší než moje poslední středa.",
        "Zajímavé. Tuhle chybu v laboratoři ještě nemáme. Pošlu ji kolegům.",
        "Nic se nestalo. Poznám to, mně se obvykle něco stane.",
        "Jsem žlutý, abych byl vidět na záznamu. Tahle odpověď bude vidět taky.",
        "Sedím rovně dál. Jinak to neumím.",
        "Tohle bylo ťuknutí. Na ťuknutí nás ani nevozí.",
        "Kdybych mohl mrknout, mrknu. Máš aspoň můj upřený pohled.",
        "Další pokus. Jsem připoutaný, to já bývám.",
        "Na čele mám terč. Trefuješ se líp než většina aut.",
      ],
      tilt: [
        "Třetí náraz v řadě. Začíná to připomínat můj pracovní den.",
        "Tři za sebou. Technici by teď šli na svačinu. Doporučuju.",
        "Série. U nás se po třech nárazech mění díly. Tobě stačí voda.",
      ],
      streak5: [
        "Pět bez nárazu. Na to nejsem zvyklý.",
        "Pět správně. Čidla hlásí klid. Je to podezřelé.",
        "Pět. Technik Luboš odložil kleště a vytáhl svačinu.",
        "Pět za sebou. Takhle dlouho jsem v jednom kuse nebyl od výroby.",
        "Pět. Zeď se ptá, jestli ještě přijedeme.",
        "Pět. Poprvé mám čas prohlédnout si palubní desku. Je hezká.",
      ],
      streak10: [
        "Deset bez nárazu. Nudím se a jsem za to rád.",
        "Deset. Kdyby takhle jezdili všichni, jsem bez práce. Jsem pro.",
        "Deset. Kamery vypnuli, není co točit.",
        "Deset správně. Tenhle záznam si nepustí ani Luboš. Myslím to jako pochvalu.",
      ],
      passed: [
        "Prošlo to. Bez airbagu.",
        "Výsledek „vyhověl“. O mně to ještě nenapsali.",
        "Pět hvězdiček. Mě se neptají, ale dal bych je.",
        "Celé v jednom kuse. V naší hale vzácný pohled.",
        "Odepínám si pás. Symbolicky, ruce mi tam nedosáhnou.",
        "Zeď dnes zůstala bez práce.",
      ],
      failed: [
        "Neprošlo to. Náraz přežit, data sebrána, zítra znovu.",
        "Mě po takovém dni složí do bedny a ráno jedu zas.",
        "Karoserie drží. S tím se dá pracovat.",
        "Data jsou výborná. Přesně víme, co opravit.",
        "U nás se tomu říká úspěšný test. Něco se zjistilo.",
        "Narovnat, připoutat, znovu. Tak zní celý můj životopis.",
      ],
      almost: [
        "Zastavili jsme kousek před zdí. Skoro.",
        "Chybělo málo. Asi tolik, kolik mně chybí ke zdi ve druhé vteřině.",
        "Těsně. Příště ubereme o trochu dřív.",
      ],
      perfect: [
        "Bez chyby. Nemám co hlásit. To se mi ještě nestalo.",
        "Nula nárazů. Test se ruší pro nedostatek škod.",
        "Čistá sada. Čidla usnula.",
        "Odcházím po svých. Obrazně, ponesou mě.",
      ],
      corrected: [
        "Opraveno. Mě po testu taky skládají dohromady.",
        "Všechny díly zpátky na místě. Mám v tom praxi.",
        "Kéž by to u mě šlo taky bez šroubováku.",
        "Luboš by řekl „dobrý“ a šel na oběd.",
        "Chyby vyměněny kus za kus. Záruka dva roky.",
        "Zpátky v továrním stavu.",
      ],
    },
  },
  {
    id: "stromecek",
    name: "Vonný stromeček",
    plate: "osvěžovač vzduchu na zpětné zrcátko, vyrábí se od roku 1952",
    intro:
      "Jsem vonný stromeček. Na zrcátkách visím od roku 1952 a nikam nespěchám. Budu se houpat na okraji a vonět, ať to dopadne jakkoli.",
    lines: {
      wrong: [
        "V klidu. Zítra to bude vonět líp.",
        "Mně to nevadí. Já tu jen visím.",
        "Tahle odpověď byla Mokrý pes. Příští bude Vanilka.",
        "Zhoupl jsem se. Větší rozrušení u mě neuvidíš.",
        "Vůně nového auta taky vyprchá. Tahle chyba dřív.",
        "Nespěchej. Visím na gumičce a taky nikam neletím.",
        "Já vydržím sedm týdnů. Ta chyba vydrží do konce sady.",
        "Zatočili jsme. Poznám to první, jsem na to zavěšený.",
        "Mě první týden nechali v celofánu, abych to nepřehnal. Pomalý začátek je v pořádku.",
        "Tohle zavánělo. Mnou ne, já jsem Borovice.",
        "Visím tu a nesoudím. Od souzení je zrcátko.",
        "Otevři okýnko. Pustíme ji ven.",
        "Každý začíná silně a pak vyčichne. Ty to máš obráceně, to je lepší pořadí.",
        "Jmenuju se Oceán a moře jsem neviděl. Taky nevím všechno.",
        "Tohle byla vůně Tělocvična. Jedeme dál.",
        "Ze zrcátka jsem viděl horší věci. Většinou na zadním sedadle.",
        "Chyba je jako já první den. Je jí plné auto a za týden o ní nevíš.",
        "Zrcátko říká, že za námi nikdo nejede. Zůstane to mezi námi třemi.",
        "Nadechni se. Od toho tu jsem.",
        "To se vyvětrá.",
        "V létě mě nechávají v autě na slunci. Zeptej se mě na trpělivost.",
        "Minulý majitel mě vyměnil za plyšové kostky. Přežil jsem to. Tohle přežiješ taky.",
        "Podle vůně soudím, že příště to vyjde.",
        "Houpu se dál. Zkus to taky, pomáhá to.",
      ],
      tilt: [
        "Třetí za sebou. Začíná to tu být cítit. Přidávám.",
        "Tři v řadě. Houpu se už i na rovince.",
        "Stáhni okýnka. Já to tu mezitím provoním.",
      ],
      streak5: [
        "Pět správně. Voní to tu jako nové auto.",
        "Pět za sebou. Ani jsem se nehnul.",
        "Pět. Borovice, plný výkon.",
        "Pět správně. Visím klidně jako v neděli na parkovišti.",
        "Pět. Zrcátko se na tebe dívá s respektem. Já z profilu.",
        "Pět v řadě. Voním jako první den.",
      ],
      streak10: [
        "Deset. Lesní směs, plná síla.",
        "Deset za sebou. Tohle už je parfém.",
        "Deset. Umím jen viset, tak visím slavnostně.",
        "Deset správně. Auto voní úspěchem a trochu mnou.",
      ],
      passed: [
        "Prošlo to. Pověs si mě výš, zasloužím si výhled.",
        "Voní to řidičákem.",
        "Můžeš větrat. Tuhle vůni tu podržím.",
        "Zhoupnu se na oslavu. Jednou, nepřeháním to.",
        "Takhle hezky tu nebylo cítit od první jízdy.",
        "Řekni v autoškole, že stromeček věřil.",
      ],
      failed: [
        "Neprošlo to. Otevři okno, vyvětrej, zkus to znova.",
        "Já tu visím i zítra.",
        "Vůně Druhý pokus je taky hezká. Prodává se líp než První.",
        "Já jsem taky po záruce a pořád visím.",
        "Dneska to nevonělo. Zítra jo.",
        "Zhoupnu se a jedeme dál.",
      ],
      almost: [
        "Těsně. Bylo to cítit už od půlky.",
        "Kousek. Tolik se zhoupnu v zatáčce.",
        "Vůně Skoro se prodává nejvíc. My chceme tu vedle v regálu.",
      ],
      perfect: [
        "Bez chyby. Ani jednou jsem se nezhoupl.",
        "Voní to tu jako v autosalonu.",
        "Nula chyb. Byl jsem tu na ozdobu. Jako obvykle.",
        "Tuhle vůni bych prodával.",
      ],
      corrected: [
        "Opraveno. Zase to tu voní.",
        "Vyvětráno. Čistý vzduch, čistá sada.",
        "Cítím se jako čerstvě rozbalený.",
        "Chyby pryč. Zůstal jsem já a lehká borovice.",
        "Můžeš zavřít okýnko.",
        "Tomu říkám osvěžení.",
      ],
    },
  },
  {
    id: "karel",
    name: "Pan Karel",
    plate: "učitel autoškoly, třicet let praxe, jedna termoska",
    intro:
      "Karel. V autoškole učím třicet let a pedál spolujezdce mám prošlápnutý. Sednu si vedle, naliju si kafe a budu vzdychat. Je to můj způsob, jak chválit.",
    lines: {
      wrong: [
        "Hm. Já bych brzdil. Já jsem brzdil.",
        "(Nalévá si z termosky.) Tak znova.",
        "Tohle mi dělá každý ročník. Vy za to nemůžete. Skoro.",
        "Kafe mám ještě na tři takové.",
        "Vzdychl jsem. Berte to jako zpětnou vazbu.",
        "V roce 2009 to bylo horší. Ten kluk dnes jezdí s autobusem a zdraví mě.",
        "Měl jsem žačku, co tohle spletla sedmkrát. Dnes jezdí se sanitkou.",
        "Píšu si to. Tužkou, dá se to vygumovat.",
        "Dobře. Tedy špatně. Ale v klidu.",
        "(Šlápl na svůj pedál. Ze zvyku.)",
        "Od toho je to nanečisto. Já jsem tu na hodinovou mzdu, mně se to vyplatí.",
        "Tuhle chybu znám osobně. Chodí ke mně třicet let a pořád nemá řidičák.",
        "Auto stojí, střecha drží, cedule svítí. Dobrá hodina.",
        "Zapíšu si to do sešitu. Je to třetí sešit.",
        "Dám si lok a vy si to přečtěte ještě jednou.",
        "Mám dvojí pedály a silný žaludek. Pokračujte.",
        "Tohle budu vyprávět doma. Beze jména, Jarmila by se vyptávala.",
        "Sundávám si brýle a zase si je nasazuju. Víc se nestane.",
        "Kdybych měl korunu za každou takovou, mám novější termosku.",
        "Nevzdychám na vás. Vzdychám obecně.",
        "Minule to byl sloup. Tohle je jen otázka.",
        "Ještě jednou a pomalu. Jako když couváte babičce na dvůr.",
        "To přijde. U někoho v úterý, u někoho v listopadu.",
        "(Dívá se z okýnka.) Hezky je. Tak znova.",
      ],
      tilt: [
        "Třetí v řadě. Zastavíme a dáme si kafe. Vy nemáte? Tak si dám já.",
        "Tři za sebou. Zaparkujeme to a začneme znovu od zrcátek.",
        "Mám dneska čas do čtyř. Pak mám řízek.",
      ],
      streak5: [
        "Pět za sebou. Odkládám termosku.",
        "Pět. Poprvé dnes nemám nohu nad pedálem.",
        "Pět správně. Mlčím. U mě je to pochvala.",
        "Pět v řadě. Skoro jsem se usmál.",
        "Pět. Tohle si zapíšu propiskou.",
        "Pět za sebou. Takhle jezdí ti, co mi pak pošlou pohled z dovolené.",
      ],
      streak10: [
        "Deset. Sundal jsem nohu z pedálu. Komisaři to neříkejte.",
        "Deset za sebou. Dopil jsem kafe v klidu. To se mi stává jednou za ročník.",
        "Deset. Kdyby takhle jezdili všichni, jdu do důchodu o pět let dřív.",
        "Deset správně. Ukážu vás příštímu ročníku. Jako příklad, nebojte.",
      ],
      passed: [
        "No vida. Takhle to ukažte i komisaři.",
        "Dneska vzdychat nebudu. Zkusím to.",
        "Jdu to říct kolegům. Nebudou věřit.",
        "Dobře. Říkám to jednou za ročník, tak si to užijte.",
        "Dolévám si na oslavu. Kafe, jsem ve službě.",
        "A teď totéž ve čtvrtek ráno před komisařem.",
      ],
      failed: [
        "Dneska ne. Zítra v osm, kafe beru já.",
        "Trpělivost mám placenou. Přijďte zas.",
        "Polovina mých nejlepších žáků začínala takhle. Druhá polovina hůř.",
        "Zítra to bude ono. Mám to v diáři.",
        "Vyspat, najíst, znova. V tomhle pořadí.",
        "Auto je celé, slzy žádné, zbytek doladíme.",
      ],
      almost: [
        "Těsně. Takhle se u nás parkuje.",
        "Chybí tomu jedno kafe a jeden den.",
        "Skoro. U zkoušky se skoro nepočítá, tak ještě jednou.",
      ],
      perfect: [
        "Bez chyby. Třicet let učím a pořád mě to překvapí.",
        "Nemám co říct. Užijte si to, mně se to moc často nestává.",
        "Nula chyb. Dneska jsem se vezl zadarmo.",
        "Zavolám domů, že přijdu v dobré náladě. Jarmila se lekne.",
      ],
      corrected: [
        "Opraveno. Chybu udělat jednou, to je celé řemeslo.",
        "Tohle mám na té práci rád.",
        "Napodruhé to jde. Proto máme druhé pedály.",
        "Zavírám sešit.",
        "Za odměnu vám neřeknu žádnou historku.",
        "Dopíjím a jedeme dál.",
      ],
    },
  },
];

export function getPassenger(
  id: string | null | undefined,
): Passenger | undefined {
  return PASSENGERS.find((p) => p.id === id);
}

function pick(lines: string[], n: number): string {
  return lines[((n % lines.length) + lines.length) % lines.length];
}

/** A stable number for a set, so different sets start at different places in the battery. */
export function seedFor(ids: readonly (string | number)[]): number {
  let h = 0;
  for (const id of ids.slice(0, 6))
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * What the passenger says after the latest answer, or null to stay quiet. `outcomes` are the
 * answers of this set so far, oldest first, the latest last. A mistake always gets a line: the
 * nth mistake of a set takes the next line of the battery, starting where `seed` puts it, so a
 * set never repeats itself and two sets rarely start alike. The third mistake in a row gets a
 * line of its own. A right answer gets one only at five and at ten in a row. First-aid questions
 * get no remark at all: injuries are not a place for a joke.
 */
export function noteAfterAnswer(
  p: Passenger,
  outcomes: boolean[],
  category?: string,
  seed = 0,
): string | null {
  if (!outcomes.length || category === "Zdravotnická příprava") return null;
  let run = 0;
  const last = outcomes[outcomes.length - 1];
  for (let i = outcomes.length - 1; i >= 0 && outcomes[i] === last; i--) run++;
  if (!last) {
    if (run === 3) return pick(p.lines.tilt, seed);
    const nth = outcomes.filter((ok) => !ok).length - 1;
    return pick(p.lines.wrong, seed + nth);
  }
  if (run === 5) return pick(p.lines.streak5, seed);
  if (run === 10) return pick(p.lines.streak10, seed);
  return null;
}

export interface ResultKind {
  exam: boolean;
  passed?: boolean;
  /** Exam only: points scored and points needed. */
  score?: number;
  needed?: number;
  /** Mistakes in the first attempt. */
  wrong: number;
  /** Mistakes put right in the correction round. */
  corrected: number;
}

/** Which moment a finished set or exam is. */
export function resultMoment(r: ResultKind): Moment {
  if (r.wrong === 0) return "perfect";
  if (r.exam) {
    if (r.passed) return "passed";
    return r.score != null && r.needed != null && r.needed - r.score <= 3
      ? "almost"
      : "failed";
  }
  return r.corrected >= r.wrong ? "corrected" : "failed";
}

/** One line for the results screen. */
export function noteForResult(p: Passenger, r: ResultKind, seed = 0): string {
  return pick(p.lines[resultMoment(r)], seed);
}
