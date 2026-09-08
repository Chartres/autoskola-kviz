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
  // Social cards carry the topic-specific title/description/url, not the root's.
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Dopravní značky/)
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /značky/)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://autoskola.dravec.org/okruh/dopravni-znacky/',
  )
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', /Dopravní značky/)
  // The app takes over and starts sign practice (222 questions).
  await expect(page.getByText('01 / 222')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/seo-topic-page.png' })
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
  expect(sitemap.headers()['content-type']).toMatch(/xml/)
  const xml = await sitemap.text()
  expect(xml).toContain('<loc>https://autoskola.dravec.org/</loc>')
  expect(xml).toContain('https://autoskola.dravec.org/okruh/dopravni-znacky/')
  expect(xml).toContain('https://autoskola.dravec.org/okruh/zdravotnicka-priprava/')

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  expect(robots.headers()['content-type']).toMatch(/^text\/plain/)
  const txt = await robots.text()
  expect(txt).toMatch(/^User-agent: \*\nAllow: \/$/m) // everyone welcome
  expect(txt).toContain('User-agent: ClaudeBot') // AI agents named, not left to silence
  expect(txt).not.toMatch(/^Disallow: \/\s*$/m)
  expect(txt).toContain('Sitemap: https://autoskola.dravec.org/sitemap.xml')
})

// Discoverability kit (Flywheel Standard §5c): what AI agents and link unfurlers read.
test('llms.txt, security.txt and the 1200×630 share card are served', async ({ request }) => {
  const llms = await request.get('/llms.txt')
  expect(llms.ok()).toBe(true)
  expect(llms.headers()['content-type']).toMatch(/^text\/plain/)
  const body = await llms.text()
  expect(body.startsWith('# Autoškola kvíz')).toBe(true)
  expect(body).toContain('https://autoskola.dravec.org/sitemap.xml')

  const sec = await request.get('/.well-known/security.txt')
  expect(sec.ok()).toBe(true)
  expect(await sec.text()).toMatch(/^Contact: https:\/\//m)

  const og = await request.get('/og.png')
  expect(og.ok()).toBe(true)
  expect(og.headers()['content-type']).toBe('image/png')
  const png = await og.body()
  // IHDR width/height live at bytes 16..24 of a PNG
  expect(png.readUInt32BE(16)).toBe(1200)
  expect(png.readUInt32BE(20)).toBe(630)
})

test('head carries the share-card block and WebApplication JSON-LD', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://autoskola.dravec.org/og.png',
  )
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    'content',
    'https://autoskola.dravec.org/og.png',
  )
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}')
  expect(ld['@type']).toBe('WebApplication')
  expect(ld.url).toBe('https://autoskola.dravec.org/')
  expect(ld.isAccessibleForFree).toBe(true)
})
