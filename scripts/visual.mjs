// Visual journey capture across mobile + desktop. Usage: node scripts/visual.mjs [baseURL]
import { chromium, devices } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:4173'
const OUT = process.env.OUT || '/tmp/visual'
const REF = 'chgwirzbpspoaoposuwg'

// A fake but well-formed Supabase session so we can capture the signed-in UI
// without a real token (getSession reads storage and does not verify signature).
const farFuture = 4102444800 // 2100-01-01
const fakeSession = {
  access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.sig',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: farFuture,
  refresh_token: 'fake-refresh',
  user: { id: '00000000-0000-0000-0000-000000000000', email: 'tester@autoskola.dravec.org', aud: 'authenticated', role: 'authenticated' },
}

const targets = [
  { name: 'mobile', device: devices['iPhone 14 Pro'] },
  { name: 'desktop', device: { viewport: { width: 1280, height: 850 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, userAgent: devices['Desktop Chrome'].userAgent } },
]

const shot = async (page, dir, name) => {
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${OUT}/${dir}/${name}.png`, fullPage: false })
  console.log(`  ${dir}/${name}.png`)
}

const browser = await chromium.launch()
for (const t of targets) {
  mkdirSync(`${OUT}/${t.name}`, { recursive: true })
  console.log(`\n=== ${t.name} (${BASE}) ===`)
  const ctx = await browser.newContext({ ...t.device })
  const page = await ctx.newPage()

  // 1) Home (signed out)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await shot(page, t.name, '01-home')

  // 2) Auth popover — signed out (sign-in form)
  const avatar = page.getByRole('button', { name: /Přihlásit|Účet/ })
  if (await avatar.count()) {
    await avatar.first().click()
    await shot(page, t.name, '02-auth-signin')
    await avatar.first().click() // toggle popover closed (no outside-click handler)
    await page.waitForTimeout(150)
  } else {
    console.log('  [warn] no auth avatar found (auth not configured?)')
  }

  // 3) Daily lesson — first question
  await page.getByRole('button', { name: /Denní dávka/ }).click()
  await shot(page, t.name, '03-lesson-q')
  // answer it → feedback
  await page.locator('button[data-state="idle"]').first().click()
  await shot(page, t.name, '04-lesson-feedback')
  // finish the lesson to reach completion
  for (let i = 0; i < 12; i++) {
    const next = page.getByRole('button', { name: /Další|Dokončit/ })
    if (await next.count()) { await next.first().click() }
    const idle = page.locator('button[data-state="idle"]').first()
    if (await idle.count()) await idle.click().catch(() => {})
  }
  await shot(page, t.name, '05-lesson-done')

  // 4) Back home, Practice menu
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const practice = page.getByRole('button', { name: 'Procvičovat' })
  if (await practice.count()) {
    await practice.click()
    await shot(page, t.name, '06-practice-menu')
    // exam mode
    const exam = page.getByRole('button', { name: /Zkušební test/ })
    if (await exam.count()) { await exam.click(); await shot(page, t.name, '07-exam') }
  }

  // 5) Guide
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const guide = page.getByRole('button', { name: 'Průvodce' })
  if (await guide.count()) { await guide.click(); await shot(page, t.name, '08-guide') }

  // 6) Stats
  const stats = page.getByRole('button', { name: 'Postup' })
  if (await stats.count()) { await stats.click(); await shot(page, t.name, '09-stats') }

  // 7) Signed-in UI (inject session) — reload home, open account popover
  await ctx.addInitScript(([ref, session]) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session))
  }, [REF, fakeSession])
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const avatar2 = page.getByRole('button', { name: /Přihlásit|Účet/ })
  if (await avatar2.count()) { await avatar2.first().click(); await shot(page, t.name, '10-auth-signedin') }

  await ctx.close()
}
await browser.close()
console.log(`\nDone -> ${OUT}`)
