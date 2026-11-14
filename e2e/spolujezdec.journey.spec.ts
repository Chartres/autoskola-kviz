import { test, expect, type Page } from '@playwright/test'
import { answerFromMemory } from './answers'

// Persona journey (Matěj, 17, on his phone): he picks who rides along, gets a remark when he
// misses a question in practice, and none in the mock exam. Screenshots for review.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

const KEY = 'autoskola-kviz:passenger:v1'
const PASSENGERS = [
  ['kuzel', 'Dopravní kužel'],
  ['panak', 'Testovací panák'],
  ['stromecek', 'Vonný stromeček'],
  ['karel', 'Pan Karel'],
] as const

/** Answer with the first option until one is wrong; the passenger then has something to say. */
async function missOne(page: Page) {
  for (let i = 0; i < 20; i++) {
    const options = page.getByRole('group', { name: 'Možnosti odpovědi' }).locator('button')
    await options.first().click()
    if ((await options.first().getAttribute('data-state')) === 'wrong') return
    await page.getByRole('button', { name: /Další/ }).click()
  }
  throw new Error('twenty first options in a row were right')
}

test('nobody rides along until one is picked; the pick introduces itself and persists', async ({ page }) => {
  await page.goto('/')
  const picker = page.getByRole('region', { name: 'Spolujezdec' })
  await expect(picker.getByRole('button', { name: 'Nikdo' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('passenger-card')).toHaveCount(0)

  // Tall enough that the fixed bottom nav doesn't cover the card in the element screenshot.
  await page.setViewportSize({ width: 390, height: 1500 })
  for (const [id, name] of PASSENGERS) {
    await picker.getByRole('button', { name }).click()
    await expect(page.getByTestId('passenger-card')).toContainText(name)
    await picker.scrollIntoViewIfNeeded()
    await picker.screenshot({ path: `e2e/shots/spolujezdec-vizitka-${id}.png` })
  }
  await page.reload()
  await expect(page.getByTestId('passenger-card')).toContainText('Pan Karel')
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe('karel')
})

for (const [id, name] of PASSENGERS) {
  test(`${name} remarks on a missed question, under the explanation`, async ({ page }) => {
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, id])
    await page.goto('/')
    await page.getByRole('button', { name: /Související předpisy/ }).click()
    await missOne(page)
    const note = page.getByTestId('passenger-note')
    await expect(note).toBeVisible()
    await expect(note).toContainText(name)
    await note.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `e2e/shots/spolujezdec-chyba-${id}.png` })
  })
}

test('first-aid questions get no remark', async ({ page }) => {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, 'panak'])
  await page.goto('/')
  await page.getByRole('button', { name: /Zdravotnická příprava/ }).click()
  await missOne(page)
  await expect(page.getByRole('region', { name: 'Proč' })).toBeVisible()
  await expect(page.getByTestId('passenger-note')).toHaveCount(0)
})

test('the passenger closes a finished set with one line', async ({ page }) => {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, 'kuzel'])
  await page.goto('/')
  await page.getByRole('button', { name: /Související předpisy/ }).click()
  const known = new Map<string, number>()
  for (let step = 0; step < 200; step++) {
    if (await page.getByText(/první pokus/).isVisible()) break
    if (!(await page.locator('h2').first().isVisible())) break
    await answerFromMemory(page, known)
    await page.getByRole('button', { name: /Další|Dokončit|Opravit chyby/ }).click()
  }
  await expect(page.getByText(/první pokus/)).toBeVisible()
  // Which closing line it gets depends on the set; it is always the cone's.
  await expect(page.getByTestId('passenger-note')).toContainText('Dopravní kužel')
  await page.screenshot({ path: 'e2e/shots/spolujezdec-vysledek-kuzel.png' })
})

test('without a passenger, practice looks as before', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Související předpisy/ }).click()
  await missOne(page)
  await expect(page.getByTestId('passenger-note')).toHaveCount(0)
})

test('the passenger keeps quiet in the mock exam', async ({ page }) => {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KEY, 'kuzel'])
  await page.goto('/zkouska-nanecisto/')
  await page.getByRole('button', { name: /Zkušební test|Spustit|Začít/ }).first().click()
  const options = page.getByRole('group', { name: 'Možnosti odpovědi' }).locator('button')
  await options.first().click()
  await expect(page.getByText('Uloženo')).toBeVisible()
  await expect(page.getByTestId('passenger-note')).toHaveCount(0)
})

test('the guide opens with the leaflet; "Užít první dávku" starts the daily set', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Průvodce' }).click()
  const leaflet = page.getByRole('region', { name: 'Příbalová informace' })
  await expect(leaflet).toContainText('všech 1136 oficiálních otázek')
  await expect(leaflet).toContainText('účinná dávka 43 bodů')
  await leaflet.screenshot({ path: 'e2e/shots/letak.png' })
  await leaflet.getByRole('button', { name: 'Užít první dávku' }).click()
  await expect(page.getByText('Denní dávka')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Možnosti odpovědi' })).toBeVisible()
})
