import { test, expect } from '@playwright/test'
import { answerFromMemory } from './answers'

// Persona journey (Tereza, 18, on the bus): she does 8 questions of Dopravní značky, her stop
// comes, she taps "Konec". In the evening she opens the app again (a fresh load), sees the set
// waiting and taps Pokračovat: question 9 of the same set, not the first 8 again.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

const counter = (n: number) => `${String(n).padStart(2, '0')} / 20`
const heading = (page: import('@playwright/test').Page) => page.locator('h2').first().textContent()

test('a set left partway waits on Home and resumes at the first unanswered question', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Dopravní značky/ }).click()
  await expect(page.getByText(/^Dopravní značky · sada 1 z \d+/)).toBeVisible()

  const known = new Map<string, number>()
  const asked: string[] = []
  for (let i = 1; i <= 8; i++) {
    await expect(page.getByText(counter(i), { exact: true })).toBeVisible()
    asked.push((await heading(page))!)
    await answerFromMemory(page, known)
    await page.getByRole('button', { name: /^Další/ }).click()
  }
  await expect(page.getByText(counter(9), { exact: true })).toBeVisible()
  const ninth = await heading(page)
  await page.getByRole('button', { name: /Konec/ }).click()

  // Later: a fresh load of the app.
  await page.reload()
  await expect(page.getByText('Rozpracovaná sada')).toBeVisible()
  await expect(page.getByText('Zodpovězeno 8 z 20')).toBeVisible()
  await expect(page.getByRole('button', { name: /Pokračovat/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nový trénink' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.screenshot({ path: 'e2e/shots/resume-prompt.png' })

  await page.getByRole('button', { name: /Pokračovat/ }).click()
  await expect(page.getByText(counter(9), { exact: true })).toBeVisible()
  await expect(page.getByText(/^Dopravní značky · sada 1 z \d+ · otázky 1–20/)).toBeVisible()
  expect(await heading(page)).toBe(ninth)
  expect(asked).not.toContain(ninth)
  await page.screenshot({ path: 'e2e/shots/resume-resumed.png' })

  // Finish the set: the results come, and the prompt is gone.
  const done = page.getByText(/hotová/)
  const question = page.getByRole('group', { name: 'Možnosti odpovědi' })
  for (let step = 0; step < 80; step++) {
    await expect(question.or(done).first()).toBeVisible()
    if (await done.isVisible()) break
    await answerFromMemory(page, known)
    await page.getByRole('button', { name: /^(Další(?!ch)|Dokončit|Opravit chyby)/ }).click()
  }
  await expect(page.getByText(/sada 1 z \d+ hotová/)).toBeVisible()
  await page.getByRole('button', { name: 'Zpět' }).click()
  await expect(page.getByText('Rozpracovaná sada')).toHaveCount(0)
})
