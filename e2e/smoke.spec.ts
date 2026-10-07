import { expect, test, type Page } from '@playwright/test'

/** Click through every kind of item, in both languages. There is one audience now (ages 2-3), so no age screen. */
async function readThrough(page: Page) {
  for (let guard = 0; guard < 14; guard++) {
    if (await page.getByTestId('finished').isVisible()) return
    await page.waitForTimeout(400) // next ignores taps closer than 350 ms
    await page.getByTestId('next').click()
  }
}
async function openSettings(page: Page) {
  const box = (await page.getByTestId('parent-gate').boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down(); await page.waitForTimeout(1400); await page.mouse.up()
  await expect(page.getByTestId('settings')).toBeVisible()
}
const fresh = async (page: Page) => { await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload() }
const closeFinished = (page: Page) => page.getByRole('button', { name: /^Close$|^बंद करें$/ }).click()

test('opens straight to the home screen with no age question', async ({ page }) => {
  await fresh(page)
  await expect(page.getByTestId('tab-stories')).toBeVisible()
  await expect(page.getByTestId('age-1')).toHaveCount(0)
  await openSettings(page)
  await expect(page.getByText(/Child's age|बच्चे की उम्र/)).toHaveCount(0)
})

for (const lang of ['EN', 'हिं'] as const)
  test(`click-through ${lang}`, async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: lang, exact: true }).click()
    await openSettings(page)
    await page.locator('input[type=range]').fill('6') // raise the cap so one test can visit everything
    await page.getByTestId('back').click()

    await page.getByTestId('nav-words').click()
    await page.getByTestId('todays-words').click(); await readThrough(page); await closeFinished(page)
    const sets = page.getByTestId('wordset')
    expect(await sets.count()).toBe(10)
    await sets.first().click()
    await expect(page.getByTestId('caption')).not.toBeEmpty()
    await readThrough(page); await closeFinished(page)
    await page.getByTestId('tracing').click(); await expect(page.getByTestId('trace-canvas')).toBeVisible(); await page.getByTestId('trace-done').click()

    await page.getByTestId('nav-stories').click()
    const stories = page.getByTestId('story')
    expect(await stories.count()).toBe(13) // 3 rhymes + 4 big days + 6 folk tales
    await stories.first().click(); await readThrough(page); await closeFinished(page)

    await page.getByTestId('nav-habits').click()
    expect(await page.getByTestId('story').count()).toBe(7)

    await page.getByTestId('nav-play').click()
    await page.getByTestId('game').first().click()
    for (let r = 0; r < 4; r++) {
      const choices = page.getByTestId('choice')
      expect((await page.getByTestId('prompt').innerText()).length).toBeGreaterThan(3)
      await choices.nth(0).click(); await choices.nth(1).click() // one is wrong: gentle feedback, and the right one always succeeds
      await page.waitForTimeout(400)
      await page.getByTestId('next').click()
    }
    await expect(page.getByTestId('finished')).toBeVisible()
  })

test('daily cap of 3 shows the rest screen and disables the tabs', async ({ page }) => {
  await fresh(page)
  await page.getByTestId('nav-words').click()
  for (let k = 0; k < 3; k++) {
    await page.getByTestId('wordset').first().click(); await readThrough(page); await closeFinished(page)
  }
  await expect(page.getByTestId('rest')).toBeVisible()
  await expect(page.getByTestId('nav-play')).toBeDisabled()
})

test('parent gate ignores a quick tap', async ({ page }) => {
  await fresh(page)
  await page.getByTestId('parent-gate').click()
  await expect(page.getByTestId('settings')).toHaveCount(0)
})

test('Back returns from a story to the home screen', async ({ page }) => {
  await fresh(page)
  await page.getByTestId('story').first().click()
  await expect(page.getByTestId('reader')).toBeVisible()
  await page.getByTestId('back').click()
  await expect(page.getByTestId('tab-stories')).toBeVisible()
})
