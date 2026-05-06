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
/*  Title: Verify graceful error handling when search parsing fails
/*  Priority: Medium
/*  Category: Functional
/*  Description: Tests main search workflow stability
/**************************************************/

Given('the system is available', async function () {
  await homePage.navigate();
  await waits.waitForNetworkIdle();
  // TODO: Replace XPath with Object Repository when available
  await assertions.assertVisible(page.locator('//body'));
});

Given('user is authenticated', async function () {
  const credentials = this.testData?.users?.user || { username: 'testuser', password: 'testpass' };
  // TODO: Replace XPath with Object Repository when available
  const loginForm = page.locator('//form[@id="login-form"]');
  if (await loginForm.count() > 0) {
    await actions.fill(page.locator('//input[@id="username"]'), credentials.username);
    await actions.fill(page.locator('//input[@id="password"]'), credentials.password);
    await actions.click(page.locator('//button[@id="login"]'));
    await waits.waitForNetworkIdle();
  }
});

/**************************************************/
/*  TEST CASE: TC-003
/*  Title: Verify manual review notification when parsing fails
/*  Priority: Medium
/*  Category: Functional
/*  Description: Tests parsing failure notification and retry
/**************************************************/

Given('user is on {string} page', async function (pageName: string) {
  // TODO: Replace XPath with Object Repository when available
  const pageUrl = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
  await actions.navigateTo(pageUrl);
  await waits.waitForNetworkIdle();
  const pageHeaderXPath = `//*[contains(text(),'${pageName}')]`;
  await waits.waitForVisible(page.locator(pageHeaderXPath));
});

// ==================== WHEN STEPS ====================

When('user executes the main search workflow', async function () {
  // TODO: Replace XPath with Object Repository when available
  const searchFieldXPath = '//input[@id="search"]';
  const searchButtonXPath = '//button[@id="search-submit"]';
  await actions.fill(page.locator(searchFieldXPath), 'test search query');
  await actions.click(page.locator(searchButtonXPath));
  await waits.waitForNetworkIdle();
});

When('user performs a search with {string} in {string} field', async function (searchInput: string, fieldName: string) {
  // TODO: Replace XPath with Object Repository when available
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), searchInput);
  await actions.click(page.locator('//button[@id="search-submit"]'));
  await waits.waitForNetworkIdle();
});

When('search parsing encounters {string} error', async function (errorType: string) {
  // Store error type for validation in Then steps
  this.currentErrorType = errorType;
  // Wait for error state to be reflected in UI
  await waits.waitForVisible(page.locator('//div[@id="error-container"]'));
});

When('user enters {string} in {string} field', async function (value: string, fieldName: string) {
  // TODO: Replace XPath with Object Repository when available
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), value);
});

When('user clicks {string} button', async function (buttonText: string) {
  // TODO: Replace XPath with Object Repository when available
  const buttonIdXPath = `//button[@id='${buttonText.toLowerCase().replace(/\s+/g, '-')}']`;
  const buttons = page.locator(buttonIdXPath);
  if (await buttons.count() > 0) {
    await actions.click(buttons);
  } else {
    await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  }
  await waits.waitForNetworkIdle();
});

When('the system fails to parse the search input', async function () {
  // TODO: Replace XPath with Object Repository when available
  await waits.waitForVisible(page.locator('//div[@id="parsing-error-notification"]'));
});

// ==================== THEN STEPS ====================

Then('all expected search features should work correctly', async function () {
  // TODO: Replace XPath with Object Repository when available
  const searchResultsXPath = '//div[@id="search-results"]';
  await assertions.assertVisible(page.locator(searchResultsXPath));
});

Then('the system should remain stable', async function () {
  // TODO: Replace XPath with Object Repository when available
  const errorCrashXPath = '//div[@id="system-crash-error"]';
  const crashElements = page.locator(errorCrashXPath);
  const count = await crashElements.count();
  expect(count).toBe(0);
  await assertions.assertVisible(page.locator('//body'));
});

Then('no data corruption should occur', async function () {
  // TODO: Replace XPath with Object Repository when available
  const corruptionWarningXPath = '//div[@id="data-corruption-warning"]';
  const corruptionElements = page.locator(corruptionWarningXPath);
  const count = await corruptionElements.count();
  expect(count).toBe(0);
});

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: Verify error recovery for search execution failures
/*  Priority: Medium
/*  Category: Functional
/*  Description: Tests error recovery with various error types
/**************************************************/

Then('user should see {string} message', async function (expectedMessage: string) {
  // TODO: Replace XPath with Object Repository when available
  const messageXPath = `//*[contains(text(),'${expectedMessage}')]`;
  await waits.waitForVisible(page.locator(messageXPath));
  await assertions.assertVisible(page.locator(messageXPath));
});

Then('user should be able to retry the search', async function () {
  // TODO: Replace XPath with Object Repository when available
  const retryButtonXPath = '//button[@id="retry-search"]';
  const retryButtons = page.locator(retryButtonXPath);
  if (await retryButtons.count() > 0) {
    await assertions.assertVisible(retryButtons);
  } else {
    const fallbackXPath = '//button[contains(text(),"Retry")]';
    await assertions.assertVisible(page.locator(fallbackXPath));
  }
});

Then('{string} button should be enabled', async function (buttonText: string) {
  // TODO: Replace XPath with Object Repository when available
  const buttonIdXPath = `//button[@id='${buttonText.toLowerCase().replace(/\s+/g, '-')}']`;
  const buttons = page.locator(buttonIdXPath);
  let targetButton;
  if (await buttons.count() > 0) {
    targetButton = buttons;
  } else {
    targetButton = page.locator(`//button[contains(text(),'${buttonText}')]`);
  }
  await assertions.assertVisible(targetButton);
  const isDisabled = await targetButton.isDisabled();
  expect(isDisabled).toBe(false);
});