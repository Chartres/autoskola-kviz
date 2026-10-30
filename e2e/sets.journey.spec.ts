import { test, expect } from '@playwright/test'
import { answerFromMemory } from './answers'

// Persona journey (Tereza, 18, on the bus with her phone): she opens Dopravní značky, does one
// set of 20, sees her score, what she missed and how far through the okruh she is, then takes
// the next 20. Screenshots for review.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

test('okruh practice in sets of 20, with a results screen after each', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Dopravní značky/ }).click()
  await expect(page.getByText(/^Dopravní značky · sada 1 z \d+ · otázky 1–20 z \d+$/)).toBeVisible()
  await expect(page.getByText(/^01 \/ 20$/)).toBeVisible()

  // Round one: the first option every time (some wrong); then answer from what the app revealed,
  // so the correction round (Kontrola chyby) ends and the results show.
  const known = new Map<string, number>()
  const done = page.getByText(/hotová/)
  const question = page.getByRole('group', { name: 'Možnosti odpovědi' })
  for (let step = 0; step < 80; step++) {
    // Wait for either the next question or the results, so a slow render can't skip a step.
    await expect(question.or(done).first()).toBeVisible()
    if (await done.isVisible()) break
    await answerFromMemory(page, known)
    await page.getByRole('button', { name: /^(Další(?!ch)|Dokončit|Opravit chyby)/ }).click()
  }
  await expect(page.getByText(/sada 1 z \d+ hotová/)).toBeVisible()
  await expect(page.getByText(/ \/ 20$/)).toBeVisible()
  await expect(page.getByText(/^Chybné odpovědi \(\d+\)$/)).toBeVisible()
  const bar = page.getByRole('progressbar', { name: 'Dopravní značky: zodpovězené otázky' })
  await expect(bar).toHaveAttribute('aria-valuenow', '20')
  await expect(page.getByRole('button', { name: 'Zpět' })).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/sets-results.png', fullPage: true })

  // No horizontal overflow on the results screen at 390 px.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  await page.getByRole('button', { name: 'Dalších 20' }).click()
  await expect(page.getByText(/^Dopravní značky · sada 2 z \d+ · otázky 21–40 z \d+$/)).toBeVisible()
  await expect(page.getByText(/^01 \/ 20$/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/sets-next.png' })
})
