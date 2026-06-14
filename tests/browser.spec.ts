import { test, expect, ElectronApplication, Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../../dist-electron/main.js')],
  })
  page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await electronApp.close()
})

test('app launches and shows new tab page', async () => {
  const title = await page.title()
  expect(title).toBe('Jarvis Browser')
})

test('tab bar renders with one tab', async () => {
  const tabs = await page.locator('[data-testid="tab-item"]').count()
  expect(tabs).toBeGreaterThanOrEqual(1)
})

test('creates a new tab with Ctrl+T', async () => {
  const before = await page.locator('[data-testid="tab-item"]').count()
  await page.keyboard.press('Control+t')
  const after = await page.locator('[data-testid="tab-item"]').count()
  expect(after).toBe(before + 1)
})

test('address bar accepts input', async () => {
  const addressBar = page.locator('input[placeholder*="Search or enter address"]')
  await addressBar.click()
  await addressBar.fill('https://example.com')
  expect(await addressBar.inputValue()).toBe('https://example.com')
})

test('can close a tab', async () => {
  await page.keyboard.press('Control+t') // open extra tab
  const before = await page.locator('[data-testid="tab-item"]').count()
  await page.keyboard.press('Control+w')
  const after = await page.locator('[data-testid="tab-item"]').count()
  expect(after).toBe(before - 1)
})

test('toggles history panel', async () => {
  await page.locator('[aria-label="History"]').click()
  await expect(page.locator('text=History')).toBeVisible()
  await page.locator('[aria-label="History"]').click()
})

test('toggles bookmarks panel', async () => {
  await page.locator('[aria-label="Bookmarks"]').click()
  await expect(page.locator('text=Bookmarks')).toBeVisible()
})

test('opens command palette with Ctrl+K', async () => {
  await page.keyboard.press('Control+k')
  await expect(page.locator('input[placeholder*="Search history"]')).toBeVisible()
  await page.keyboard.press('Escape')
})
