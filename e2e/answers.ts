import type { Page } from '@playwright/test'

/**
 * Answer the current question; once the app has revealed its correct option, remember it by
 * position (answers can be pictures without text, and question texts repeat across questions),
 * keyed by the question text and its picture. Unknown questions get the first option.
 */
export async function answerFromMemory(page: Page, known: Map<string, number>) {
  const key = await page.evaluate(() => {
    const media = document.querySelector('article img, article video source')
    return `${document.querySelector('h2')?.textContent}|${media?.getAttribute('src') ?? ''}`
  })
  const options = page.getByRole('group', { name: 'Možnosti odpovědi' }).locator('button')
  await options.nth(known.get(key) ?? 0).click()
  const states = await options.evaluateAll((bs) => bs.map((b) => b.getAttribute('data-state')))
  known.set(key, states.indexOf('correct'))
}
