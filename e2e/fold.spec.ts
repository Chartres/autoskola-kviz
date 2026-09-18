import { test, expect } from '@playwright/test'

// Fold discipline (flywheel Standard, mobile-ux): no chrome row spent on a single
// control. The first primary action must sit in the top 120 css px on a phone.
test('phone fold: primary action starts near the top', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const first = page.locator('main button').first()
  await expect(first).toBeVisible()
  const box = await first.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeLessThan(120)
  await page.screenshot({ path: 'e2e/shots/fold-phone.png' })
})
