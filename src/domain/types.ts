export type Choice = 'a' | 'b' | 'c'

// The seven official okruhy of the Czech driving-licence theory test.
export type CategoryName =
  | 'Pravidla provozu'
  | 'Dopravní značky'
  | 'Dopravní situace'
  | 'Zásady bezpečné jízdy'
  | 'Podmínky provozu vozidel'
  | 'Související předpisy'
  | 'Zdravotnická příprava'

export type ExamGroup =
  | 'pravidla'
  | 'znacky'
  | 'situace'
  | 'zasady'
  | 'podminky'
  | 'predpisy'
  | 'zdravoveda'

export interface Question {
  id: number
  cat: CategoryName
  q: string
  a: string
  b: string
  c: string
  correct: Choice
  /** Traffic-sign / situation picture (filename under public/img), or null. */
  image: string | null
}

export interface Category {
  id: string
  name: CategoryName
  group: ExamGroup
  range: [number, number]
  count: number
}

export interface ExamCompositionPart {
  group: ExamGroup
  categories: CategoryName[]
  count: number
}

export interface ExamConfig {
  totalQuestions: number
  composition: ExamCompositionPart[]
  passThreshold: number
  timeLimitMinutes: number
}

export interface Meta {
  source: string
  sourceUrl: string
  totalQuestions: number
  categories: Category[]
  exam: ExamConfig
  duplicatePairs: [number, number][]
}
