import { test, expect } from '@playwright/test'

// Persona journey (Tereza, 18, on her phone): she answers, reads why from the paragraph of law,
// misses one, and the set doesn't end until she has put it right. Screenshots for review.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

test('ad fontes: the answer explained from the law, with a link to the paragraph', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Pravidla provozu/ }).click()
  await page.locator('button[data-state="idle"]').first().click()
  const why = page.getByRole('region', { name: 'Proč' })
  await expect(why).toBeVisible()
  await expect(why.getByRole('link').first()).toHaveAttribute('href', /zakonyprolidi\.cz\/cs\/\d{4}-\d+/)
  await why.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'e2e/shots/sig-why.png', fullPage: true })
})

test('Orbis Pictus: a sign question names the sign once answered', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Dopravní značky/ }).click()
  // Walk until a question with a sign plate appears (most sign questions have one).
  for (let i = 0; i < 8; i++) {
    await page.locator('button[data-state="idle"]').first().click()
    const plate = page.locator('p:has(> span.font-mono)').first()
    if (await plate.isVisible()) {
      await page.screenshot({ path: 'e2e/shots/sig-sign-plate.png', fullPage: true })
      return
    }
    await page.getByRole('button', { name: /Další/ }).click()
  }
  throw new Error('no sign plate in the first 8 sign questions')
})

test('control of error: a missed question comes back before the set ends', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Zdravotnická příprava/ }).click()
  // Round one: always the first option (some will be wrong). Afterwards answer from what the
  // app revealed as correct, so the correction round ends.
  const known = new Map<string, string>()
  let sawCorrection = false
  for (let step = 0; step < 200; step++) {
    if (await page.getByText(/první pokus/).isVisible()) break // results of a corrected set
    if (!(await page.locator('h2').first().isVisible())) break
    if (await page.getByText(/Oprava chyb/).isVisible()) {
      if (!sawCorrection) await page.screenshot({ path: 'e2e/shots/sig-correction.png', fullPage: true })
      sawCorrection = true
    }
    const q = (await page.locator('h2').first().textContent())!
    const want = known.get(q)
    const option = want ? page.locator('button[data-state="idle"]', { hasText: want }) : page.locator('button[data-state="idle"]').first()
    await option.first().click()
    known.set(q, (await page.locator('button[data-state="correct"]').first().innerText()).split('\n').pop()!.replace('✓ Správná odpověď', '').trim())
    await page.getByRole('button', { name: /Další|Dokončit/ }).click()
  }
  expect(sawCorrection).toBe(true)
  await expect(page.getByText(/první pokus/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/sig-results.png', fullPage: true })
})
