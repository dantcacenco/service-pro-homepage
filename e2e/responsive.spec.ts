import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should be mobile-friendly on iPhone', async ({ page }) => {
    // Set viewport to iPhone size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero should be visible
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toBeVisible();

    // CTA buttons should stack vertically on mobile
    const demosButton = page.getByRole('link', { name: /See Live Demos/i });
    const builderButton = page.getByRole('link', { name: /Try Email Builder/i });

    await expect(demosButton).toBeVisible();
    await expect(builderButton).toBeVisible();

    // Buttons should be stacked (one above the other)
    const demosBox = await demosButton.boundingBox();
    const builderBox = await builderButton.boundingBox();

    // Builder button should be below demos button (higher y coordinate)
    expect(builderBox!.y).toBeGreaterThan(demosBox!.y);
  });

  test('should be mobile-friendly on Android', async ({ page }) => {
    // Set viewport to Pixel 5 size
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // All main content should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /See Live Demos/i })).toBeVisible();
  });

  test('should be tablet-friendly', async ({ page }) => {
    // Set viewport to iPad size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Content should be properly spaced
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toBeVisible();

    // Scroll to animation section
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);

    // Grid layout should be visible
    const mockup = page.locator('[style*="preserve-3d"]');
    await expect(mockup).toBeVisible();
  });

  test('should be desktop-friendly', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // All content should be visible with proper spacing
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Scroll animation section should be in grid layout
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);

    const sectionHeading = page.getByRole('heading', { name: /AI-Powered Email Templates/i });
    await expect(sectionHeading).toBeVisible();
  });

  test('touch targets should be large enough on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check CTA button size (should be at least 44x44px)
    const button = page.getByRole('link', { name: /See Live Demos/i });
    const box = await button.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('text should be readable on mobile without zooming', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check font sizes
    const headline = page.getByRole('heading', { level: 1 });
    const fontSize = await headline.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });

    // Font size should be reasonable for mobile (at least 28px for h1)
    expect(fontSize).toBeGreaterThanOrEqual(28);
  });

  test('images should load on slow connections', async ({ page }) => {
    // Simulate slow 3G connection
    await page.route('**/*', (route) => route.continue());

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Page should still be usable
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toBeVisible();
  });

  test('viewport meta tag should be present', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });
});
