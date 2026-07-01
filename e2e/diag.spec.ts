import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

// Guards the asymmetric-margin bug: nothing may cause horizontal scroll.
async function overflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const de = document.documentElement
    return de.scrollWidth - de.clientWidth
  })
}

test('no horizontal overflow on any tab (mobile)', async ({ page }) => {
  await page.goto('/')
  expect(await overflow(page)).toBeLessThanOrEqual(0)

  for (const tab of ['Procvičovat', 'Postup', 'Průvodce', 'Domů']) {
    await page.getByRole('button', { name: tab }).click()
    expect(await overflow(page), `overflow on ${tab}`).toBeLessThanOrEqual(0)
  }
})
