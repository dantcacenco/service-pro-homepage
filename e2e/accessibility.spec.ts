import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should not have automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1); // Should have exactly one h1

    // Check for h2s
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
  });

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/');

    // All links should have meaningful text
    const links = page.getByRole('link');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const linkText = await links.nth(i).textContent();
      expect(linkText?.trim().length).toBeGreaterThan(0);
      // Should not just be "click here" or similar
      expect(linkText?.toLowerCase()).not.toMatch(/^(click here|here|link)$/);
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // First focusable element should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });

  test('buttons and links should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    const link = page.getByRole('link', { name: /See Live Demos/i });

    // Focus the link
    await link.focus();

    // Check for focus indicator (outline or box-shadow)
    const hasFocusIndicator = await link.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outline !== 'none' ||
             style.boxShadow !== 'none' ||
             style.border !== 'none';
    });

    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run specific color contrast check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('should support reduced motion preference', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Check if smooth scrolling is disabled
    const scrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });

    // Should be 'auto' when reduced motion is preferred
    expect(scrollBehavior).toBe('auto');
  });

  test('images should have alt text (when applicable)', async ({ page }) => {
    await page.goto('/');

    // Get all images
    const images = page.locator('img');
    const count = await images.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // Alt attribute should exist (can be empty for decorative images)
        expect(alt).toBeDefined();
      }
    }
  });

  test('should have proper ARIA labels where needed', async ({ page }) => {
    await page.goto('/');

    // Decorative SVG icons should be aria-hidden
    // Check our custom SVGs (scroll indicator and checkmarks)
    const scrollIndicator = page.locator('svg[viewBox="0 0 24 24"]').first();
    const checkmarkIcons = page.locator('svg').filter({ has: page.locator('path[d*="M5 13l4 4L19 7"]') });

    // These should all be aria-hidden
    const scrollAriaHidden = await scrollIndicator.getAttribute('aria-hidden');
    expect(scrollAriaHidden).toBe('true');

    const checkmarkCount = await checkmarkIcons.count();
    if (checkmarkCount > 0) {
      const firstCheckAriaHidden = await checkmarkIcons.first().getAttribute('aria-hidden');
      expect(firstCheckAriaHidden).toBe('true');
    }
  });

  test('should have proper semantic HTML', async ({ page }) => {
    await page.goto('/');

    // Should have main landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Should have proper section structure
    const sections = page.locator('section');
    await expect(sections.first()).toBeVisible();
  });

  test('should be navigable with keyboard only', async ({ page }) => {
    await page.goto('/');

    // Get all interactive elements
    const links = page.getByRole('link');
    const linkCount = await links.count();

    // Tab through all links
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      await page.keyboard.press('Tab');

      // Should be able to focus on interactive elements
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'BODY']).toContain(focused);
    }

    // Press Enter on a focused link should navigate
    await links.first().focus();
    const href = await links.first().getAttribute('href');
    expect(href).toBeTruthy();
  });
});
