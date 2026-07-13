// App Store screenshot capture at exact device-class sizes.
// Usage: npm run build && npx vite preview --port 4173 & node scripts/store-shots.mjs
// Outputs docs/store/shots/<device>-<nn>-<screen>.png
//   iphone-69: 440×956 @3x → 1320×2868 (6.9″ requirement)
//   ipad-13:  1032×1376 @2x → 2064×2752 (13″ requirement)
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:4173'
const OUT = 'docs/store/shots'
mkdirSync(OUT, { recursive: true })

const DEVICES = [
  { name: 'iphone-69', viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'ipad-13', viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
]

// Seeded state so Stats shows the exam log + readiness (screenshots should show
// the app in use, not empty states).
const EXAM_HISTORY = {
  version: 1,
  exams: [
    { at: Date.now() - 4 * 864e5, score: 38, total: 50, passed: false },
    { at: Date.now() - 3 * 864e5, score: 44, total: 50, passed: true },
    { at: Date.now() - 2 * 864e5, score: 46, total: 50, passed: true },
    { at: Date.now() - 1 * 864e5, score: 48, total: 50, passed: true },
  ],
}

const shot = async (page, dir, name) => {
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${dir}-${name}.png`, fullPage: false })
  console.log(`  ${dir}-${name}.png`)
}

const browser = await chromium.launch()
for (const d of DEVICES) {
  console.log(`\n=== ${d.name} ===`)
  const ctx = await browser.newContext({ viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor, isMobile: d.isMobile, hasTouch: d.hasTouch })
  await ctx.addInitScript((h) => localStorage.setItem('exam-history-v1', JSON.stringify(h)), EXAM_HISTORY)
  const page = await ctx.newPage()

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await shot(page, d.name, '01-home')

  // Lesson question with immediate feedback
  await page.getByRole('button', { name: /Denní dávka/ }).click()
  await page.waitForTimeout(400)
  await page.locator('button[data-state="idle"]').first().click()
  await shot(page, d.name, '02-question-feedback')

  // Exam
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Procvičovat' }).click()
  const exam = page.getByRole('button', { name: /Zkušební test/ })
  if (await exam.count()) {
    await exam.click()
    await shot(page, d.name, '03-exam')
  }

  // Stats (seeded exam history → readiness + log)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Postup', exact: true }).click()
  await shot(page, d.name, '04-stats')

  // Study guide
  await page.getByRole('button', { name: 'Průvodce', exact: true }).click()
  await shot(page, d.name, '05-guide')

  // Jízdy log
  const jizdy = page.getByRole('button', { name: /Jízdy/ })
  if (await jizdy.count()) {
    await jizdy.first().click()
    await shot(page, d.name, '06-jizdy')
  }

  await ctx.close()
}
await browser.close()
console.log(`\nDone -> ${OUT}`)
