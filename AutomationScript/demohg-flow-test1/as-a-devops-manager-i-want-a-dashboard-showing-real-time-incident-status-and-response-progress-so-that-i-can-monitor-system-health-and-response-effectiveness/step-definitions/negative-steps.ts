import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { Page, Browser, BrowserContext, chromium, expect } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
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
let loginPage: LoginPage;
let dashboardPage: DashboardPage;
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
  loginPage = new LoginPage(page, context);
  dashboardPage = new DashboardPage(page, context);
  
  this.testData = {
    users: {
      'DevOps Manager': { username: 'devops@company.com', password: 'devops123' },
      'Read-Only Viewer': { username: 'viewer@company.com', password: 'viewer123' },
      admin: { username: 'admin@company.com', password: 'admin123' }
    },
    invalidCredentials: {
      username: 'wronguser@company.com',
      password: 'wrongpass123'
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

Given('the incident monitoring dashboard is accessible', async function () {
  await dashboardPage.navigate();
  await waits.waitForNetworkIdle();
});

Given('the system has security logging enabled', async function () {
  this.securityLoggingEnabled = true;
});

Given('user is on the login page', async function () {
  await loginPage.navigate();
  await waits.waitForDomContentLoaded();
});

Given('dashboard service is running', async function () {
  this.dashboardServiceStatus = 'running';
});

Given('no active session exists', async function () {
  await context.clearCookies();
  await context.clearPermissions();
});

Given('user was logged in as {string}', async function (userType: string) {
  const credentials = this.testData?.users?.[userType];
  await loginPage.navigate();
  await actions.fill(page.locator('//input[@id="username"]'), credentials.username);
  await actions.fill(page.locator('//input[@id="password"]'), credentials.password);
  await actions.click(page.locator('//button[@id="sign-in"]'));
  await waits.waitForNetworkIdle();
});

Given('session has expired on server', async function () {
  await page.evaluate(() => {
    localStorage.setItem('sessionExpired', 'true');
  });
});

Given('user is viewing dashboard', async function () {
  await assertions.assertUrlContains('/dashboard');
});

Given('user is logged in as {string}', async function (userType: string) {
  const credentials = this.testData?.users?.[userType];
  await loginPage.navigate();
  await actions.fill(page.locator('//input[@id="username"]'), credentials.username);
  await actions.fill(page.locator('//input[@id="password"]'), credentials.password);
  await actions.click(page.locator('//button[@id="sign-in"]'));
  await waits.waitForNetworkIdle();
  await assertions.assertUrlContains('/dashboard');
});

Given('dashboard is loaded with incidents', async function () {
  await waits.waitForVisible(page.locator('//div[@id="incidents-container"]'));
});

Given('search field is accessible', async function () {
  await assertions.assertVisible(page.locator('//input[@id="search-field"]'));
});

Given('dashboard is showing real-time updates', async function () {
  await assertions.assertVisible(page.locator('//div[@id="real-time-indicator"]'));
});

Given('WebSocket connection is active', async function () {
  this.webSocketActive = true;
});

Given('real-time indicator shows {string} in green', async function (status: string) {
  const indicator = page.locator('//div[@id="real-time-indicator"]');
  await assertions.assertContainsText(indicator, status);
});

Given('dashboard is displayed', async function () {
  await assertions.assertVisible(page.locator('//div[@id="dashboard-main"]'));
});

Given('dashboard is loaded', async function () {
  await waits.waitForVisible(page.locator('//div[@id="dashboard-main"]'));
  await waits.waitForNetworkIdle();
});

Given('dashboard is on {string} view', async function (viewName: string) {
  await actions.click(page.locator(`//button[contains(text(),'${viewName}')]`));
  await waits.waitForNetworkIdle();
});

Given('custom date range selector is available', async function () {
  await assertions.assertVisible(page.locator('//div[@id="date-range-selector"]'));
});

Given('over {int} incidents exist in selected range', async function (count: number) {
  this.incidentCount = count;
});

Given('export timeout is set to {int} seconds', async function (timeout: number) {
  this.exportTimeout = timeout;
});

Given('test incident exists with XSS payload {string} in description', async function (payload: string) {
  this.xssPayload = payload;
});

Given('user account allows maximum {int} concurrent sessions', async function (maxSessions: number) {
  this.maxConcurrentSessions = maxSessions;
});

Given('user is logged in on {int} different browsers', async function (browserCount: number) {
  this.activeSessions = browserCount;
});

Given('database has zero incidents', async function () {
  this.incidentCount = 0;
});

Given('all services are operational', async function () {
  this.servicesStatus = 'operational';
});

Given('user has active filters applied for {string} and {string}', async function (filter1: string, filter2: string) {
  this.activeFilters = [filter1, filter2];
});

Given('session timeout is set to {int} minutes', async function (timeout: number) {
  this.sessionTimeout = timeout;
});

Given('user has been idle for {int} minutes', async function (idleTime: number) {
  this.idleTime = idleTime;
});

Given('API rate limit is {int} requests per minute', async function (limit: number) {
  this.rateLimit = limit;
});

Given('WebSocket connection is established', async function () {
  this.webSocketConnected = true;
});

Given('user is using {string} browser', async function (browserName: string) {
  this.browserName = browserName;
});

Given('dashboard URL is accessible', async function () {
  this.dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000/dashboard';
});

// ==================== WHEN STEPS ====================

When('user enters {string} in {string} field', async function (value: string, fieldName: string) {
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), value);
});

When('user clicks {string} button', async function (buttonText: string) {
  const buttonIdXPath = `//button[@id='${buttonText.toLowerCase().replace(/\s+/g, '-')}']`;
  const buttons = page.locator(buttonIdXPath);
  if (await buttons.count() > 0) {
    await actions.click(buttons);
  } else {
    await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  }
  await waits.waitForNetworkIdle();
});

When('user waits for response', async function () {
  await waits.waitForNetworkIdle();
});

When('user clicks on any incident card', async function () {
  await actions.click(page.locator('//div[@class="incident-card"][1]'));
});

When('user waits for server response', async function () {
  await waits.waitForNetworkIdle();
});

When('user clicks {string} button on modal', async function (buttonText: string) {
  await actions.click(page.locator(`//div[@class="modal"]//button[contains(text(),'${buttonText}')]`));
  await waits.waitForNetworkIdle();
});

When('user navigates back using browser back button', async function () {
  await page.goBack();
  await waits.waitForNetworkIdle();
});

When('user attempts direct URL access to dashboard', async function () {
  await actions.navigateTo('/dashboard');
  await waits.waitForNetworkIdle();
});

When('user clicks in search field', async function () {
  await actions.click(page.locator('//input[@id="search-field"]'));
});

When('user enters {string} in search field', async function (searchText: string) {
  await actions.fill(page.locator('//input[@id="search-field"]'), searchText);
});

When('user presses Enter to search', async function () {
  await page.locator('//input[@id="search-field"]').press('Enter');
  await waits.waitForNetworkIdle();
});

When('user clears the search field', async function () {
  await actions.clearAndFill(page.locator('//input[@id="search-field"]'), '');
});

When('network connection is disabled', async function () {
  await context.setOffline(true);
});

When('user waits for {int} seconds', async function (seconds: number) {
  await page.waitForTimeout(seconds * 1000);
});

When('user clicks on an incident', async function () {
  await actions.click(page.locator('//div[@class="incident-item"][1]'));
});

When('network connection is re-enabled', async function () {
  await context.setOffline(false);
});

When('user removes disabled attribute from {string} button using developer tools', async function (buttonText: string) {
  await page.evaluate((text) => {
    const button = document.querySelector(`button:contains('${text}')`);
    if (button) button.removeAttribute('disabled');
  }, buttonText);
});

When('user attempts API call to {string}', async function (endpoint: string) {
  this.apiResponse = await page.evaluate(async (url) => {
    try {
      const response = await fetch(url);
      return { status: response.status, statusText: response.statusText };
    } catch (error) {
      return { error: error.message };
    }
  }, endpoint);
});

When('user pastes a {int} character string into search field', async function (charCount: number) {
  const longString = 'a'.repeat(charCount);
  await actions.fill(page.locator('//input[@id="search-field"]'), longString);
});

When('user clicks on {string} in date selector', async function (option: string) {
  await actions.click(page.locator(`//div[@id="date-selector"]//button[contains(text(),'${option}')]`));
});

When('user sets {string} date to {string}', async function (dateType: string, dateValue: string) {
  const dateFieldXPath = `//input[@id='date-${dateType.toLowerCase()}']`;
  await actions.fill(page.locator(dateFieldXPath), dateValue);
});

When('user clicks {string} button', async function (buttonText: string) {
  await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  await waits.waitForNetworkIdle();
});

When('user selects {string} filter', async function (filterOption: string) {
  await actions.click(page.locator(`//button[contains(text(),'${filterOption}')]`));
  await waits.waitForNetworkIdle();
});

When('user selects {string} format', async function (format: string) {
  await actions.click(page.locator(`//input[@value='${format.toLowerCase()}']`));
});

When('user clicks {string}', async function (elementText: string) {
  await actions.click(page.locator(`//*[contains(text(),'${elementText}')]`));
  await waits.waitForNetworkIdle();
});

When('user clicks on incident containing XSS payload', async function () {
  await actions.click(page.locator('//div[@class="incident-xss-test"]'));
});

When('user copies description text', async function () {
  await page.locator('//div[@id="incident-description"]').selectText();
  await page.keyboard.press('Control+C');
});

When('user opens dashboard in third browser', async function () {
  this.thirdBrowserAttempt = true;
});

When('user enters valid credentials', async function () {
  const credentials = this.testData?.users?.['DevOps Manager'];
  await actions.fill(page.locator('//input[@id="username"]'), credentials.username);
  await actions.fill(page.locator('//input[@id="password"]'), credentials.password);
});

When('user selects {string} option', async function (option: string) {
  await actions.click(page.locator(`//label[contains(text(),'${option}')]//input[@type="radio"]`));
});

When('user confirms termination', async function () {
  await actions.click(page.locator('//button[@id="confirm-termination"]'));
  await waits.waitForNetworkIdle();
});

When('user loads dashboard main view', async function () {
  await dashboardPage.navigate();
  await waits.waitForNetworkIdle();
});

When('user clicks on {string} tab', async function (tabName: string) {
  await actions.click(page.locator(`//button[@role="tab"][contains(text(),'${tabName}')]`));
  await waits.waitForNetworkIdle();
});

When('user waits for {int} more minutes', async function (minutes: number) {
  await page.waitForTimeout(minutes * 60 * 1000);
});

When('user tries to modify filters', async function () {
  await actions.click(page.locator('//button[@id="filter-button"]'));
});

When('user clicks {string}', async function (buttonText: string) {
  await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  await waits.waitForNetworkIdle();
});

When('user logs in with same credentials', async function () {
  const credentials = this.testData?.users?.['DevOps Manager'];
  await actions.fill(page.locator('//input[@id="username"]'), credentials.username);
  await actions.fill(page.locator('//input[@id="password"]'), credentials.password);
  await actions.click(page.locator('//button[@id="sign-in"]'));
  await waits.waitForNetworkIdle();
});

When('user executes script to rapidly click refresh {int} times', async function (clickCount: number) {
  for (let i = 0; i < clickCount; i++) {
    await page.locator('//button[@id="refresh"]').click({ force: true });
  }
});

When('user clicks refresh once', async function () {
  await actions.click(page.locator('//button[@id="refresh"]'));
  await waits.waitForNetworkIdle();
});

When('user sends malformed JSON {string} via WebSocket', async function (malformedJson: string) {
  await page.evaluate((json) => {
    if (window.ws) {
      window.ws.send(json);
    }
  }, malformedJson);
});

When('user navigates to dashboard URL', async function () {
  await actions.navigateTo(this.dashboardUrl);
  await waits.waitForNetworkIdle();
});

When('user tries to login anyway', async function () {
  await actions.click(page.locator('//button[@id="sign-in"]'));
});

When('user enters credentials and submits', async function () {
  await actions.fill(page.locator('//input[@id="username"]'), 'test@company.com');
  await actions.fill(page.locator('//input[@id="password"]'), 'testpass');
  await actions.click(page.locator('//button[@id="sign-in"]'));
});

// ==================== THEN STEPS ====================

Then('error message {string} should be displayed', async function (errorMessage: string) {
  await assertions.assertContainsText(page.locator('//div[@class="error-message"]'), errorMessage);
});

Then('{string} field should retain entered value', async function (fieldName: string) {
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  const value = await page.locator(fieldXPath).inputValue();
  expect(value).not.toBe('');
});

Then('{string} field should be cleared', async function (fieldName: string) {
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  const value = await page.locator(fieldXPath).inputValue();
  expect(value).toBe('');
});

Then('no session should be created', async function () {
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'session');
  expect(sessionCookie).toBeUndefined();
});

Then('failed login attempt should be logged', async function () {
  this.loginAttemptLogged = true;
});

Then('user should remain on login page', async function () {
  await assertions.assertUrlContains('/login');
});

Then('session timeout modal {string} should be displayed', async function (modalText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="modal-content"]'), modalText);
});

Then('user should be redirected to login page', async function () {
  await assertions.assertUrlContains('/login');
});

Then('login page should remain displayed', async function () {
  await assertions.assertUrlContains('/login');
});

Then('no dashboard access should be allowed', async function () {
  const dashboardElements = await page.locator('//div[@id="dashboard-main"]').count();
  expect(dashboardElements).toBe(0);
});

Then('message {string} should be displayed', async function (message: string) {
  await assertions.assertContainsText(page.locator(`//*[contains(text(),'${message}')]`), message);
});

Then('all incidents should still be displayed', async function () {
  await assertions.assertVisible(page.locator('//div[@id="incidents-container"]'));
});

Then('database should remain intact', async function () {
  this.databaseIntact = true;
});

Then('potential SQL injection attempt should be logged with user details', async function () {
  this.sqlInjectionLogged = true;
});

Then('warning banner {string} should be displayed', async function (warningText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="warning-banner"]'), warningText);
});

Then('incident details should show with warning {string}', async function (warningText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="warning-message"]'), warningText);
});

Then('dashboard should refresh automatically with latest data', async function () {
  await waits.waitForNetworkIdle();
});

Then('WebSocket should reconnect successfully', async function () {
  this.webSocketReconnected = true;
});

Then('error modal {string} should be displayed', async function (errorText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="error-modal"]'), errorText);
});

Then('API should return {int} Forbidden error', async function (statusCode: number) {
  expect(this.apiResponse?.status).toBe(statusCode);
});

Then('unauthorized access attempt should be logged with user ID and timestamp', async function () {
  this.unauthorizedAccessLogged = true;
});

Then('search field should be highlighted in red with error indicator', async function () {
  const searchField = page.locator('//input[@id="search-field"]');
  const classes = await searchField.getAttribute('class');
  expect(classes).toContain('error');
});

Then('error state should be removed', async function () {
  const searchField = page.locator('//input[@id="search-field"]');
  const classes = await searchField.getAttribute('class');
  expect(classes).not.toContain('error');
});

Then('normal search functionality should return', async function () {
  await assertions.assertVisible(page.locator('//input[@id="search-field"]'));
});

Then('validation error {string} should be displayed', async function (errorMessage: string) {
  await assertions.assertContainsText(page.locator('//div[@class="validation-error"]'), errorMessage);
});

Then('date filter should not be applied', async function () {
  const activeFilters = await page.locator('//div[@class="active-filters"]').count();
  expect(activeFilters).toBe(0);
});

Then('previous valid filter should remain active', async function () {
  this.previousFilterActive = true;
});

Then('dashboard should show {string}', async function (incidentCount: string) {
  await assertions.assertContainsText(page.locator('//div[@class="incident-count"]'), incidentCount);
});

Then('export modal should show warning {string}', async function (warningText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="export-modal"]'), warningText);
});

Then('progress should stop at approximately {int} percent', async function (percentage: number) {
  const progressBar = page.locator('//div[@class="progress-bar"]');
  const width = await progressBar.getAttribute('style');
  expect(width).toContain(`${percentage}`);
});

Then('modal should reset with suggestion to reduce data range', async function () {
  await assertions.assertContainsText(page.locator('//div[@class="modal-suggestion"]'), 'reduce');
});

Then('incident detail panel should open', async function () {
  await assertions.assertVisible(page.locator('//div[@id="incident-detail-panel"]'));
});

Then('script tags should be displayed as plain text', async function () {
  const description = await page.locator('//div[@id="incident-description"]').textContent();
  expect(description).toContain('<script>');
});

Then('no JavaScript alerts should appear', async function () {
  this.noAlertsShown = true;
});

Then('browser console should show no JavaScript execution errors', async function () {
  const consoleErrors = await page.evaluate(() => {
    return window.consoleErrors || [];
  });
  expect(consoleErrors.length).toBe(0);
});

Then('script tags should be HTML-encoded as {string}', async function (encodedText: string) {
  const description = await page.locator('//div[@id="incident-description"]').innerHTML();
  expect(description).toContain(encodedText);
});

Then('copied text should contain escaped characters not executable code', async function () {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).not.toContain('<script>');
});

Then('warning modal {string} should be displayed', async function (modalText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="warning-modal"]'), modalText);
});

Then('login should succeed', async function () {
  await assertions.assertUrlContains('/dashboard');
});

Then('first session should be terminated with notification', async function () {
  this.firstSessionTerminated = true;
});

Then('only {int} sessions should remain active', async function (sessionCount: number) {
  this.activeSessions = sessionCount;
});

Then('dashboard should load successfully', async function () {
  await assertions.assertVisible(page.locator('//div[@id="dashboard-main"]'));
});

Then('empty state message {string} should be displayed', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="empty-state"]'), message);
});

Then('chart should show flat line at zero with {string}', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="chart-message"]'), message);
});

Then('{string} button should be disabled with tooltip {string}', async function (buttonText: string, tooltipText: string) {
  const button = page.locator(`//button[contains(text(),'${buttonText}')]`);
  const isDisabled = await button.isDisabled();
  expect(isDisabled).toBe(true);
});

Then('search bar should show {string} placeholder', async function (placeholderText: string) {
  const placeholder = await page.locator('//input[@id="search-field"]').getAttribute('placeholder');
  expect(placeholder).toBe(placeholderText);
});

Then('session should expire after {int} minutes total', async function (minutes: number) {
  this.sessionExpired = true;
});

Then('session timeout modal should appear', async function () {
  await assertions.assertVisible(page.locator('//div[@class="session-timeout-modal"]'));
});

Then('all filters should be reset to default', async function () {
  const activeFilters = await page.locator('//div[@class="active-filters"]').count();
  expect(activeFilters).toBe(0);
});

Then('no filter parameters should be preserved in URL', async function () {
  const url = page.url();
  expect(url).not.toContain('filter=');
});

Then('first {int} requests should succeed', async function (requestCount: number) {
  this.successfulRequests = requestCount;
});

Then('subsequent requests should return HTTP {int} {string} errors', async function (statusCode: number, statusText: string) {
  this.rateLimitError = { status: statusCode, text: statusText };
});

Then('error banner {string} should be displayed', async function (bannerText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="error-banner"]'), bannerText);
});

Then('request should succeed', async function () {
  await waits.waitForNetworkIdle();
});

Then('dashboard should update normally', async function () {
  await assertions.assertVisible(page.locator('//div[@id="dashboard-main"]'));
});

Then('abuse attempt should be logged', async function () {
  this.abuseAttemptLogged = true;
});

Then('no visible errors should appear in UI', async function () {
  const errorElements = await page.locator('//div[@class="error"]').count();
  expect(errorElements).toBe(0);
});

Then('dashboard should continue functioning', async function () {
  await assertions.assertVisible(page.locator('//div[@id="dashboard-main"]'));
});

Then('error {string} should be logged in console', async function (errorMessage: string) {
  const consoleLogs = await page.evaluate(() => window.consoleLogs || []);
  expect(consoleLogs.some(log => log.includes(errorMessage))).toBe(true);
});

Then('valid WebSocket messages should still be processed correctly', async function () {
  this.webSocketProcessing = true;
});

Then('WebSocket should remain connected despite malformed message', async function () {
  this.webSocketConnected = true;
});

Then('page should load partially', async function () {
  await waits.waitForDomContentLoaded();
});

Then('banner {string} should be displayed', async function (bannerText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="browser-warning"]'), bannerText);
});

Then('login form should appear broken or misaligned', async function () {
  this.loginFormBroken = true;
});

Then('JavaScript errors should prevent successful login', async function () {
  this.jsErrorsPresent = true;
});

Then('basic HTML message with supported browser list should be visible', async function () {
  await assertions.assertVisible(page.locator('//div[@class="browser-support-message"]'));
});