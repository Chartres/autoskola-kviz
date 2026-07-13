// Rasterize PWA + native app-store icons/splash from the give-way mark using
// Playwright (no native SVG tools needed).
// Outputs to public/icons/ and resources/. Run: node scripts/gen-icons.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const OUT = 'public/icons'
const RES = 'resources'
mkdirSync(OUT, { recursive: true })
mkdirSync(RES, { recursive: true })

// Give-way triangle, centred in a 32x32 box (matches public/favicon.svg).
const mark = `
  <polygon points="16,5 29,27 3,27" fill="#ffffff" stroke="#b05a2b"
    stroke-width="3.5" stroke-linejoin="round"/>
  <circle cx="16" cy="20.5" r="2" fill="#b05a2b"/>`

// markScale = fraction of the canvas the 32-unit mark occupies (rest is padding).
function pageSVG(px, bg, markScale) {
  const m = px * markScale
  const off = (px - m) / 2
  return `<!doctype html><meta charset="utf-8">
  <style>html,body{margin:0}#c{width:${px}px;height:${px}px;background:${bg}}</style>
  <div id="c"><svg width="${px}" height="${px}" viewBox="0 0 ${px} ${px}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${off} ${off}) scale(${m / 32})">${mark}</g>
  </svg></div>`
}

const PAPER = '#faf6ee' // sand-950 — the app's page background
const INK = '#241e14' // sand-50 — the app's strongest ink

const jobs = [
  { file: 'icon-192.png', px: 192, bg: PAPER, scale: 0.86, dir: OUT },
  { file: 'icon-512.png', px: 512, bg: PAPER, scale: 0.86, dir: OUT },
  // maskable: full-bleed bg, mark in the ~60% safe zone
  { file: 'maskable-512.png', px: 512, bg: PAPER, scale: 0.6, dir: OUT },
  // apple touch icon: opaque, slight padding (iOS rounds corners itself)
  { file: 'apple-touch-icon.png', px: 180, bg: PAPER, scale: 0.7, dir: OUT },
  // native app-store icon: opaque, no transparency, same bg as the PWA icons
  { file: 'icon.png', px: 1024, bg: PAPER, scale: 0.7, dir: RES },
  // splash screens: mark centred on a mostly-empty canvas (@capacitor/assets
  // insets it further for each device size)
  { file: 'splash.png', px: 2732, bg: PAPER, scale: 0.28, dir: RES },
  { file: 'splash-dark.png', px: 2732, bg: INK, scale: 0.28, dir: RES },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const j of jobs) {
  await page.setViewportSize({ width: j.px, height: j.px })
  await page.setContent(pageSVG(j.px, j.bg, j.scale))
  await page.locator('#c').screenshot({ path: `${j.dir}/${j.file}` })
  console.log(`  ${j.dir}/${j.file} (${j.px}px)`)
}
await browser.close()
console.log('icons done')
