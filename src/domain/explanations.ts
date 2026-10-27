/**
 * Ad fontes: why each official answer is right, with the sentence of law it rests on.
 * Written in Claude Code sessions from the stored law texts (data/law); every quote is checked
 * against them in explanations.test.ts. Loaded lazily — the first answer pulls in the chunk.
 */

export interface LawSource {
  /** e.g. "361/2000 Sb." */
  law: string
  /** e.g. "§ 54 odst. 3" or "příloha č. 1, značka A 1a" */
  ref: string
  /** zakonyprolidi.cz fragment anchor, e.g. "p54-3"; "sign-A1a" for decree annex rows */
  anchor: string
  /** Verbatim excerpt of that fragment */
  quote: string
}

export interface Explanation {
  why: string
  sources: LawSource[]
  /** Set when current law or practice differs from the official answer. */
  flag?: string
  /** The pictured sign's number and official name (vyhláška 294/2015 Sb.), for sign questions. */
  sign?: { code: string; name: string }
}

export type Explanations = Record<string, Explanation>

const LAWS: Record<string, { kind: 'zákona' | 'vyhláška'; url: string }> = {
  '361/2000 Sb.': { kind: 'zákona', url: 'https://www.zakonyprolidi.cz/cs/2000-361' },
  '294/2015 Sb.': { kind: 'vyhláška', url: 'https://www.zakonyprolidi.cz/cs/2015-294' },
  '56/2001 Sb.': { kind: 'zákona', url: 'https://www.zakonyprolidi.cz/cs/2001-56' },
  '247/2000 Sb.': { kind: 'zákona', url: 'https://www.zakonyprolidi.cz/cs/2000-247' },
}

/** "§ 54 odst. 3 zákona č. 361/2000 Sb." / "vyhláška č. 294/2015 Sb., příloha č. 1, značka A 1a" */
export function sourceLabel(s: LawSource): string {
  const law = LAWS[s.law]
  if (s.anchor.startsWith('sign-') || law?.kind === 'vyhláška') {
    return s.ref.startsWith('§') ? `${s.ref} vyhlášky č. ${s.law}` : `vyhláška č. ${s.law}, ${s.ref}`
  }
  return `${s.ref} zákona č. ${s.law}`
}

/** Link to the consolidated text; paragraphs jump to their fragment, annex rows to the decree. */
export function sourceUrl(s: LawSource): string {
  const base = LAWS[s.law]?.url ?? 'https://www.zakonyprolidi.cz/'
  return s.anchor.startsWith('sign-') ? base : `${base}#${s.anchor}`
}

let loading: Promise<Explanations> | null = null

export function loadExplanations(): Promise<Explanations> {
  loading ??= import('@data/explanations.json').then((m) => m.default as Explanations)
  return loading
}
