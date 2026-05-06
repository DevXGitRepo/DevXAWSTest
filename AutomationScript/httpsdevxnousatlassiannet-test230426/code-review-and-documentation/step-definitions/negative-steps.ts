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
/*  Title: Error handling when parsing fails requiring manual review
/*  Priority: Medium
/*  Category: Negative / Error Handling
/*  Description: Validates graceful error handling for invalid search inputs
/**************************************************/

Given('the system is available', async function () {
  await homePage.navigate();
  await waits.waitForNetworkIdle();
  // TODO: Replace XPath with Object Repository when available
  const systemStatusXPath = '//div[@id="system-status"]';
  const statusLocator = page.locator(systemStatusXPath);
  if (await statusLocator.count() > 0) {
    await waits.waitForVisible(statusLocator);
  }
});

Given('test data is prepared for error handling scenarios', async function () {
  this.testData.errorHandling = {
    validSearchTerm: 'valid search term',
    invalidInputs: [
      '%%%invalid_syntax###',
      'SELECT * FROM; DROP TABLE',
      "<script>alert('xss')</script>",
      '',
      '@#$^&*()!~`'
    ]
  };
});

Given('user is on {string} page', async function (pageName: string) {
  // TODO: Replace XPath with Object Repository when available
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`/${pageSlug}`);
  await waits.waitForNetworkIdle();
  const pageHeaderXPath = `//h1[contains(text(),'${pageName}')]`;
  const headerLocator = page.locator(pageHeaderXPath);
  if (await headerLocator.count() > 0) {
    await waits.waitForVisible(headerLocator);
  }
});

Given('the search parsing service is active', async function () {
  // TODO: Replace XPath with Object Repository when available
  const serviceStatusXPath = '//div[@id="parsing-service-status"]';
  const serviceLocator = page.locator(serviceStatusXPath);
  if (await serviceLocator.count() > 0) {
    await waits.waitForVisible(serviceLocator);
  }
  this.parsingServiceActive = true;
});

// ==================== WHEN STEPS ====================

When('user enters {string} in {string} field', async function (value: string, fieldName: string) {
  // TODO: Replace XPath with Object Repository when available
  const fieldId = fieldName.toLowerCase().replace(/\s+/g, '-');
  const fieldXPath = `//input[@id='${fieldId}']`;
  const inputLocator = page.locator(fieldXPath);

  if (await inputLocator.count() > 0) {
    await actions.fill(inputLocator, value);
  } else {
    const textareaXPath = `//textarea[@id='${fieldId}']`;
    const textareaLocator = page.locator(textareaXPath);
    if (await textareaLocator.count() > 0) {
      await actions.fill(textareaLocator, value);
    } else {
      const labelXPath = `//label[contains(text(),'${fieldName}')]/following-sibling::input`;
      await actions.fill(page.locator(labelXPath), value);
    }
  }
});

When('user clicks {string} button', async function (buttonText: string) {
  // TODO: Replace XPath with Object Repository when available
  const buttonId = buttonText.toLowerCase().replace(/\s+/g, '-');
  const buttonXPath = `//button[@id='${buttonId}']`;
  const buttonLocator = page.locator(buttonXPath);

  if (await buttonLocator.count() > 0) {
    await actions.click(buttonLocator);
  } else {
    const textButtonXPath = `//button[contains(text(),'${buttonText}')]`;
    await actions.click(page.locator(textButtonXPath));
  }
  await waits.waitForNetworkIdle();
});

// ==================== THEN STEPS ====================

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: System stability is maintained after parsing failure
/*  Priority: Medium
/*  Category: Negative / Error Recovery
/*  Description: Validates system recovers after error and processes valid input
/**************************************************/

Then('error message {string} should be displayed', async function (expectedError: string) {
  // TODO: Replace XPath with Object Repository when available
  const errorMessageXPath = '//div[@id="error-message"]';
  const errorLocator = page.locator(errorMessageXPath);

  if (await errorLocator.count() > 0) {
    await waits.waitForVisible(errorLocator);
    await assertions.assertContainsText(errorLocator, expectedError);
  } else {
    const genericErrorXPath = `//*[contains(text(),'${expectedError}')]`;
    const genericLocator = page.locator(genericErrorXPath);
    await waits.waitForVisible(genericLocator);
    await assertions.assertVisible(genericLocator);
  }
});

Then('the system should remain stable', async function () {
  // TODO: Replace XPath with Object Repository when available
  const systemStatusXPath = '//div[@id="system-status"]';
  const statusLocator = page.locator(systemStatusXPath);

  if (await statusLocator.count() > 0) {
    await assertions.assertVisible(statusLocator);
  }

  const crashIndicatorXPath = '//div[@id="system-crash-indicator"]';
  const crashLocator = page.locator(crashIndicatorXPath);
  const crashCount = await crashLocator.count();
  expect(crashCount).toBe(0);
});

Then('no data corruption should occur', async function () {
  // TODO: Replace XPath with Object Repository when available
  const corruptionAlertXPath = '//div[@id="data-corruption-alert"]';
  const corruptionLocator = page.locator(corruptionAlertXPath);
  const corruptionCount = await corruptionLocator.count();
  expect(corruptionCount).toBe(0);

  const dataIntegrityXPath = '//div[@id="data-integrity-status"]';
  const integrityLocator = page.locator(dataIntegrityXPath);
  if (await integrityLocator.count() > 0) {
    await assertions.assertVisible(integrityLocator);
  }
});

Then('{string} notification should be visible', async function (notificationText: string) {
  // TODO: Replace XPath with Object Repository when available
  const notificationId = notificationText.toLowerCase().replace(/\s+/g, '-');
  const notificationXPath = `//div[@id='notification-${notificationId}']`;
  const notificationLocator = page.locator(notificationXPath);

  if (await notificationLocator.count() > 0) {
    await waits.waitForVisible(notificationLocator);
    await assertions.assertVisible(notificationLocator);
  } else {
    const textXPath = `//*[contains(text(),'${notificationText}')]`;
    await waits.waitForVisible(page.locator(textXPath));
    await assertions.assertVisible(page.locator(textXPath));
  }
});

Then('user should be able to recover from the error state', async function () {
  // TODO: Replace XPath with Object Repository when available
  const searchFieldXPath = '//input[@id="search-query"]';
  const searchLocator = page.locator(searchFieldXPath);
  await waits.waitForVisible(searchLocator);

  const isEnabled = await searchLocator.isEnabled();
  expect(isEnabled).toBe(true);

  const dismissXPath = '//button[@id="dismiss-error"]';
  const dismissLocator = page.locator(dismissXPath);
  if (await dismissLocator.count() > 0) {
    await actions.click(dismissLocator);
    await waits.waitForNetworkIdle();
  }
});

Then('the search results should be displayed successfully', async function () {
  // TODO: Replace XPath with Object Repository when available
  const resultsXPath = '//div[@id="search-results"]';
  const resultsLocator = page.locator(resultsXPath);
  await waits.waitForVisible(resultsLocator);
  await assertions.assertVisible(resultsLocator);

  const noResultsXPath = '//div[@id="no-results"]';
  const errorXPath = '//div[@id="error-message"]';
  const errorLocator = page.locator(errorXPath);
  const errorVisible = await errorLocator.count() > 0 && await errorLocator.isVisible();
  expect(errorVisible).toBe(false);
});

Then('no residual errors from previous failure should be present', async function () {
  // TODO: Replace XPath with Object Repository when available
  const errorMessageXPath = '//div[@id="error-message"]';
  const errorLocator = page.locator(errorMessageXPath);

  if (await errorLocator.count() > 0) {
    const isVisible = await errorLocator.isVisible();
    expect(isVisible).toBe(false);
  }

  const residualErrorXPath = '//div[contains(@class,"error-residual")]';
  const residualLocator = page.locator(residualErrorXPath);
  const residualCount = await residualLocator.count();
  expect(residualCount).toBe(0);
});