import { test, expect } from '@playwright/test'

// Persona journey (Klára, 18): two weeks before her exam she enters its date on Home. The day
// after it she opens the app; it asks once how it went, she answers, and it never asks again.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

const KEY = 'autoskola-kviz:exam-plan:v1'
const iso = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

test('enter the exam date; after it, answer "Jak dopadla zkouška?" once', async ({ page }) => {
  await page.goto('/')
  const field = page.getByLabel(/Termín zkoušky/)
  await field.fill(iso(14))
  await page.reload()
  await expect(page.getByLabel(/Termín zkoušky/)).toHaveValue(iso(14))
  await expect(page.getByText('Jak dopadla zkouška?')).toHaveCount(0)
  await page.getByLabel(/Termín zkoušky/).scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'e2e/shots/exam-date.png' })

  // The day after the exam.
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify({ date: iso(-1), reportedFor: null })])
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Jak dopadla zkouška?' })).toBeVisible()
  for (const name of ['Složil(a)', 'Nesložil(a)', 'Ještě ne']) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.screenshot({ path: 'e2e/shots/exam-result-question.png' })

  await page.getByRole('button', { name: 'Složil(a)', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Díky za odpověď.')
  await page.reload()
  await expect(page.getByText('Jak dopadla zkouška?')).toHaveCount(0)
})
