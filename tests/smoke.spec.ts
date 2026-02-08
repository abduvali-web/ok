import { expect, test } from '@playwright/test'

test('login page loads', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel(/email/i)).toBeVisible()
  await expect(page.getByLabel(/password|пароль/i)).toBeVisible()
})

test('theme from adminSettings applies html class', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adminSettings', JSON.stringify({ theme: 'dark' }))
  })

  await page.goto('/login')
  await expect(page.locator('html')).toHaveClass(/dark/)
})
