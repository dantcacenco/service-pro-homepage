import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check the title
    await expect(page).toHaveTitle(/Service Pro/);
  });

  test('should display hero section with correct content', async ({ page }) => {
    await page.goto('/');

    // Check headline
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toBeVisible();
    await expect(headline).toContainText('Automate Your Business');

    // Check subheadline
    const subheadline = page.getByText('Custom automation solutions built for local service businesses');
    await expect(subheadline).toBeVisible();

    // Check CTA buttons
    const demosButton = page.getByRole('link', { name: /See Live Demos/i });
    const builderButton = page.getByRole('link', { name: /Try Email Builder/i });

    await expect(demosButton).toBeVisible();
    await expect(builderButton).toBeVisible();
  });

  test('should have scroll indicator visible', async ({ page }) => {
    await page.goto('/');

    // Check for scroll indicator (down arrow SVG)
    const scrollIndicator = page.locator('svg').filter({ has: page.locator('path[d*="M19 14l-7 7"]') }).first();
    await expect(scrollIndicator).toBeVisible();
  });

  test('should navigate to demos section when clicking CTA', async ({ page }) => {
    await page.goto('/');

    // Click the "See Live Demos" button
    const demosButton = page.getByRole('link', { name: /See Live Demos/i });
    await demosButton.click();

    // URL should have #demos hash
    await expect(page).toHaveURL(/#demos/);
  });

  test('should display scroll animation section', async ({ page }) => {
    await page.goto('/');

    // Scroll down to see the animation section
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // Wait a bit for scroll animation to start
    await page.waitForTimeout(1000);

    // Check for the animation section heading
    const sectionHeading = page.getByRole('heading', { name: /AI-Powered Email Templates/i });
    await expect(sectionHeading).toBeVisible();
  });

  test('should display features list in animation section', async ({ page }) => {
    await page.goto('/');

    // Scroll to animation section
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);

    // Check for feature items with checkmarks
    const features = page.locator('li').filter({ has: page.locator('svg path[d*="M5 13l4 4L19 7"]') });
    await expect(features).toHaveCount(4);

    // Verify some feature text
    await expect(page.getByText('Rank templates to teach the AI')).toBeVisible();
  });

  test('should display phone mockup in animation section', async ({ page }) => {
    await page.goto('/');

    // Scroll to animation section
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);

    // Check for phone mockup container
    const mockup = page.locator('[style*="transform-style: preserve-3d"]');
    await expect(mockup).toBeVisible();
  });

  test('should display coming soon section', async ({ page }) => {
    await page.goto('/');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check for coming soon heading
    const comingSoon = page.getByRole('heading', { name: /More Amazing Features Coming Soon/i });
    await expect(comingSoon).toBeVisible();
  });
});
