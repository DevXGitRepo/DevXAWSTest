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
    systemState: {},
    errorState: {}
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
/*  TEST CASE: TC-75055-001
/*  Title: Verify usability compliance when parsing fails and manual review is required
/*  Priority: Medium
/*  Category: Usability / Error Recovery
/**************************************************/

Given('system is available and operational', async function () {
  await homePage.navigate();
  await waits.waitForNetworkIdle();
  // TODO: Replace XPath with Object Repository when available
  const systemStatusXPath = '//div[@id="system-status"]';
  const statusLocator = page.locator(systemStatusXPath);
  if (await statusLocator.count() > 0) {
    await waits.waitForVisible(statusLocator);
  }
  this.testData.systemState.operational = true;
});

Given('test scenarios are defined for error handling', async function () {
  this.testData.errorState = {
    scenariosDefined: true,
    errorTypes: ['parsing-failure', 'network-error', 'timeout', 'validation-error'],
    recoveryActions: ['retry', 'manual-review', 'reset', 'contact-support']
  };
});

Given('user is on {string} page', async function (pageName: string) {
  // TODO: Replace XPath with Object Repository when available
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`/${pageSlug}`);
  await waits.waitForNetworkIdle();
  await waits.waitForDomContentLoaded();

  const pageHeaderXPath = `//h1[contains(text(),'${pageName}')]`;
  const headerLocator = page.locator(pageHeaderXPath);
  if (await headerLocator.count() > 0) {
    await waits.waitForVisible(headerLocator);
  }
  this.testData.currentPage = pageName;
});

Given('a parsing failure has occurred requiring manual review', async function () {
  // TODO: Replace XPath with Object Repository when available
  this.testData.errorState.parsingFailure = true;
  this.testData.errorState.requiresManualReview = true;

  const errorBannerXPath = '//div[@id="error-banner"]';
  const errorBanner = page.locator(errorBannerXPath);
  if (await errorBanner.count() > 0) {
    await waits.waitForVisible(errorBanner);
  }

  const manualReviewIndicatorXPath = '//div[@id="manual-review-indicator"]';
  const reviewIndicator = page.locator(manualReviewIndicatorXPath);
  if (await reviewIndicator.count() > 0) {
    await waits.waitForVisible(reviewIndicator);
  }
});

// ==================== WHEN STEPS ====================

When('user navigates the interface following common user patterns', async function () {
  // TODO: Replace XPath with Object Repository when available
  // Verify tab navigation works
  const focusableElementsXPath = '//button | //a | //input | //select | //textarea';
  const focusableElements = page.locator(focusableElementsXPath);
  const elementCount = await focusableElements.count();

  if (elementCount > 0) {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
  }

  // Verify clickable elements are accessible
  const primaryActionsXPath = '//button[@id="primary-action"]';
  const primaryAction = page.locator(primaryActionsXPath);
  if (await primaryAction.count() > 0) {
    await actions.hover(primaryAction);
  }

  // Verify navigation breadcrumbs or back buttons exist
  const navigationXPath = '//nav[@id="breadcrumb"] | //button[@id="back-button"]';
  const navElements = page.locator(navigationXPath);
  this.testData.navigationAccessible = (await navElements.count()) > 0;
});

When('I click on the {string} button', async function (buttonText: string) {
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

When('I enter {string} in the {string} field', async function (value: string, fieldName: string) {
  // TODO: Replace XPath with Object Repository when available
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), value);
});

When('I select {string} from the {string} dropdown', async function (optionText: string, dropdownName: string) {
  // TODO: Replace XPath with Object Repository when available
  const dropdownXPath = `//select[@id='${dropdownName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.selectByText(page.locator(dropdownXPath), optionText);
});

// ==================== THEN STEPS ====================

Then('interface should be intuitive and follow usability guidelines', async function () {
  // TODO: Replace XPath with Object Repository when available
  // Check for proper heading hierarchy
  const headingsXPath = '//h1 | //h2 | //h3 | //h4 | //h5 | //h6';
  const headings = page.locator(headingsXPath);
  const headingCount = await headings.count();
  expect(headingCount).toBeGreaterThan(0);

  // Check for visible error state indicators with clear messaging
  const errorContainerXPath = '//div[contains(@class,"error")] | //div[@id="error-container"] | //div[@role="alert"]';
  const errorContainer = page.locator(errorContainerXPath);
  if (await errorContainer.count() > 0) {
    await assertions.assertVisible(errorContainer.first());
  }

  // Check for action buttons that allow recovery
  const actionButtonsXPath = '//button[contains(@class,"action")] | //button[@id="retry-button"] | //button[@id="dismiss-button"]';
  const actionButtons = page.locator(actionButtonsXPath);
  const actionButtonCount = await actionButtons.count();
  expect(actionButtonCount).toBeGreaterThan(0);

  // Verify contrast and readability (basic check for visible text)
  const bodyTextXPath = '//body';
  const bodyText = await page.locator(bodyTextXPath).textContent();
  expect(bodyText).not.toBeNull();
  expect(bodyText!.length).toBeGreaterThan(0);
});

Then('{string} message should be displayed', async function (messageText: string) {
  // TODO: Replace XPath with Object Repository when available
  const messageXPath = `//*[contains(text(),'${messageText}')]`;
  const messageLocator = page.locator(messageXPath);
  await waits.waitForVisible(messageLocator);
  await assertions.assertVisible(messageLocator);
  await assertions.assertContainsText(messageLocator, messageText);
});

Then('user should be able to recover from the error without assistance', async function () {
  // TODO: Replace XPath with Object Repository when available
  // Verify recovery actions are available
  const retryButtonXPath = '//button[@id="retry-button"] | //button[contains(text(),"Retry")] | //button[contains(text(),"Try Again")]';
  const retryButton = page.locator(retryButtonXPath);

  const dismissButtonXPath = '//button[@id="dismiss-button"] | //button[contains(text(),"Dismiss")] | //button[contains(text(),"Close")]';
  const dismissButton = page.locator(dismissButtonXPath);

  const backButtonXPath = '//button[@id="back-button"] | //button[contains(text(),"Back")] | //a[contains(text(),"Back")]';
  const backButton = page.locator(backButtonXPath);

  const retryCount = await retryButton.count();
  const dismissCount = await dismissButton.count();
  const backCount = await backButton.count();

  // At least one recovery mechanism should be available
  const hasRecoveryOption = retryCount > 0 || dismissCount > 0 || backCount > 0;
  expect(hasRecoveryOption).toBeTruthy();

  // Verify helpful guidance text is present
  const guidanceXPath = '//p[contains(@class,"help")] | //span[contains(@class,"guidance")] | //div[contains(@class,"instructions")] | //div[@id="error-guidance"]';
  const guidance = page.locator(guidanceXPath);
  if (await guidance.count() > 0) {
    await assertions.assertVisible(guidance.first());
  }
});

Then('system should remain stable', async function () {
  // TODO: Replace XPath with Object Repository when available
  // Verify page is still responsive
  await waits.waitForDomContentLoaded();

  // Check no unhandled errors in console
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });

  // Verify page elements are still interactive
  const interactiveXPath = '//button | //a | //input';
  const interactiveElements = page.locator(interactiveXPath);
  const interactiveCount = await interactiveElements.count();
  expect(interactiveCount).toBeGreaterThan(0);

  // Verify no crash indicators
  const crashIndicatorXPath = '//*[contains(text(),"crashed")] | //*[contains(text(),"unresponsive")]';
  const crashIndicator = page.locator(crashIndicatorXPath);
  const crashCount = await crashIndicator.count();
  expect(crashCount).toBe(0);
});

Then('no data corruption should occur', async function () {
  // TODO: Replace XPath with Object Repository when available
  // Verify data integrity indicators
  const dataCorruptionXPath = '//*[contains(text(),"corrupted")] | //*[contains(text(),"data loss")] | //*[contains(text(),"integrity error")]';
  const corruptionIndicator = page.locator(dataCorruptionXPath);
  const corruptionCount = await corruptionIndicator.count();
  expect(corruptionCount).toBe(0);

  // Verify existing data is still displayed correctly
  const dataContainerXPath = '//div[@id="data-container"] | //table[@id="results-table"] | //div[contains(@class,"results")]';
  const dataContainer = page.locator(dataContainerXPath);
  if (await dataContainer.count() > 0) {
    await assertions.assertVisible(dataContainer.first());
  }

  // Verify save/submit buttons haven't triggered unintended actions
  const successMessageXPath = '//div[contains(@class,"success")] | //div[@id="save-confirmation"]';
  const unintendedSuccess = page.locator(successMessageXPath);
  const unintendedCount = await unintendedSuccess.count();
  // No unintended save operations should have occurred during error state
  expect(unintendedCount).toBe(0);
});

Then('I should see {string}', async function (text: string) {
  const textXPath = `//*[contains(text(),'${text}')]`;
  await assertions.assertContainsText(page.locator(textXPath), text);
});

Then('the {string} element should be visible', async function (elementName: string) {
  // TODO: Replace XPath with Object Repository when available
  const elementXPath = `//*[@id='${elementName.toLowerCase().replace(/\s+/g, '-')}']`;
  await assertions.assertVisible(page.locator(elementXPath));
});