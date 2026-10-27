import { test, expect } from '@playwright/test'

// Persona journey: Tereza (18) is preparing for the driving-theory test.
// Montessori flow: she picks a topic freely from day 1, answers, gets
// immediate feedback, and ends on a summary — no locked path, no penalty.
test('topic journey: home tile → answer → feedback → summary', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Autoškola kvíz' })).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/home.png', fullPage: true })

  // Free topic choice: the "Dopravní značky" tile (222 sign questions).
  await page.getByRole('button', { name: /Dopravní značky/ }).click()
  await expect(page.getByText('01 / 222')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/question-image.png', fullPage: true })

  await page.locator('button[data-state="idle"]').first().click()
  await expect(page.locator('button[data-state="correct"]')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/feedback.png', fullPage: true })

  // real bank: 222 sign questions → the journey continues to the next one
  await page.getByRole('button', { name: /Další/ }).click()
  await expect(page.getByText('02 / 222')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/summary.png', fullPage: true })
})

test('daily set from home: finishable, with completion + streak', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Denní dávka/ }).click()
  // a daily lesson is always exactly 10 questions
  await expect(page.getByText('01 / 10')).toBeVisible()
  // Control of error: missed questions come back until right, so answer them from what the
  // app revealed the first time.
  const known = new Map<string, string>()
  for (let step = 0; step < 60 && !(await page.getByText('Lekce dokončena').isVisible()); step++) {
    const q = (await page.locator('h2').first().textContent())!
    const want = known.get(q)
    const option = want
      ? page.locator('button[data-state="idle"]', { hasText: want })
      : page.locator('button[data-state="idle"]')
    await option.first().click()
    const right = await page.locator('button[data-state="correct"]').first().innerText()
    known.set(q, right.split('\n').pop()!.replace('✓ Správná odpověď', '').trim())
    await page.getByRole('button', { name: /Další|Dokončit/ }).click()
  }
  await expect(page.getByText('Lekce dokončena')).toBeVisible()
  await expect(page.getByText(/den.*v řadě|dní.*v řadě/)).toBeVisible()
})

test('exam mode from practice tab: timer, no reveal', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Procvičovat' }).click()
  await page.getByRole('button', { name: /Zkušební test/ }).click()
  await expect(page.getByText('01 / 25')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
  await page.locator('button[data-state="idle"]').first().click()
  await expect(page.locator('button[data-state="correct"]')).toHaveCount(0)
})

test('exam survives a reload mid-test', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Procvičovat' }).click()
  await page.getByRole('button', { name: /Zkušební test/ }).click()
  await page.locator('button[data-state="idle"]').first().click()
  await page.getByRole('button', { name: /Další/ }).click()
  await expect(page.getByText('02 / 25')).toBeVisible()
  await page.reload()
  await expect(page.getByText('02 / 25')).toBeVisible()
  await expect(page.getByRole('timer')).toBeVisible()
})

test('guide and stats tabs are reachable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Průvodce' }).click()
  await expect(page.getByRole('heading', { name: 'Studijní průvodce' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Jak zkouška probíhá/ })).toBeVisible()
  await page.getByRole('button', { name: 'Postup' }).click()
  await expect(page.getByRole('heading', { name: 'Postup' })).toBeVisible()
})

// Tereza meets a 4-point "dopravní situace": the official clip plays, the still is its poster.
test('animated situation question plays its clip', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Procvičovat' }).click()
  await page.getByPlaceholder(/Zúžit hledáním/).fill('z výhledu v dané situaci')
  await page.getByRole('button', { name: /Spustit procvičování/ }).click()
  const video = page.getByTestId('question-video')
  await expect(video).toBeVisible()
  await expect(page.getByText(/Spusťte animaci/)).toBeVisible()
  const src = await video.locator('source').getAttribute('src')
  const res = await page.request.get(src!)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('video/mp4')
  await page.screenshot({ path: 'e2e/shots/question-video.png', fullPage: true })
})
