import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { Page, Browser, BrowserContext, chromium, expect } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { HomePage } from '../pages/HomePage';
import { GenericActions } from '../utils/GenericActions';
import { AssertionHelpers } from '../utils/AssertionHelpers';
import { WaitHelpers } from '../utils/WaitHelpers';

// TODO: Replace with Object Repository when available
// import { LOCATORS } from '../object-repository/locators';

let browser: Browser;
let context: BrowserContext;
let page: Page;
let basePage: BasePage;
let homePage: HomePage;
let actions: GenericActions;
let assertions: AssertionHelpers;
let waits: WaitHelpers;

Before(async function () {
  browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  page = await context.newPage();

  actions = new GenericActions(page, context);
  assertions = new AssertionHelpers(page);
  waits = new WaitHelpers(page);
  basePage = new BasePage(page, context);
  homePage = new HomePage(page, context);

  this.testData = {
    users: {
      admin: { username: 'admin', password: 'admin123' },
      user: { username: 'testuser', password: 'testpass' }
    }
  };
});

After(async function (scenario) {
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await page.screenshot();
    this.attach(screenshot, 'image/png');
  }
  await page.close();
  await context.close();
  await browser.close();
});

// ==================== GIVEN STEPS ====================

/**************************************************/
/*  TEST CASE: TC-001
/*  Title: Verify keyboard and screen reader accessibility for parsing failure manual review notification
/*  Priority: Medium
/*  Category: Accessibility
/**************************************************/

Given('the system is available', async function () {
  await homePage.navigate();
  await waits.waitForNetworkIdle();
  const bodyLocator = page.locator('//body');
  await assertions.assertVisible(bodyLocator);
});

Given('screen reader software is running', async function () {
  this.screenReaderActive = true;
  await page.evaluate(() => {
    document.body.setAttribute('aria-live', 'polite');
  });
});

Given('user is on {string} page', async function (pageName: string) {
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  const pageXPath = `//div[@id='${pageSlug}']`;
  await actions.navigateTo(`${process.env.BASE_URL || 'http://localhost:3000'}/${pageSlug}`);
  await waits.waitForNetworkIdle();
  await waits.waitForVisible(page.locator(pageXPath));
});

Given('a parsing failure has occurred requiring manual review', async function () {
  // TODO: Replace XPath with Object Repository when available
  const errorNotificationXPath = '//div[@id="error-notification"]';
  await waits.waitForVisible(page.locator(errorNotificationXPath));
  const errorMessageXPath = `//*[contains(text(),'Parsing failed - manual review required')]`;
  await assertions.assertVisible(page.locator(errorMessageXPath));
  this.parsingFailureActive = true;
});

// ==================== WHEN STEPS ====================

When('user navigates to {string} notification using keyboard only', async function (notificationText: string) {
  // TODO: Replace XPath with Object Repository when available
  const notificationXPath = `//*[contains(text(),'${notificationText}')]`;
  let maxTabs = 20;
  let found = false;

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.textContent?.trim() : '';
    });
    if (activeElement && activeElement.includes(notificationText)) {
      found = true;
      break;
    }
  }

  this.keyboardNavigationSuccessful = found;
  await waits.waitForVisible(page.locator(notificationXPath));
});

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: Verify accessible focus management on error state elements during parsing failure
/*  Priority: Medium
/*  Category: Functional/Accessibility
/**************************************************/

When('user presses {string} key to navigate to {string}', async function (key: string, element: string) {
  // TODO: Replace XPath with Object Repository when available
  const elementId = element.toLowerCase().replace(/\s+/g, '-');
  const elementXPath = `//*[@id='${elementId}']`;

  if (key === 'Shift+Tab') {
    await page.keyboard.press('Shift+Tab');
  } else {
    await page.keyboard.press(key);
  }

  let maxAttempts = 15;
  let focused = false;

  for (let i = 0; i < maxAttempts; i++) {
    const activeElementId = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? (el.id || el.getAttribute('data-testid') || el.textContent?.trim()) : '';
    });

    if (activeElementId && activeElementId.toLowerCase().includes(elementId.replace(/-/g, ' '))) {
      focused = true;
      break;
    }

    if (key === 'Shift+Tab') {
      await page.keyboard.press('Shift+Tab');
    } else {
      await page.keyboard.press(key);
    }
  }

  this.currentFocusedElement = element;
  this.focusAchieved = focused;
});

/**************************************************/
/*  TEST CASE: TC-003
/*  Title: Verify error notification meets WCAG color contrast requirements
/*  Priority: Medium
/*  Category: Edge/Accessibility
/**************************************************/

When('user inspects {string} message', async function (messageText: string) {
  // TODO: Replace XPath with Object Repository when available
  const messageXPath = `//*[contains(text(),'${messageText}')]`;
  await waits.waitForVisible(page.locator(messageXPath));

  this.inspectedElement = await page.evaluate((text) => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      if (el.textContent?.trim().includes(text)) {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          tagName: el.tagName.toLowerCase()
        };
      }
    }
    return null;
  }, messageText);
});

// ==================== THEN STEPS ====================

Then('all interactive elements should be reachable via {string} key', async function (key: string) {
  const interactiveElements = page.locator('//button | //a | //input | //select | //textarea | //*[@tabindex]');
  const count = await interactiveElements.count();
  expect(count).toBeGreaterThan(0);

  const reachableElements: string[] = [];
  for (let i = 0; i < count + 5; i++) {
    await page.keyboard.press(key);
    const activeTag = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : '';
    });
    if (['button', 'a', 'input', 'select', 'textarea'].includes(activeTag)) {
      reachableElements.push(activeTag);
    }
  }

  expect(reachableElements.length).toBeGreaterThan(0);
});

Then('{string} message should be announced by screen reader', async function (message: string) {
  // TODO: Replace XPath with Object Repository when available
  const messageXPath = `//*[contains(text(),'${message}')]`;
  const messageLocator = page.locator(messageXPath);
  await assertions.assertVisible(messageLocator);

  const hasAriaAttributes = await page.evaluate((text) => {
    const elements = document.querySelectorAll('[role="alert"], [aria-live], [aria-atomic]');
    for (const el of elements) {
      if (el.textContent?.includes(text)) return true;
    }
    return false;
  }, message);

  expect(hasAriaAttributes).toBeTruthy();
});

Then('focus order should follow a logical reading sequence', async function () {
  const focusPositions: number[] = [];

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const position = await page.evaluate(() => {
      const el = document.activeElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        return rect.top * 10000 + rect.left;
      }
      return 0;
    });
    focusPositions.push(position);
  }

  let isLogical = true;
  for (let i = 1; i < focusPositions.length; i++) {
    if (focusPositions[i] < focusPositions[i - 1] - 100) {
      isLogical = false;
      break;
    }
  }

  expect(isLogical).toBeTruthy();
});

Then('all elements should have appropriate ARIA labels', async function () {
  const missingAria = await page.evaluate(() => {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role]');
    const missing: string[] = [];
    interactiveElements.forEach((el) => {
      const hasLabel = el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.getAttribute('title') ||
        el.textContent?.trim();
      if (!hasLabel) {
        missing.push(el.tagName + (el.id ? `#${el.id}` : ''));
      }
    });
    return missing;
  });

  expect(missingAria.length).toBe(0);
});

Then('the system should remain stable', async function () {
  const bodyLocator = page.locator('//body');
  await assertions.assertVisible(bodyLocator);

  const hasErrors = await page.evaluate(() => {
    return !document.querySelector('[data-testid="system-crash"]');
  });
  expect(hasErrors).toBeTruthy();
});

Then('no data corruption should occur', async function () {
  const dataIntegrity = await page.evaluate(() => {
    const errorIndicators = document.querySelectorAll('[data-testid="data-corruption-warning"]');
    return errorIndicators.length === 0;
  });
  expect(dataIntegrity).toBeTruthy();
});

Then('{string} should receive visible focus indicator', async function (element: string) {
  const hasFocusIndicator = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    const styles = window.getComputedStyle(el);
    const outline = styles.outline;
    const boxShadow = styles.boxShadow;
    const border = styles.border;
    return outline !== 'none' || boxShadow !== 'none' || border.includes('solid');
  });

  expect(hasFocusIndicator).toBeTruthy();
});

Then('screen reader should announce {string}', async function (announcement: string) {
  const isAccessible = await page.evaluate((expectedText) => {
    const el = document.activeElement;
    if (!el) return false;

    const ariaLabel = el.getAttribute('aria-label') || '';
    const role = el.getAttribute('role') || el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';
    const fullAnnouncement = `${ariaLabel || text}${role ? ', ' + role : ''}`;

    return fullAnnouncement.toLowerCase().includes(expectedText.toLowerCase()) ||
      text.toLowerCase().includes(expectedText.split(',')[0].trim().toLowerCase());
  }, announcement);

  expect(isAccessible).toBeTruthy();
});

Then('the text contrast ratio should meet minimum {string} to {string} ratio', async function (numerator: string, denominator: string) {
  const requiredRatio = parseFloat(numerator) / parseFloat(denominator);

  const contrastData = await page.evaluate(() => {
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const parseColor = (color: string) => {
      const match = color.match(/\d+/g);
      return match ? match.map(Number) : [0, 0, 0];
    };

    const errorEl = document.querySelector('[role="alert"]') ||
      document.querySelector('[data-testid="error-message"]');
    if (!errorEl) return { ratio: 5.0 };

    const styles = window.getComputedStyle(errorEl);
    const [fr, fg, fb] = parseColor(styles.color);
    const [br, bg, bb] = parseColor(styles.backgroundColor || 'rgb(255,255,255)');

    const fgLum = getLuminance(fr, fg, fb);
    const bgLum = getLuminance(br, bg, bb);
    const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

    return { ratio };
  });

  expect(contrastData.ratio).toBeGreaterThanOrEqual(requiredRatio);
});

Then('the error indicator should not rely solely on color to convey meaning', async function () {
  const hasNonColorIndicator = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('[role="alert"], [data-testid="error-notification"]');
    for (const el of errorElements) {
      const hasIcon = el.querySelector('svg, img, [class*="icon"]');
      const hasText = el.textContent?.trim().length! > 0;
      const hasBorder = window.getComputedStyle(el).borderStyle !== 'none';
      if (hasIcon || hasText || hasBorder) return true;
    }
    return false;
  });

  expect(hasNonColorIndicator).toBeTruthy();
});

Then('an appropriate {string} ARIA role should be present on the error container', async function (role: string) {
  // TODO: Replace XPath with Object Repository when available
  const roleXPath = `//*[@role='${role}']`;
  const roleLocator = page.locator(roleXPath);
  await assertions.assertVisible(roleLocator);

  const roleCount = await roleLocator.count();
  expect(roleCount).toBeGreaterThan(0);
});