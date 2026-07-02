import { test, expect } from '@playwright/test'

// SEO topic pages (Flywheel Standard §13): each okruh is a real prerendered
// URL with its own title/description, and the app boots straight into that
// okruh's practice.
test('topic page /okruh/dopravni-znacky/ serves unique meta and starts the topic', async ({
  page,
}) => {
  await page.goto('/okruh/dopravni-znacky/')
  await expect(page).toHaveTitle(/Dopravní značky/)
  const desc = page.locator('meta[name="description"]')
  await expect(desc).toHaveAttribute('content', /Dopravní značky|značky/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://autoskola.dravec.org/okruh/dopravni-znacky/',
  )
  // The app takes over and starts sign practice (222 questions).
  await expect(page.getByText('01 / 222')).toBeVisible()
  await page.screenshot({ path: 'test-results/seo-topic-page.png' })
})

test('landing page has honest title, description and canonical', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Autoškola testy zdarma/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://autoskola.dravec.org/',
  )
})

test('sitemap.xml and robots.txt are served', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  const xml = await sitemap.text()
  expect(xml).toContain('https://autoskola.dravec.org/okruh/dopravni-znacky/')
  expect(xml).toContain('https://autoskola.dravec.org/okruh/zdravotnicka-priprava/')

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  expect(await robots.text()).toContain('Sitemap: https://autoskola.dravec.org/sitemap.xml')
})
