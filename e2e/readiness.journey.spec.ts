import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { answerFromMemory } from './answers'

// Persona journey (Marek, 17, two weeks before the exam, on his phone). A new learner sees what
// each okruh carries in the test and no estimate yet. After practice in every okruh, Home shows
// the expected points per okruh against the 43 needed, and Dopravní situace, where he misses
// most, stands out. Screenshots for review.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

const STORAGE_KEY = 'autoskola-kviz:progress:v1'
const questions = JSON.parse(readFileSync('data/questions.json', 'utf8')) as { id: number; cat: string }[]

/** His history: 12 answers per okruh, all right except 5 wrong in Dopravní situace. */
function history() {
  const stats: Record<number, unknown> = {}
  const byCat = new Map<string, number[]>()
  for (const q of questions) byCat.set(q.cat, [...(byCat.get(q.cat) ?? []), q.id])
  for (const [cat, ids] of byCat) {
    ids.slice(0, 12).forEach((id, i) => {
      const right = !(cat === 'Dopravní situace' && i < 5)
      stats[id] = { seen: 1, correct: right ? 1 : 0, streak: right ? 1 : 0, lastSeen: 1000 + i, lastCorrect: right, ...(right ? {} : { lastWrong: 1000 + i }) }
    })
  }
  return { version: 1, stats, bookmarks: [], streak: { current: 0, best: 0, lastDate: '' }, updatedAt: 2000 }
}

test('a new learner sees the points each okruh carries, and no invented estimate', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('readiness-total')).toHaveText(/po 10 zodpovězených otázkách\. K úspěchu je potřeba 43 z 50\./)
  await expect(page.getByRole('button', { name: /^Dopravní situace/ })).toContainText(/max\. 12 bodů\s*zatím 0\/10 otázek/)
  await expect(page.getByRole('progressbar', { name: /odhad bodů/ })).toHaveCount(0)

  // Answering counts toward the okruh's estimate.
  await page.getByRole('button', { name: /^Zdravotnická příprava/ }).click()
  const known = new Map<string, number>()
  for (let i = 0; i < 3; i++) {
    await answerFromMemory(page, known)
    await page.getByRole('button', { name: /^Další/ }).click()
  }
  await page.getByRole('button', { name: /Konec/ }).click()
  await expect(page.getByRole('button', { name: /^Zdravotnická příprava/ })).toContainText('zatím 3/10 otázek')
  await page.screenshot({ path: 'e2e/shots/readiness-empty.png' })
})

test('after practice in every okruh: expected points against 43, the costliest okruh marked', async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value)
    },
    [STORAGE_KEY, JSON.stringify(history())],
  )
  await page.goto('/')
  // 50 − 12 × 5/12 = 45 expected.
  await expect(page.getByTestId('readiness-total')).toHaveText('Odhad u zkoušky: 45 z 50 bodů · potřeba 43')
  const situace = page.getByRole('button', { name: /^Dopravní situace/ })
  await expect(situace).toContainText('Nejvíc ztrát')
  await expect(situace).toContainText('7 z 12 bodů')
  await expect(page.getByText('Nejvíc ztrát')).toHaveCount(1)
  await expect(page.getByRole('progressbar', { name: 'Pravidla provozu: odhad bodů' })).toHaveAttribute('aria-valuenow', '20')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.getByTestId('readiness-total').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'e2e/shots/readiness-home.png' })
  await situace.click()
  await expect(page.getByText(/^Dopravní situace · sada 1 z \d+/)).toBeVisible()
})
