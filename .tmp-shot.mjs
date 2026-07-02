import { chromium } from '@playwright/test'
const b = await chromium.launch()
const BASE = process.argv[2] || 'http://localhost:5199'
const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, ignoreHTTPSErrors: true })
const p = await ctx.newPage()
await p.goto(BASE)
await p.waitForTimeout(1500)
await p.screenshot({ path: process.env.OUT + '/live-home-top.png' })
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await p.waitForTimeout(400)
await p.screenshot({ path: process.env.OUT + '/live-home-bottom.png' })
const info = await p.evaluate(() => {
  const main = document.querySelector('main')
  const nav = document.querySelector('nav')
  return {
    mainStyle: main ? main.getAttribute('style') : null,
    mainPaddingBottom: main ? getComputedStyle(main).paddingBottom : null,
    navTop: nav ? nav.getBoundingClientRect().top : null,
    lastChildBottom: (() => { const c=[...document.querySelectorAll('main > div > *')]; return c.length? c[c.length-1].getBoundingClientRect().bottom : null })(),
    scrollY: window.scrollY, docH: document.body.scrollHeight, innerH: innerHeight,
  }
})
console.log(JSON.stringify(info, null, 1))
await b.close()
