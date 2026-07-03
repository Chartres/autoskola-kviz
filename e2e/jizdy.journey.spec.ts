import { test, expect } from '@playwright/test'

// Persona: Tereza (21) has ~80% theory mastery and is ready to start practical lessons.
// She discovers the Jízdy tab, logs her first lesson, checks persistence, and sees the
// cross-promo CTA on the home screen.

/** Seed localStorage with N questions mastered (streak ≥ 2) before page load. */
async function seedMastery(page: import('@playwright/test').Page, count: number) {
  await page.addInitScript((n: number) => {
    const stats: Record<number, object> = {}
    for (let i = 1; i <= n; i++) {
      stats[i] = { seen: 2, correct: 2, streak: 2, lastSeen: 1, lastCorrect: true }
    }
    localStorage.setItem(
      'autoskola-kviz:progress:v1',
      JSON.stringify({
        version: 1,
        stats,
        bookmarks: [],
        streak: { current: 5, best: 5, lastDate: '2026-07-04' },
        updatedAt: 1,
      }),
    )
  }, count)
}

test('jizdy: log a lesson and see readiness update', async ({ page }) => {
  await seedMastery(page, 800) // 800 / 1136 ≈ 70.4% — cross-promo threshold
  await page.goto('/')

  // Step 1: Jízdy tab is visible in the bottom nav
  await expect(page.getByRole('button', { name: 'Jízdy', exact: true })).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/jizdy-home.png', fullPage: true })

  // Step 2: navigate to JizdyScreen
  await page.getByRole('button', { name: 'Jízdy', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Jízdy' })).toBeVisible()
  await expect(page.getByText(/Připraveno/)).toBeVisible()
  await expect(page.getByText(/0 \/ 20/)).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/jizdy-checklist.png', fullPage: true })

  // Step 3: fill the log form
  // Date is pre-filled with today; set duration
  await page.getByLabel('Délka (min)').fill('60')

  // Select 3 skills by clicking the chip label elements (hidden checkboxes use sr-only;
  // click the visible label wrapper, not the checkbox directly)
  const skillLabels = ['Kontrola vozidla před jízdou', 'Rozjezd a zastavení', 'Otáčení (3bodový obrat)']
  for (const label of skillLabels) {
    await page.locator('label').filter({ hasText: label }).click()
  }
  await page.screenshot({ path: 'e2e/shots/jizdy-log-form.png', fullPage: true })

  // Step 4: submit → checklist updates, confirmation appears
  await page.getByRole('button', { name: 'Uložit jízdu' }).click()
  await expect(page.getByRole('status')).toHaveText('Jízda zaznamenána')

  // Step 5: navigate away to home, then back — state must persist (localStorage round-trip)
  await page.getByRole('button', { name: 'Domů', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Autoškola kvíz' })).toBeVisible()
  await page.getByRole('button', { name: 'Jízdy', exact: true }).click()

  // After round-trip: skills logged today should show 1 rep
  await expect(page.getByText('1 / 2').first()).toBeVisible()
})

test('cross-promo: home shows jizdy CTA at 70% theory mastery', async ({ page }) => {
  await seedMastery(page, 800) // 70%+ theory mastery
  await page.goto('/')

  await expect(page.getByTestId('jizdy-cta')).toBeVisible()
  await expect(page.getByText(/Teorie zvládnutá\? Přejdi na jízdy/)).toBeVisible()
  // Center CTA in viewport (sticky nav would occlude a naive scrollIntoView)
  await page.evaluate(() =>
    document.querySelector('[data-testid="jizdy-cta"]')?.scrollIntoView({ block: 'center' }),
  )
  await page.screenshot({ path: 'e2e/shots/jizdy-cross-promo.png' })

  // Clicking the CTA navigates to JizdyScreen
  await page.getByTestId('jizdy-cta').click()
  await expect(page.getByRole('heading', { name: 'Jízdy' })).toBeVisible()
})
