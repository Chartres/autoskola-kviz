export interface Skill {
  id: string
  label: string
  requiredReps: number
}

export interface LessonRecord {
  id: string
  date: string        // YYYY-MM-DD
  durationMin: number
  skills: string[]    // Skill ids practiced this lesson
}

export interface JizdyState {
  version: 1
  lessons: LessonRecord[]
}

export function emptyJizdyState(): JizdyState {
  return { version: 1, lessons: [] }
}

export function logLesson(state: JizdyState, record: LessonRecord): JizdyState {
  return { ...state, lessons: [...state.lessons, record] }
}

/** Rep count per skill id across all logged lessons. */
export function skillCoverage(
  state: JizdyState,
  skills: Skill[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const skill of skills) counts[skill.id] = 0
  for (const lesson of state.lessons) {
    for (const skillId of lesson.skills) {
      if (skillId in counts) counts[skillId]++
    }
  }
  return counts
}

/** True when every skill has been practiced at least requiredReps times. */
export function isReady(state: JizdyState, skills: Skill[]): boolean {
  if (skills.length === 0) return false
  const coverage = skillCoverage(state, skills)
  return skills.every((s) => (coverage[s.id] ?? 0) >= s.requiredReps)
}
