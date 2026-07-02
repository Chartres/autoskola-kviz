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
  /** Third option — some official questions have only two answers. */
  c: string | null
  correct: Choice
  /** Question picture / video still (filename under public/media), or null. */
  image: string | null
  /** Answer pictures ("which of these signs…"); the matching text is then empty. */
  aImg?: string
  bImg?: string
  cImg?: string
  /** Official point value (1, 2 or 4). */
  points: number
  /** eTesty question id (traceability back to the official bank). */
  sourceId: number
  /** Source video for animated situace questions (not played yet; `image` holds the still). */
  videoUrl?: string
  /** Licence groups a zásady question applies to (A / B / CD). */
  groups?: string[]
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
  pointsPerQuestion: number
}

export interface ExamConfig {
  totalQuestions: number
  composition: ExamCompositionPart[]
  /** Maximum reachable points (50). */
  maxPoints: number
  /** Pass threshold in points (43 of 50). */
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
