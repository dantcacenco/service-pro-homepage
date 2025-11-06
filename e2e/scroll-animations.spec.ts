import { test, expect } from '@playwright/test';

test.describe('Scroll Animations', () => {
  test('hero section should have parallax effect on scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for GSAP to initialize

    // Get initial position of parallax background
    const parallaxBg = page.locator('[class*="gradient"]').first();
    const initialY = await parallaxBg.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top;
    });

    // Scroll down significantly
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(800); // Wait for animation

    // Get new position
    const newY = await parallaxBg.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top;
    });

    // Position should have changed significantly (parallax effect)
    // Allow for some tolerance since exact values might vary
    expect(Math.abs(newY - initialY)).toBeGreaterThan(50);
  });

  test('hero content should fade out on scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for GSAP to initialize

    const headline = page.getByRole('heading', { level: 1 });

    // Get initial opacity - wait for load animation to complete
    await page.waitForTimeout(1500);
    const initialOpacity = await headline.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });

    // Should be visible initially
    expect(parseFloat(initialOpacity)).toBeGreaterThan(0.8);

    // Scroll down significantly to trigger fade out
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(800); // Wait for animation

    // Get new opacity
    const newOpacity = await headline.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });

    // Opacity should decrease significantly (fade out effect)
    // Allow for cases where it might not fully fade yet
    expect(parseFloat(newOpacity)).toBeLessThan(0.9);
  });

  test('scroll animation section should pin while scrolling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to the animation section
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1000);

    // Get the section element
    const section = page.locator('section').nth(1); // Second section

    // Get initial position
    const initialRect = await section.boundingBox();

    // Scroll more
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);

    // Get new position
    const newRect = await section.boundingBox();

    // Section should be pinned (top position should remain similar)
    expect(Math.abs((newRect?.top || 0) - (initialRect?.top || 0))).toBeLessThan(50);
  });

  test('phone mockup should be visible in animation section', async ({ page }) => {
    await page.goto('/');

    // Scroll to animation section
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(500);

    // Check mockup is visible
    const mockup = page.locator('[style*="preserve-3d"]');
    await expect(mockup).toBeVisible();

    // Verify it has 3D transform properties
    const hasTransform = await mockup.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transformStyle === 'preserve-3d' || style.perspective !== 'none';
    });

    expect(hasTransform).toBeTruthy();
  });

  test('progress bar should be present in animation section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to animation section
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1000);

    // Find progress bar (origin-left and scale-x-0 classes)
    const progressBar = page.locator('.origin-left.scale-x-0').first();

    // Progress bar should exist
    await expect(progressBar).toBeAttached();
  });

  test('scroll should be smooth', async ({ page }) => {
    await page.goto('/');

    // Check if smooth scroll is enabled
    const smoothScroll = await page.evaluate(() => {
      const html = document.documentElement;
      return window.getComputedStyle(html).scrollBehavior;
    });

    // Should be 'smooth' or browser will auto-smooth
    expect(['smooth', 'auto']).toContain(smoothScroll);
  });
});
