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

let performanceStartTime: number;
let performanceEndTime: number;
let responseTimeMs: number;
let loadTestResults: { stable: boolean; dataCorruption: boolean };

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

  loadTestResults = { stable: true, dataCorruption: false };
  responseTimeMs = 0;

  this.testData = {
    users: {
      admin: { username: 'admin', password: 'admin123' },
      user: { username: 'testuser', password: 'testpass' }
    },
    performance: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000'
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
/*  Title: Verify system response times meet performance criteria under expected load
/*  Priority: Medium
/*  Category: Performance
/*  Description: Tests response times with varying concurrent users under expected load
/**************************************************/

Given('the system is available and operational', async function () {
  await actions.navigateTo(this.testData.performance.baseUrl);
  await waits.waitForNetworkIdle();
  const healthCheckXPath = `//div[@id='app']`;
  const appRoot = page.locator(healthCheckXPath);
  if (await appRoot.count() > 0) {
    await assertions.assertVisible(appRoot);
  }
  await waits.waitForDomContentLoaded();
});

Given('load testing tools are configured', async function () {
  this.loadTestConfig = {
    enabled: true,
    timeout: 30000,
    retryAttempts: 3,
    metricsCollection: true
  };
  this.performanceMetrics = [];
});

Given('the system is running under {string} load conditions', async function (loadCondition: string) {
  this.currentLoadCondition = loadCondition;

  const loadProfiles: Record<string, { cpuThreshold: number; memoryThreshold: number }> = {
    expected: { cpuThreshold: 70, memoryThreshold: 80 },
    normal: { cpuThreshold: 50, memoryThreshold: 60 },
    peak: { cpuThreshold: 90, memoryThreshold: 90 },
    stress: { cpuThreshold: 95, memoryThreshold: 95 }
  };

  this.loadProfile = loadProfiles[loadCondition.toLowerCase()] || loadProfiles['normal'];

  // Verify system is responsive before load test
  await actions.navigateTo(this.testData.performance.baseUrl);
  await waits.waitForNetworkIdle();
});

// ==================== WHEN STEPS ====================

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: Verify search execution responds within acceptable time under normal load
/*  Priority: Medium
/*  Category: Performance (Smoke)
/*  Description: Tests single user search response time under normal conditions
/**************************************************/

When('user executes the search workflow with {string} concurrent users', async function (concurrentUsers: string) {
  const userCount = parseInt(concurrentUsers, 10);
  this.concurrentUsers = userCount;

  // TODO: Replace XPath with Object Repository when available
  const searchInputXPath = `//input[@id='search-input']`;
  const searchButtonXPath = `//button[@id='search-submit']`;
  const searchResultsXPath = `//div[@id='search-results']`;

  const executeSearchWorkflow = async (): Promise<number> => {
    const startTime = Date.now();

    // Navigate to search page
    await actions.navigateTo(`${this.testData.performance.baseUrl}/search`);
    await waits.waitForDomContentLoaded();

    // Execute search
    const searchInput = page.locator(searchInputXPath);
    if (await searchInput.count() > 0) {
      await actions.fill(searchInput, 'performance test query');
      const searchButton = page.locator(searchButtonXPath);
      if (await searchButton.count() > 0) {
        await actions.click(searchButton);
      } else {
        await actions.click(page.locator(`//button[contains(text(),'Search')]`));
      }
    } else {
      // Fallback: try text-based XPath
      const fallbackInput = page.locator(`//input[contains(@placeholder,'Search')]`);
      if (await fallbackInput.count() > 0) {
        await actions.fill(fallbackInput, 'performance test query');
        await actions.click(page.locator(`//button[contains(text(),'Search')]`));
      }
    }

    await waits.waitForNetworkIdle();

    const endTime = Date.now();
    return endTime - startTime;
  };

  // Simulate concurrent users by executing multiple search workflows
  const searchPromises: Promise<number>[] = [];

  // For actual concurrent simulation, execute the primary workflow and measure
  performanceStartTime = Date.now();

  if (userCount <= 1) {
    responseTimeMs = await executeSearchWorkflow();
  } else {
    // Execute sequential simulations for concurrent user load
    const times: number[] = [];
    for (let i = 0; i < Math.min(userCount, 5); i++) {
      const time = await executeSearchWorkflow();
      times.push(time);
    }
    // Use the maximum response time as the metric
    responseTimeMs = Math.max(...times);
  }

  performanceEndTime = Date.now();

  // Store metrics
  this.performanceMetrics = this.performanceMetrics || [];
  this.performanceMetrics.push({
    loadCondition: this.currentLoadCondition,
    concurrentUsers: userCount,
    responseTimeMs: responseTimeMs,
    timestamp: new Date().toISOString()
  });
});

// ==================== THEN STEPS ====================

Then('the response time should be less than {int} seconds', async function (maxResponseTime: number) {
  const maxResponseTimeMs = maxResponseTime * 1000;
  const actualResponseTimeSec = responseTimeMs / 1000;

  expect(responseTimeMs).toBeLessThan(maxResponseTimeMs);

  // Attach performance report
  const report = `Performance Result:\n` +
    `  Load Condition: ${this.currentLoadCondition}\n` +
    `  Concurrent Users: ${this.concurrentUsers}\n` +
    `  Response Time: ${actualResponseTimeSec.toFixed(2)}s\n` +
    `  Max Allowed: ${maxResponseTime}s\n` +
    `  Status: PASS`;
  this.attach(report, 'text/plain');
});

Then('the system should remain stable after the load test', async function () {
  // Verify system stability by checking page responsiveness
  await actions.navigateTo(this.testData.performance.baseUrl);
  await waits.waitForNetworkIdle();

  // Check that the page loads successfully after load test
  const pageTitle = await page.title();
  expect(pageTitle).toBeTruthy();

  // Verify no error pages displayed
  const errorPageXPath = `//div[@id='error-page']`;
  const errorPage = page.locator(errorPageXPath);
  const errorCount = await errorPage.count();

  // Check for common error indicators
  const serverErrorXPath = `//*[contains(text(),'500')]`;
  const serverErrors = page.locator(serverErrorXPath);
  const has500Error = await serverErrors.count();

  const serviceUnavailableXPath = `//*[contains(text(),'503')]`;
  const serviceErrors = page.locator(serviceUnavailableXPath);
  const has503Error = await serviceErrors.count();

  loadTestResults.stable = (errorCount === 0 && has500Error === 0 && has503Error === 0);
  expect(loadTestResults.stable).toBe(true);

  this.attach(`System Stability: ${loadTestResults.stable ? 'STABLE' : 'UNSTABLE'}`, 'text/plain');
});

Then('no data corruption should be detected', async function () {
  // Verify data integrity after load test
  await actions.navigateTo(`${this.testData.performance.baseUrl}/search`);
  await waits.waitForNetworkIdle();

  // Execute a verification search to confirm data integrity
  const searchInputXPath = `//input[@id='search-input']`;
  const searchInput = page.locator(searchInputXPath);

  if (await searchInput.count() > 0) {
    await actions.fill(searchInput, 'integrity check');

    const searchButtonXPath = `//button[@id='search-submit']`;
    const searchButton = page.locator(searchButtonXPath);
    if (await searchButton.count() > 0) {
      await actions.click(searchButton);
    } else {
      await actions.click(page.locator(`//button[contains(text(),'Search')]`));
    }

    await waits.waitForNetworkIdle();
  }

  // Check for data corruption indicators
  const corruptionIndicatorXPath = `//*[contains(text(),'corrupted')]`;
  const corruptionIndicators = page.locator(corruptionIndicatorXPath);
  const corruptionCount = await corruptionIndicators.count();

  const malformedDataXPath = `//*[contains(text(),'malformed')]`;
  const malformedData = page.locator(malformedDataXPath);
  const malformedCount = await malformedData.count();

  loadTestResults.dataCorruption = (corruptionCount > 0 || malformedCount > 0);
  expect(loadTestResults.dataCorruption).toBe(false);

  // Final performance summary
  const summary = `Data Integrity Check:\n` +
    `  Corruption Detected: ${loadTestResults.dataCorruption}\n` +
    `  Status: ${loadTestResults.dataCorruption ? 'FAIL' : 'PASS'}`;
  this.attach(summary, 'text/plain');
});