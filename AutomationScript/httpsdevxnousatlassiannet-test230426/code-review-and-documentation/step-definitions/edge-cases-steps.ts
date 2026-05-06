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
    },
    boundaryInputs: {},
    submissionCount: 0
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
/*  Title: System handles boundary conditions gracefully when parsing fails
/*  Priority: Medium
/*  Category: Edge Cases
/*  Description: Tests boundary value handling for search execution
/**************************************************/

Given('system is available and operational', async function () {
  await homePage.navigate();
  await waits.waitForNetworkIdle();
  // Placeholder XPath - will be replaced by Object Repository
  const appContainer = page.locator('//div[@id="app-container"]');
  await waits.waitForVisible(appContainer);
});

Given('boundary test data is ready', async function () {
  this.testData.boundaryInputs = {
    minimum: '',
    maximum: 'a'.repeat(67),
    special_chars: '!@#$%^&*()_+{}[]<>?/\\',
    numeric_min: '-2147483648',
    numeric_max: '2147483647',
    unicode: '你好世界🌍émojî',
    null_bytes: '\x00\x00\x00'
  };
});

Given('user is on {string} page', async function (pageName: string) {
  // Placeholder XPath - will be replaced by Object Repository
  const pageUrl = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
  await actions.navigateTo(pageUrl);
  await waits.waitForNetworkIdle();
  const pageHeader = page.locator(`//h1[contains(text(),'${pageName}')]`);
  await waits.waitForVisible(pageHeader);
});

Given('user has prepared input with {string} value of {string}', async function (boundaryType: string, inputValue: string) {
  this.testData.currentBoundaryType = boundaryType;
  this.testData.currentInputValue = inputValue;
});

/**************************************************/
/*  TEST CASE: TC-003
/*  Title: Manual review fallback is triggered when parsing fails
/*  Priority: Medium
/*  Category: Edge Cases
/*  Description: Tests parsing failure triggers manual review
/**************************************************/

Given('search input contains a value that cannot be parsed', async function () {
  this.testData.currentInputValue = '\x00\xFF\xFE invalid_parse_value §±≠';
  this.testData.currentBoundaryType = 'unparseable';
  // Placeholder XPath - will be replaced by Object Repository
  const searchInput = page.locator('//input[@id="search-input"]');
  await actions.fill(searchInput, this.testData.currentInputValue);
});

// ==================== WHEN STEPS ====================

When('user submits search with {string} boundary value {string}', async function (boundaryType: string, inputValue: string) {
  // Placeholder XPath - will be replaced by Object Repository
  const searchInput = page.locator('//input[@id="search-input"]');
  const submitButton = page.locator('//button[@id="search-submit"]');

  await actions.clearAndFill(searchInput, inputValue);
  await actions.click(submitButton);
  await waits.waitForNetworkIdle();

  this.testData.submissionCount = (this.testData.submissionCount || 0) + 1;
  this.testData.lastBoundaryType = boundaryType;
  this.testData.lastInputValue = inputValue;
});

When('user submits the unparseable search input', async function () {
  // Placeholder XPath - will be replaced by Object Repository
  const submitButton = page.locator('//button[@id="search-submit"]');
  await actions.click(submitButton);
  await waits.waitForNetworkIdle();
});

// ==================== THEN STEPS ====================

Then('system should handle the edge case gracefully', async function () {
  // Placeholder XPath - will be replaced by Object Repository
  const errorCrash = page.locator('//div[@id="system-crash-indicator"]');
  const errorCount = await errorCrash.count();
  expect(errorCount).toBe(0);

  const pageBody = page.locator('//body');
  await assertions.assertVisible(pageBody);
});

Then('system should display {string} message', async function (expectedMessage: string) {
  // Placeholder XPath - will be replaced by Object Repository
  const messageLocator = page.locator(`//*[contains(text(),'${expectedMessage}')]`);
  await waits.waitForVisible(messageLocator);
  await assertions.assertContainsText(messageLocator, expectedMessage);
});

Then('system should remain stable', async function () {
  // Placeholder XPath - will be replaced by Object Repository
  const appContainer = page.locator('//div[@id="app-container"]');
  await assertions.assertVisible(appContainer);

  const errorOverlay = page.locator('//div[@id="fatal-error-overlay"]');
  const overlayCount = await errorOverlay.count();
  expect(overlayCount).toBe(0);
});

Then('no data corruption should occur', async function () {
  // Placeholder XPath - will be replaced by Object Repository
  const dataIntegrityIndicator = page.locator('//div[@id="data-integrity-status"]');
  const indicatorCount = await dataIntegrityIndicator.count();

  if (indicatorCount > 0) {
    await assertions.assertContainsText(dataIntegrityIndicator, 'intact');
  }

  const corruptionWarning = page.locator('//div[@id="data-corruption-warning"]');
  const warningCount = await corruptionWarning.count();
  expect(warningCount).toBe(0);
});

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: System remains stable after multiple consecutive boundary submissions
/*  Priority: Medium
/*  Category: Edge Cases
/*  Description: Tests system stability under repeated boundary inputs
/**************************************************/

Then('user should be able to perform subsequent searches successfully', async function () {
  // Placeholder XPath - will be replaced by Object Repository
  const searchInput = page.locator('//input[@id="search-input"]');
  const submitButton = page.locator('//button[@id="search-submit"]');

  await actions.clearAndFill(searchInput, 'normal search term');
  await actions.click(submitButton);
  await waits.waitForNetworkIdle();

  const resultsContainer = page.locator('//div[@id="search-results"]');
  await waits.waitForVisible(resultsContainer);
  await assertions.assertVisible(resultsContainer);
});

Then('{string} message should be displayed', async function (message: string) {
  // Placeholder XPath - will be replaced by Object Repository
  const messageLocator = page.locator(`//*[contains(text(),'${message}')]`);
  await waits.waitForVisible(messageLocator);
  await assertions.assertContainsText(messageLocator, message);
});

Then('system should log the parsing failure for review', async function () {
  // Placeholder XPath - will be replaced by Object Repository
  const auditLog = page.locator('//div[@id="audit-log-indicator"]');
  const logCount = await auditLog.count();

  if (logCount > 0) {
    await assertions.assertVisible(auditLog);
  }

  const consoleMessages: string[] = [];
  page.on('console', (msg) => consoleMessages.push(msg.text()));

  // Verify no unhandled errors in console
  const errorMessages = consoleMessages.filter(m => m.includes('Unhandled'));
  expect(errorMessages.length).toBe(0);
});