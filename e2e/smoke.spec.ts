import { expect, test, type Page } from '@playwright/test'

/** Click through every item in both languages and both age bands. */
async function readThrough(page: Page) {
  for (let guard = 0; guard < 12; guard++) {
    if (await page.getByTestId('finished').isVisible()) return
    await page.getByTestId('next').click()
  }
}
const reset = async (page: Page, band: 1 | 2, lang: 'EN' | 'हिं') => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: lang, exact: true }).click()
  await page.getByTestId(`age-${band}`).click()
  // raise the daily cap so one test can visit everything
  await openSettings(page)
  await page.locator('input[type=range]').fill('6')
  await page.getByLabel(/✕|Close|बंद/).first().click()
}
async function openSettings(page: Page) {
  const box = (await page.getByTestId('parent-gate').boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down(); await page.waitForTimeout(1400); await page.mouse.up()
  await expect(page.getByTestId('settings')).toBeVisible()
}

for (const lang of ['EN', 'हिं'] as const)
  for (const band of [1, 2] as const)
    test(`click-through ${lang} band ${band}`, async ({ page }) => {
      await reset(page, band, lang)
      await page.getByTestId('nav-words').click()
      await page.getByTestId('todays-words').click(); await readThrough(page); await page.getByRole('button', { name: /Close|बंद/ }).click()
      const sets = page.getByTestId('wordset')
      const n = await sets.count()
      expect(n).toBe(band === 1 ? 6 : 10)
      await sets.first().click()
      await expect(page.getByTestId('caption')).not.toBeEmpty()
      await readThrough(page); await page.getByRole('button', { name: /Close|बंद/ }).click()
      if (band === 2) { await page.getByTestId('tracing').click(); await expect(page.getByTestId('trace-canvas')).toBeVisible(); await page.getByTestId('trace-done').click() }
      else await expect(page.getByTestId('tracing')).toHaveCount(0)

      await page.getByTestId('nav-stories').click()
      const stories = page.getByTestId('story')
      expect(await stories.count()).toBe(band === 1 ? 7 : 10)
      await stories.first().click(); await readThrough(page); await page.getByRole('button', { name: /Close|बंद/ }).click()

      await page.getByTestId('nav-habits').click()
      expect(await page.getByTestId('story').count()).toBe(7)

      await page.getByTestId('nav-play').click()
      await page.getByTestId('game').first().click()
      for (let r = 0; r < 4; r++) {
        const choices = page.getByTestId('choice')
        const q = await page.getByTestId('prompt').innerText()
        // try both; the wrong one gets gentle feedback and the right one always succeeds
        await choices.nth(0).click(); await choices.nth(1).click()
        await page.getByTestId('next').click()
        expect(q.length).toBeGreaterThan(3)
      }
      await expect(page.getByTestId('finished')).toBeVisible()
    })

test('daily cap shows the rest screen and disables the tabs', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload()
  await page.getByTestId('age-1').click()
  for (let k = 0; k < 2; k++) {
    await page.getByTestId('wordset').first().click(); await readThrough(page)
    await page.getByRole('button', { name: /Close/ }).click()
  }
  await expect(page.getByTestId('rest')).toBeVisible()
  await expect(page.getByTestId('nav-play')).toBeDisabled()
})

test('parent gate ignores a quick tap', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload()
  await page.getByTestId('age-1').click()
  await page.getByTestId('parent-gate').click()
  await expect(page.getByTestId('settings')).toHaveCount(0)
})
