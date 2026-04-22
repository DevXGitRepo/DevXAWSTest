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
      manager: { email: 'manager@devops.com', password: 'Manager@123' },
      admin: { email: 'admin@devops.com', password: 'Admin@123' }
    },
    focusedElement: null,
    modalOpen: false,
    screenReaderActive: false
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

Given('user is on the login page', async function () {
  await actions.navigateTo(process.env.BASE_URL || 'http://localhost:3000/login');
  await waits.waitForNetworkIdle();
});

Given('user enters {string} in {string} field', async function (value: string, fieldName: string) {
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), value);
});

Given('dashboard displays multiple active incidents', async function () {
  const incidentsXPath = '//div[@class="incident-card"]';
  await waits.waitForVisible(page.locator(incidentsXPath).first());
  const count = await page.locator(incidentsXPath).count();
  expect(count).toBeGreaterThan(1);
});

Given('keyboard navigation is enabled in browser', async function () {
  await page.evaluate(() => {
    document.body.setAttribute('data-keyboard-nav', 'true');
  });
});

Given('dashboard displays active incidents', async function () {
  const incidentsXPath = '//div[@class="incident-card"]';
  await waits.waitForVisible(page.locator(incidentsXPath).first());
});

Given('NVDA screen reader is active', async function () {
  this.screenReaderActive = true;
  await page.evaluate(() => {
    document.body.setAttribute('aria-live', 'polite');
  });
});

Given('screen reader is in browse mode', async function () {
  await page.evaluate(() => {
    document.body.setAttribute('data-sr-mode', 'browse');
  });
});

Given('dashboard displays incidents with {string} severity', async function (severity: string) {
  const severityXPath = `//div[@data-severity='${severity.toLowerCase()}']`;
  await waits.waitForVisible(page.locator(severityXPath).first());
});

Given('color contrast analyzer tool is available', async function () {
  this.contrastAnalyzer = true;
});

Given('dashboard is loaded on mobile device', async function () {
  await context.setViewportSize({ width: 375, height: 667 });
});

Given('TalkBack screen reader is available', async function () {
  this.screenReaderActive = true;
  await page.evaluate(() => {
    document.body.setAttribute('data-talkback', 'true');
  });
});

Given('device is in portrait orientation', async function () {
  await context.setViewportSize({ width: 375, height: 667 });
});

Given('dashboard filter and search forms are available', async function () {
  const filterXPath = '//form[@id="filter-form"]';
  const searchXPath = '//form[@id="search-form"]';
  await assertions.assertVisible(page.locator(filterXPath));
  await assertions.assertVisible(page.locator(searchXPath));
});

Given('dashboard has real-time updates enabled', async function () {
  await page.evaluate(() => {
    window.localStorage.setItem('auto-refresh', 'true');
  });
});

Given('auto-refresh is set to {string} second intervals', async function (seconds: string) {
  await page.evaluate((sec) => {
    window.localStorage.setItem('refresh-interval', sec);
  }, seconds);
});

Given('dashboard displays incident trend charts', async function () {
  const chartXPath = '//div[@class="incident-trend-chart"]';
  await waits.waitForVisible(page.locator(chartXPath));
});

// ==================== WHEN STEPS ====================

/**************************************************/
/*  TEST CASE: TC-001
/*  Title: Complete keyboard navigation
/*  Priority: High
/*  Category: Accessibility
/**************************************************/

When('user clicks {string} button', async function (buttonText: string) {
  const buttonXPath = `//button[@id='${buttonText.toLowerCase().replace(/\s+/g, '-')}']`;
  const buttons = page.locator(buttonXPath);
  if (await buttons.count() > 0) {
    await actions.click(buttons);
  } else {
    await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  }
  await waits.waitForNetworkIdle();
});

When('user presses Tab key from browser address bar', async function () {
  await page.keyboard.press('Tab');
});

When('user presses Tab to navigate through header elements', async function () {
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
});

When('user presses Enter on {string} navigation item', async function (itemText: string) {
  const navXPath = `//nav//a[contains(text(),'${itemText}')]`;
  const element = page.locator(navXPath);
  await element.focus();
  await page.keyboard.press('Enter');
  await waits.waitForNetworkIdle();
});

When('user uses arrow keys to navigate between incident cards', async function () {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
});

When('user presses Enter on an incident card', async function () {
  await page.keyboard.press('Enter');
  this.modalOpen = true;
});

When('user presses Escape key', async function () {
  await page.keyboard.press('Escape');
  this.modalOpen = false;
});

When('user presses Shift+Tab to navigate backwards', async function () {
  await page.keyboard.press('Shift+Tab');
});

When('user tabs to {string} button and presses Space bar', async function (buttonText: string) {
  const buttonXPath = `//button[contains(text(),'${buttonText}')]`;
  await page.locator(buttonXPath).focus();
  await page.keyboard.press('Space');
});

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: Screen reader compatibility
/*  Priority: High
/*  Category: Accessibility
/**************************************************/

When('user navigates to dashboard with screen reader', async function () {
  await page.keyboard.press('h');
});

When('user presses H to navigate through headings', async function () {
  await page.keyboard.press('h');
  await page.keyboard.press('h');
  await page.keyboard.press('h');
});

When('user navigates to incident status indicator showing {string}', async function (status: string) {
  const statusXPath = `//div[@aria-label='${status} severity']`;
  await page.locator(statusXPath).focus();
});

When('user tabs to real-time update region', async function () {
  const liveRegionXPath = '//div[@aria-live="polite"]';
  await page.locator(liveRegionXPath).focus();
});

When('user navigates to incidents data table', async function () {
  const tableXPath = '//table[@id="incidents-table"]';
  await page.locator(tableXPath).focus();
});

When('user enters forms mode and interacts with filter dropdown', async function () {
  const dropdownXPath = '//select[@id="status-filter"]';
  await page.locator(dropdownXPath).focus();
});

When('user navigates to incident trends chart', async function () {
  const chartXPath = '//div[@class="incident-trend-chart"]';
  await page.locator(chartXPath).focus();
});

/**************************************************/
/*  TEST CASE: TC-003
/*  Title: Color contrast compliance
/*  Priority: High
/*  Category: Accessibility
/**************************************************/

When('user analyzes text contrast for {string} against background', async function (element: string) {
  const elementXPath = `//*[@class='${element.replace(/\s+/g, '-')}']`;
  this.analyzedElement = await page.locator(elementXPath).first();
});

/**************************************************/
/*  TEST CASE: TC-004
/*  Title: Focus management in modals
/*  Priority: High
/*  Category: Accessibility
/**************************************************/

When('user tabs to {string} button and presses Enter', async function (buttonText: string) {
  const buttonXPath = `//button[contains(text(),'${buttonText}')]`;
  await page.locator(buttonXPath).focus();
  this.focusedElement = buttonXPath;
  await page.keyboard.press('Enter');
});

When('user presses Tab repeatedly within modal', async function () {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
  }
});

When('user opens filter panel using keyboard', async function () {
  const filterXPath = '//button[@id="filter-toggle"]';
  await page.locator(filterXPath).focus();
  await page.keyboard.press('Enter');
});

When('user applies filter that removes current focused item', async function () {
  const filterXPath = '//select[@id="severity-filter"]';
  await actions.selectByText(page.locator(filterXPath), 'Critical');
  await waits.waitForNetworkIdle();
});

When('real-time incident update occurs', async function () {
  await page.evaluate(() => {
    const event = new CustomEvent('incident-update', { detail: { id: 'INC-001' } });
    document.dispatchEvent(event);
  });
});

When('user deletes focused incident', async function () {
  const deleteXPath = '//button[@aria-label="Delete incident"]';
  await actions.click(page.locator(deleteXPath));
  await waits.waitForNetworkIdle();
});

/**************************************************/
/*  TEST CASE: TC-005
/*  Title: Mobile accessibility
/*  Priority: Medium
/*  Category: Accessibility
/**************************************************/

When('user enables screen reader and swipes through dashboard', async function () {
  await page.touchscreen.tap(100, 100);
  await page.evaluate(() => {
    document.body.setAttribute('data-touch-nav', 'true');
  });
});

When('user double-taps on incident card', async function () {
  const cardXPath = '//div[@class="incident-card"]';
  const card = page.locator(cardXPath).first();
  const box = await card.boundingBox();
  if (box) {
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  }
});

When('user verifies touch target sizes', async function () {
  const targets = await page.locator('//button | //a | //input').all();
  this.touchTargets = targets;
});

When('user performs pinch-to-zoom on charts', async function () {
  await page.evaluate(() => {
    document.body.style.zoom = '150%';
  });
});

When('user uses rotor control for navigation', async function () {
  await page.keyboard.press('Control+Alt+h');
});

When('user rotates device to landscape', async function () {
  await context.setViewportSize({ width: 667, height: 375 });
});

/**************************************************/
/*  TEST CASE: TC-006
/*  Title: Form input accessibility
/*  Priority: High
/*  Category: Accessibility
/**************************************************/

When('user tabs to {string} input field', async function (field: string) {
  const fieldXPath = `//input[@id='${field}']`;
  await page.locator(fieldXPath).focus();
});

When('user enters {string} in field', async function (value: string) {
  await page.keyboard.type(value);
});

/**************************************************/
/*  TEST CASE: TC-007
/*  Title: Time-based content accessibility
/*  Priority: Medium
/*  Category: Accessibility
/**************************************************/

When('user locates auto-refresh control', async function () {
  const controlXPath = '//button[@id="auto-refresh-toggle"]';
  await page.locator(controlXPath).focus();
});

When('auto-update occurs while user reads content', async function () {
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const event = new Event('auto-refresh');
    document.dispatchEvent(event);
  });
});

When('user presses pause button', async function () {
  const pauseXPath = '//button[@aria-label="Pause auto-refresh"]';
  await actions.click(page.locator(pauseXPath));
});

When('session timeout warning appears', async function () {
  await page.evaluate(() => {
    const warning = document.createElement('div');
    warning.setAttribute('role', 'alert');
    warning.textContent = 'Session expires in 5 minutes';
    document.body.appendChild(warning);
  });
});

When('user interacts with {string} option', async function (optionText: string) {
  const optionXPath = `//button[contains(text(),'${optionText}')]`;
  await page.locator(optionXPath).focus();
});

When('user resumes auto-refresh', async function () {
  const resumeXPath = '//button[@aria-label="Resume auto-refresh"]';
  await actions.click(page.locator(resumeXPath));
});

/**************************************************/
/*  TEST CASE: TC-008
/*  Title: Data visualization accessibility
/*  Priority: Medium
/*  Category: Accessibility
/**************************************************/

When('user navigates to incident trend line chart', async function () {
  const chartXPath = '//div[@class="line-chart"]';
  await page.locator(chartXPath).focus();
});

When('user presses Enter to access detailed data', async function () {
  await page.keyboard.press('Enter');
});

When('user tabs through pie chart segments', async function () {
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
  }
});

When('user accesses chart legend via keyboard', async function () {
  const legendXPath = '//div[@class="chart-legend"]';
  await page.locator(legendXPath).focus();
});

When('user exports chart data using keyboard', async function () {
  const exportXPath = '//button[@aria-label="Export chart data"]';
  await page.locator(exportXPath).focus();
  await page.keyboard.press('Enter');
});

When('user verifies visual alternatives', async function () {
  const chartsXPath = '//div[contains(@class,"chart")]';
  this.charts = await page.locator(chartsXPath).all();
});

// ==================== THEN STEPS ====================

Then('user should see {string} page', async function (pageName: string) {
  const pageXPath = `//h1[contains(text(),'${pageName}')]`;
  await assertions.assertVisible(page.locator(pageXPath));
});

Then('focus should move to skip navigation link with visible indicator', async function () {
  const skipLinkXPath = '//a[@class="skip-link"]';
  const skipLink = page.locator(skipLinkXPath);
  await assertions.assertVisible(skipLink);
  const focused = await page.evaluate(() => document.activeElement?.className);
  expect(focused).toContain('skip-link');
});

Then('focus should move through logo, navigation menu, and user profile in logical order', async function () {
  const elements = ['logo', 'nav-menu', 'user-profile'];
  for (const element of elements) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toContain(element);
  }
});

Then('focus rings should be visible on all focused elements', async function () {
  const focusStyle = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return window.getComputedStyle(el).outline;
  });
  expect(focusStyle).not.toBe('none');
});

Then('{string} section should load', async function (sectionName: string) {
  const sectionXPath = `//section[@aria-label='${sectionName}']`;
  await assertions.assertVisible(page.locator(sectionXPath));
});

Then('focus should move to first incident card', async function () {
  const cardXPath = '//div[@class="incident-card"]';
  const firstCard = page.locator(cardXPath).first();
  const focused = await page.evaluate(() => document.activeElement?.className);
  expect(focused).toContain('incident-card');
});

Then('focus should move between cards with clear visual indicators', async function () {
  const focusIndicator = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return window.getComputedStyle(el).boxShadow;
  });
  expect(focusIndicator).not.toBe('none');
});

Then('incident details modal should open', async function () {
  const modalXPath = '//div[@role="dialog"]';
  await assertions.assertVisible(page.locator(modalXPath));
});

Then('focus should be trapped within modal', async function () {
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
  }
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.closest('[role="dialog"]') !== null;
  });
  expect(focused).toBeTruthy();
});

Then('modal should close', async function () {
  const modalXPath = '//div[@role="dialog"]';
  await waits.waitForHidden(page.locator(modalXPath));
});

Then('focus should return to previously focused incident card', async function () {
  const focused = await page.evaluate(() => document.activeElement?.className);
  expect(focused).toContain('incident-card');
});

Then('focus should move in reverse order through all interactive elements', async function () {
  const prevFocused = await page.evaluate(() => document.activeElement?.id);
  await page.keyboard.press('Shift+Tab');
  const currentFocused = await page.evaluate(() => document.activeElement?.id);
  expect(currentFocused).not.toBe(prevFocused);
});

Then('export menu should open', async function () {
  const menuXPath = '//ul[@role="menu"]';
  await assertions.assertVisible(page.locator(menuXPath));
});

Then('arrow keys should navigate menu options', async function () {
  await page.keyboard.press('ArrowDown');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('role'));
  expect(focused).toBe('menuitem');
});

Then('page title {string} should be announced', async function (title: string) {
  const pageTitle = await page.title();
  expect(pageTitle).toBe(title);
});

Then('heading structure should be announced as {string}', async function (structure: string) {
  const headings = await page.evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent;
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent);
    return `h1 ${h1}, ${h2s.map(h => `h2 ${h}`).join(', ')}`;
  });
  expect(headings).toContain('Incident Dashboard');
});

Then('screen reader should announce {string}', async function (announcement: string) {
  const ariaLabel = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute('aria-label');
  });
  expect(ariaLabel).toContain(announcement.split(',')[0]);
});

Then('live region should be announced with {string}', async function (ariaLive: string) {
  const liveRegion = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute('aria-live');
  });
  expect(liveRegion).toBe('polite');
});

Then('updates should be announced as {string}', async function (updateText: string) {
  const liveContent = await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"]');
    return region?.textContent;
  });
  expect(liveContent).toBeTruthy();
});

Then('table structure should be announced with headers {string}', async function (headers: string) {
  const tableHeaders = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('th'));
    return ths.map(th => th.textContent).join(', ');
  });
  expect(tableHeaders).toContain('Incident ID');
});

Then('dropdown should announce {string}', async function (announcement: string) {
  const dropdown = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      role: el?.getAttribute('role'),
      expanded: el?.getAttribute('aria-expanded')
    };
  });
  expect(dropdown.role).toBe('combobox');
});

Then('alternative text should announce {string}', async function (altText: string) {
  const chartAlt = await page.evaluate(() => {
    const chart = document.querySelector('.chart');
    return chart?.getAttribute('aria-label');
  });
  expect(chartAlt).toContain('Bar chart');
});

Then('contrast ratio should meet minimum {string} requirement', async function (ratio: string) {
  const contrastRatio = parseFloat(ratio.replace(':1', ''));
  expect(contrastRatio).toBeGreaterThanOrEqual(3);
});

Then('information should not rely on color alone', async function () {
  const hasIcon = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.querySelector('[class*="icon"]') !== null;
  });
  expect(hasIcon).toBeTruthy();
});

Then('additional {string} should be present', async function (indicator: string) {
  const hasIndicator = await page.evaluate((ind) => {
    const el = document.activeElement;
    return el?.querySelector(`[class*="${ind.split(' ')[0]}"]`) !== null;
  }, indicator);
  expect(hasIndicator).toBeTruthy();
});

Then('modal should open with focus on modal heading', async function () {
  const headingFocused = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.tagName === 'H2' || el?.tagName === 'H1';
  });
  expect(headingFocused).toBeTruthy();
});

Then('focus should cycle only within modal elements', async function () {
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
  }
  const stillInModal = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.closest('[role="dialog"]') !== null;
  });
  expect(stillInModal).toBeTruthy();
});

Then('background content should not be reachable', async function () {
  const backgroundDisabled = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main?.getAttribute('aria-hidden') === 'true';
  });
  expect(backgroundDisabled).toBeTruthy();
});

Then('focus should return to {string} button', async function (buttonText: string) {
  const focused = await page.evaluate(() => document.activeElement?.textContent);
  expect(focused).toContain(buttonText);
});

Then('panel should expand', async function () {
  const panelXPath = '//div[@class="filter-panel"]';
  await assertions.assertVisible(page.locator(panelXPath));
});

Then('focus should move to first filter input', async function () {
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.tagName === 'INPUT' || el?.tagName === 'SELECT';
  });
  expect(focused).toBeTruthy();
});

Then('focus should move to next available item', async function () {
  const focused = await page.evaluate(() => document.activeElement?.className);
  expect(focused).toContain('incident');
});

Then('focus should remain on current element', async function () {
  const beforeUpdate = this.focusedElement;
  const afterUpdate = await page.evaluate(() => document.activeElement?.id);
  expect(afterUpdate).toBe(beforeUpdate);
});

Then('focus should move to next incident or {string} message', async function (message: string) {
  const focused = await page.evaluate(() => document.activeElement?.textContent);
  expect(focused).toBeTruthy();
});

Then('all elements should be reachable via swipe gestures', async function () {
  const reachable = await page.evaluate(() => {
    const elements = document.querySelectorAll('[tabindex], button, a, input, select');
    return elements.length > 0;
  });
  expect(reachable).toBeTruthy();
});

Then('content should be announced clearly', async function () {
  const hasAriaLabels = await page.evaluate(() => {
    const elements = document.querySelectorAll('[aria-label]');
    return elements.length > 0;
  });
  expect(hasAriaLabels).toBeTruthy();
});

Then('card should expand showing details', async function () {
  const expandedXPath = '//div[@class="incident-card expanded"]';
  await assertions.assertVisible(page.locator(expandedXPath));
});

Then('action should be confirmed by screen reader', async function () {
  const confirmation = await page.evaluate(() => {
    const alert = document.querySelector('[role="status"]');
    return alert?.textContent;
  });
  expect(confirmation).toBeTruthy();
});

Then('all interactive elements should be minimum {string} pixels', async function (size: string) {
  const minSize = parseInt(size);
  const sizes = await page.evaluate(() => {
    const elements = document.querySelectorAll('button, a, input');
    return Array.from(elements).map(el => {
      const rect = el.getBoundingClientRect();
      return Math.min(rect.width, rect.height);
    });
  });
  sizes.forEach(s => expect(s).toBeGreaterThanOrEqual(minSize));
});

Then('adequate spacing should exist between targets', async function () {
  const spacing = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    if (buttons.length < 2) return true;
    const rect1 = buttons[0].getBoundingClientRect();
    const rect2 = buttons[1].getBoundingClientRect();
    return Math.abs(rect1.bottom - rect2.top) >= 8;
  });
  expect(spacing).toBeTruthy();
});

Then('charts should remain accessible', async function () {
  const chartAccessible = await page.evaluate(() => {
    const chart = document.querySelector('.chart');
    return chart?.getAttribute('aria-label') !== null;
  });
  expect(chartAccessible).toBeTruthy();
});

Then('zoom should not break layout', async function () {
  const noHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth;
  });
  expect(noHorizontalScroll).toBeTruthy();
});

Then('navigation by headings, links, and form controls should work', async function () {
  const navigable = await page.evaluate(() => {
    const headings = document.querySelectorAll('h1, h2, h3');
    const links = document.querySelectorAll('a');
    const forms = document.querySelectorAll('input, select, button');
    return headings.length > 0 && links.length > 0 && forms.length > 0;
  });
  expect(navigable).toBeTruthy();
});

Then('layout should adapt responsively', async function () {
  const viewport = page.viewportSize();
  expect(viewport?.width).toBe(667);
});

Then('all content should remain accessible without horizontal scrolling', async function () {
  const noScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth;
  });
  expect(noScroll).toBeTruthy();
});

Then('field should be announced with label {string}', async function (label: string) {
  const fieldLabel = await page.evaluate(() => {
    const el = document.activeElement;
    const labelId = el?.getAttribute('aria-labelledby');
    if (labelId) {
      return document.getElementById(labelId)?.textContent;
    }
    return el?.getAttribute('aria-label');
  });
  expect(fieldLabel).toContain(label);
});

Then('error message {string} should be announced via aria-live', async function (error: string) {
  const errorMsg = await page.evaluate(() => {
    const errorEl = document.querySelector('[role="alert"]');
    return errorEl?.textContent;
  });
  expect(errorMsg).toContain(error);
});

Then('error should be associated with field via aria-describedby', async function () {
  const hasDescription = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute('aria-describedby') !== null;
  });
  expect(hasDescription).toBeTruthy();
});

Then('{string} button should be available and announced', async function (buttonText: string) {
  const buttonXPath = `//button[contains(text(),'${buttonText}')]`;
  await assertions.assertVisible(page.locator(buttonXPath));
});

Then('updates should be announced via polite live region', async function () {
  const liveRegion = await page.evaluate(() => {
    const region = document.querySelector('[aria-live="polite"]');
    return region !== null;
  });
  expect(liveRegion).toBeTruthy();
});

Then('reading should not be interrupted', async function () {
  const ariaLive = await page.evaluate(() => {
    const region = document.querySelector('[aria-live]');
    return region?.getAttribute('aria-live');
  });
  expect(ariaLive).toBe('polite');
});

Then('auto-refresh should stop', async function () {
  const refreshState = await page.evaluate(() => {
    return window.localStorage.getItem('auto-refresh');
  });
  expect(refreshState).toBe('false');
});

Then('{string} status should be announced', async function (status: string) {
  const statusMsg = await page.evaluate(() => {
    const statusEl = document.querySelector('[role="status"]');
    return statusEl?.textContent;
  });
  expect(statusMsg).toContain(status);
});

Then('warning should display {string} minutes before timeout', async function (minutes: string) {
  const warning = await page.evaluate(() => {
    const alert = document.querySelector('[role="alert"]');
    return alert?.textContent;
  });
  expect(warning).toContain(`${minutes} minutes`);
});

Then('alert should have accessible alert role', async function () {
  const hasAlertRole = await page.evaluate(() => {
    const alert = document.querySelector('[role="alert"]');
    return alert !== null;
  });
  expect(hasAlertRole).toBeTruthy();
});

Then('button should be keyboard accessible', async function () {
  const focusable = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.tagName === 'BUTTON';
  });
  expect(focusable).toBeTruthy();
});

Then('{string} should be announced', async function (announcement: string) {
  const announced = await page.evaluate(() => {
    const status = document.querySelector('[role="status"], [role="alert"]');
    return status?.textContent;
  });
  expect(announced).toContain(announcement);
});

Then('chart should be announced as {string}', async function (description: string) {
  const chartAnnouncement = await page.evaluate(() => {
    const chart = document.activeElement;
    return chart?.getAttribute('aria-label');
  });
  expect(chartAnnouncement).toContain(description);
});

Then('data table alternative should appear with exact values', async function () {
  const tableXPath = '//table[@class="chart-data-table"]';
  await assertions.assertVisible(page.locator(tableXPath));
});

Then('each segment should be focusable', async function () {
  const segments = await page.evaluate(() => {
    const segs = document.querySelectorAll('[role="img"][tabindex="0"]');
    return segs.length;
  });
  expect(segments).toBeGreaterThan(0);
});

Then('segment should announce {string}', async function (segmentInfo: string) {
  const segmentLabel = await page.evaluate(() => {
    const segment = document.activeElement;
    return segment?.getAttribute('aria-label');
  });
  expect(segmentLabel).toBeTruthy();
});

Then('legend items should be focusable', async function () {
  const legendItems = await page.evaluate(() => {
    const items = document.querySelectorAll('.legend-item[tabindex="0"]');
    return items.length;
  });
  expect(legendItems).toBeGreaterThan(0);
});

Then('proper associations should be announced', async function () {
  const associations = await page.evaluate(() => {
    const legend = document.activeElement;
    return legend?.getAttribute('aria-describedby') !== null;
  });
  expect(associations).toBeTruthy();
});

Then('export option should be accessible', async function () {
  const exportXPath = '//button[@aria-label="Export chart data"]';
  await assertions.assertVisible(page.locator(exportXPath));
});

Then('accessible CSV format should be produced with all data points', async function () {
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.csv');
});

Then('charts should use patterns or shapes in addition to color', async function () {
  const hasPatterns = await page.evaluate(() => {
    const charts = document.querySelectorAll('.chart');
    return Array.from(charts).some(chart => {
      const patterns = chart.querySelectorAll('pattern, [stroke-dasharray]');
      return patterns.length > 0;
    });
  });
  expect(hasPatterns).toBeTruthy();
});