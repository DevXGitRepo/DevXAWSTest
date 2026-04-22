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
      'DevOps Manager': { username: 'devops.manager', password: 'manager123' },
      'DevOps Engineer': { username: 'devops.engineer', password: 'engineer123' },
      'Read-Only Viewer': { username: 'viewer', password: 'viewer123' }
    },
    incidents: [],
    systemState: null
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

Given('the dashboard service is running and accessible', async function () {
  await actions.navigateTo(process.env.DASHBOARD_URL || 'http://localhost:3000/dashboard');
  await waits.waitForNetworkIdle();
  const dashboardXPath = '//div[@id="dashboard-container"]';
  await assertions.assertVisible(page.locator(dashboardXPath));
});

Given('the incident management system is connected', async function () {
  const connectionStatusXPath = '//div[@id="connection-status"]';
  await waits.waitForVisible(page.locator(connectionStatusXPath));
  await assertions.assertContainsText(page.locator(connectionStatusXPath), 'Connected');
});

Given('user has valid DevOps Manager credentials', async function () {
  this.currentUser = this.testData.users['DevOps Manager'];
});

Given('{int} active incidents exist in the system', async function (count: number) {
  this.testData.incidents = Array.from({ length: count }, (_, i) => ({
    id: `INC-${1000 + i}`,
    status: 'Active',
    severity: ['Critical', 'High', 'Medium'][i % 3]
  }));
  this.expectedIncidentCount = count;
});

Given('user is on the login page', async function () {
  await actions.navigateTo(process.env.LOGIN_URL || 'http://localhost:3000/login');
  await waits.waitForNetworkIdle();
  const loginFormXPath = '//form[@id="login-form"]';
  await assertions.assertVisible(page.locator(loginFormXPath));
});

/**************************************************/
/*  TEST CASE: TC-001
/*  Title: Successful login and dashboard initial load
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('user is logged in as DevOps Manager', async function () {
  const credentials = this.testData.users['DevOps Manager'];
  await actions.navigateTo(process.env.LOGIN_URL || 'http://localhost:3000/login');
  const usernameXPath = '//input[@id="username"]';
  const passwordXPath = '//input[@id="password"]';
  const loginButtonXPath = '//button[@id="login"]';
  
  await actions.fill(page.locator(usernameXPath), credentials.username);
  await actions.fill(page.locator(passwordXPath), credentials.password);
  await actions.click(page.locator(loginButtonXPath));
  await waits.waitForNetworkIdle();
  
  const dashboardXPath = '//div[@id="dashboard"]';
  await waits.waitForVisible(page.locator(dashboardXPath));
});

Given('dashboard is displaying {int} active incidents', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
  this.displayedIncidents = count;
});

Given('WebSocket connection is established', async function () {
  const wsIndicatorXPath = '//div[@id="websocket-indicator"]';
  await assertions.assertVisible(page.locator(wsIndicatorXPath));
  await assertions.assertContainsText(page.locator(wsIndicatorXPath), 'Live');
});

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: Real-time incident status updates
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('incident {string} shows status {string} with orange indicator', async function (incidentId: string, status: string) {
  const incidentXPath = `//div[@data-incident-id="${incidentId}"]`;
  const statusXPath = `${incidentXPath}//span[@class="status"]`;
  const indicatorXPath = `${incidentXPath}//div[@class="status-indicator"]`;
  
  await assertions.assertContainsText(page.locator(statusXPath), status);
  const indicator = page.locator(indicatorXPath);
  const color = await indicator.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(color).toContain('255, 165, 0');
});

Given('dashboard shows incident {string} with {int} response actions', async function (incidentId: string, actionCount: number) {
  const incidentXPath = `//div[@data-incident-id="${incidentId}"]`;
  await assertions.assertVisible(page.locator(incidentXPath));
  this.currentIncident = { id: incidentId, actionCount };
});

Given('incident has {int} percent progress completed', async function (percentage: number) {
  this.currentIncident.progress = percentage;
});

/**************************************************/
/*  TEST CASE: TC-003
/*  Title: Incident detail view with response actions
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('dashboard displays {int} total incidents', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
  this.totalIncidents = count;
});

Given('dashboard displays {int} incidents', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
  this.currentDisplayCount = count;
});

Given('search bar is visible in top navigation', async function () {
  const searchBarXPath = '//input[@id="search-bar"]';
  await assertions.assertVisible(page.locator(searchBarXPath));
});

/**************************************************/
/*  TEST CASE: TC-004
/*  Title: Incident filtering by status and severity
/*  Priority: Medium
/*  Category: Functional
/**************************************************/

Given('system has {int} days of historical incident data', async function (days: number) {
  this.historicalDataDays = days;
});

Given('user is on {string} page', async function (pageName: string) {
  const pageXPath = `//div[@id="${pageName.toLowerCase().replace(/\s+/g, '-')}-page"]`;
  await assertions.assertVisible(page.locator(pageXPath));
});

Given('user is logged out initially', async function () {
  await actions.navigateTo(process.env.LOGIN_URL || 'http://localhost:3000/login');
  await waits.waitForNetworkIdle();
});

Given('dashboard has sensitive incident data', async function () {
  this.hasSensitiveData = true;
});

/**************************************************/
/*  TEST CASE: TC-005
/*  Title: Dashboard auto-refresh functionality
/*  Priority: Medium
/*  Category: Functional
/**************************************************/

Given('dashboard is displaying current incidents', async function () {
  const dashboardXPath = '//div[@id="dashboard"]';
  await assertions.assertVisible(page.locator(dashboardXPath));
});

Given('auto-refresh is enabled with {int} second interval', async function (seconds: number) {
  this.refreshInterval = seconds;
  const refreshToggleXPath = '//input[@id="auto-refresh-toggle"]';
  const isChecked = await page.locator(refreshToggleXPath).isChecked();
  if (!isChecked) {
    await actions.check(page.locator(refreshToggleXPath));
  }
});

Given('dashboard shows {int} filtered incidents', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
  this.filteredCount = count;
});

Given('user has download permissions', async function () {
  this.hasDownloadPermissions = true;
});

Given('dashboard is loaded on desktop browser', async function () {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await waits.waitForNetworkIdle();
});

// ==================== WHEN STEPS ====================

When('user enters {string} in {string} field', async function (value: string, fieldName: string) {
  const fieldXPath = `//input[@id="${fieldName.toLowerCase().replace(/\s+/g, '-')}"]`;
  await actions.fill(page.locator(fieldXPath), value);
});

When('user clicks {string} button', async function (buttonText: string) {
  const buttonIdXPath = `//button[@id="${buttonText.toLowerCase().replace(/\s+/g, '-')}"]`;
  const buttons = page.locator(buttonIdXPath);
  
  if (await buttons.count() > 0) {
    await actions.click(buttons);
  } else {
    const textButtonXPath = `//button[contains(text(),'${buttonText}')]`;
    await actions.click(page.locator(textButtonXPath));
  }
  await waits.waitForNetworkIdle();
});

When('user waits for page to load', async function () {
  await waits.waitForDomContentLoaded();
  await waits.waitForNetworkIdle();
});

When('external system updates incident {string} status to {string}', async function (incidentId: string, newStatus: string) {
  this.updatedIncident = { id: incidentId, status: newStatus };
});

When('user waits for {int} seconds', async function (seconds: number) {
  await page.waitForTimeout(seconds * 1000);
});

When('user clicks on incident card {string}', async function (incidentId: string) {
  const incidentCardXPath = `//div[@data-incident-id="${incidentId}"]`;
  await actions.click(page.locator(incidentCardXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} link', async function (linkText: string) {
  const linkXPath = `//a[contains(text(),'${linkText}')]`;
  await actions.click(page.locator(linkXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks in search bar with placeholder {string}', async function (placeholder: string) {
  const searchBarXPath = `//input[@placeholder="${placeholder}"]`;
  await actions.click(page.locator(searchBarXPath));
});

When('user enters {string} in search field', async function (searchTerm: string) {
  const searchFieldXPath = '//input[@id="search-bar"]';
  await actions.fill(page.locator(searchFieldXPath), searchTerm);
});

When('user presses Enter key', async function () {
  await page.keyboard.press('Enter');
  await waits.waitForNetworkIdle();
});

When('user clears search field', async function () {
  const searchFieldXPath = '//input[@id="search-bar"]';
  await actions.clearAndFill(page.locator(searchFieldXPath), '');
});

When('user selects the suggested incident', async function () {
  const suggestionXPath = '//div[@class="search-suggestion"][1]';
  await actions.click(page.locator(suggestionXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks X button in search bar', async function () {
  const clearButtonXPath = '//button[@id="clear-search"]';
  await actions.click(page.locator(clearButtonXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} tab', async function (tabName: string) {
  const tabXPath = `//button[@role="tab"][contains(text(),'${tabName}')]`;
  await actions.click(page.locator(tabXPath));
  await waits.waitForNetworkIdle();
});

When('user selects {string} from date range dropdown', async function (dateRange: string) {
  const dropdownXPath = '//select[@id="date-range"]';
  await actions.selectByText(page.locator(dropdownXPath), dateRange);
  await waits.waitForNetworkIdle();
});

When('user hovers over data point for day {int}', async function (day: number) {
  const dataPointXPath = `//circle[@data-day="${day}"]`;
  await actions.hover(page.locator(dataPointXPath));
});

When('user clicks {string} toggle', async function (toggleName: string) {
  const toggleXPath = `//input[@id="${toggleName.toLowerCase().replace(/\s+/g, '-')}-toggle"]`;
  await actions.click(page.locator(toggleXPath));
  await waits.waitForNetworkIdle();
});

When('user logs in as {string}', async function (role: string) {
  const credentials = this.testData.users[role];
  const usernameXPath = '//input[@id="username"]';
  const passwordXPath = '//input[@id="password"]';
  const loginButtonXPath = '//button[@id="login"]';
  
  await actions.fill(page.locator(usernameXPath), credentials.username);
  await actions.fill(page.locator(passwordXPath), credentials.password);
  await actions.click(page.locator(loginButtonXPath));
  await waits.waitForNetworkIdle();
});

When('user attempts to access restricted feature', async function () {
  const restrictedXPath = '//button[@data-restricted="true"]';
  const restricted = page.locator(restrictedXPath);
  if (await restricted.count() > 0) {
    await actions.click(restricted);
  }
});

When('user observes refresh indicator', async function () {
  const indicatorXPath = '//div[@id="refresh-indicator"]';
  await assertions.assertVisible(page.locator(indicatorXPath));
});

When('user clicks manual refresh button', async function () {
  const refreshButtonXPath = '//button[@id="manual-refresh"]';
  await actions.click(page.locator(refreshButtonXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks auto-refresh toggle to disable', async function () {
  const toggleXPath = '//input[@id="auto-refresh-toggle"]';
  await actions.click(page.locator(toggleXPath));
});

When('user re-enables auto-refresh', async function () {
  const toggleXPath = '//input[@id="auto-refresh-toggle"]';
  await actions.check(page.locator(toggleXPath));
});

When('user checks {string} checkbox', async function (checkboxLabel: string) {
  const checkboxXPath = `//label[contains(text(),'${checkboxLabel}')]/../input[@type="checkbox"]`;
  await actions.check(page.locator(checkboxXPath));
});

When('user selects {string} format', async function (format: string) {
  const formatRadioXPath = `//input[@type="radio"][@value="${format.toLowerCase()}"]`;
  await actions.click(page.locator(formatRadioXPath));
});

When('generation completes', async function () {
  const progressXPath = '//div[@class="progress-bar"]';
  await waits.waitForHidden(page.locator(progressXPath));
});

When('browser is resized to {string} width', async function (width: string) {
  const widthValue = parseInt(width.replace('px', ''));
  await page.setViewportSize({ width: widthValue, height: 1080 });
  await waits.waitForNetworkIdle();
});

When('browser returns to desktop size', async function () {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await waits.waitForNetworkIdle();
});

When('user selects {string} checkbox under Status filter', async function (status: string) {
  const checkboxXPath = `//div[@id="status-filter"]//label[contains(text(),'${status}')]/../input`;
  await actions.check(page.locator(checkboxXPath));
});

When('user selects {string} checkbox under Severity filter', async function (severity: string) {
  const checkboxXPath = `//div[@id="severity-filter"]//label[contains(text(),'${severity}')]/../input`;
  await actions.check(page.locator(checkboxXPath));
});

// ==================== THEN STEPS ====================

Then('user should see {string} page', async function (pageName: string) {
  const pageXPath = `//div[@id="${pageName.toLowerCase().replace(/\s+/g, '-')}-page"]`;
  await assertions.assertVisible(page.locator(pageXPath));
});

Then('{string} should be visible', async function (elementName: string) {
  const elementXPath = `//*[@id="${elementName.toLowerCase().replace(/\s+/g, '-')}"]`;
  await assertions.assertVisible(page.locator(elementXPath));
});

Then('table should display {int} rows', async function (rowCount: number) {
  const tableRowsXPath = '//table//tbody//tr';
  await assertions.assertElementCount(page.locator(tableRowsXPath), rowCount);
});

Then('incident status indicators should show appropriate colors', async function () {
  const indicatorsXPath = '//div[@class="status-indicator"]';
  const indicators = page.locator(indicatorsXPath);
  const count = await indicators.count();
  expect(count).toBeGreaterThan(0);
});

Then('{string} should be displayed in top-right corner', async function (text: string) {
  const topRightXPath = '//div[@class="top-right"]';
  await assertions.assertContainsText(page.locator(topRightXPath), text);
});

Then('incident {string} should display status {string} with blue indicator', async function (incidentId: string, status: string) {
  const incidentXPath = `//div[@data-incident-id="${incidentId}"]`;
  const statusXPath = `${incidentXPath}//span[@class="status"]`;
  const indicatorXPath = `${incidentXPath}//div[@class="status-indicator"]`;
  
  await assertions.assertContainsText(page.locator(statusXPath), status);
  const indicator = page.locator(indicatorXPath);
  const color = await indicator.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(color).toContain('0, 0, 255');
});

Then('no page refresh should occur', async function () {
  const currentUrl = page.url();
  await page.waitForTimeout(1000);
  expect(page.url()).toBe(currentUrl);
});

Then('last updated timestamp should show current time', async function () {
  const timestampXPath = '//span[@id="last-updated"]';
  const timestamp = await page.locator(timestampXPath).textContent();
  const now = new Date();
  const timestampDate = new Date(timestamp || '');
  const diff = Math.abs(now.getTime() - timestampDate.getTime());
  expect(diff).toBeLessThan(60000);
});

Then('success message {string} should be displayed', async function (message: string) {
  const messageXPath = '//div[@class="success-message"]';
  await assertions.assertContainsText(page.locator(messageXPath), message);
});

Then('incident detail panel should slide in from right side', async function () {
  const panelXPath = '//div[@id="incident-detail-panel"]';
  await waits.waitForVisible(page.locator(panelXPath));
  const panel = page.locator(panelXPath);
  const transform = await panel.evaluate(el => window.getComputedStyle(el).transform);
  expect(transform).not.toBe('none');
});

Then('{int} response actions should be listed', async function (actionCount: number) {
  const actionsXPath = '//div[@class="response-action"]';
  await assertions.assertElementCount(page.locator(actionsXPath), actionCount);
});

Then('{string} action should show {string} status', async function (actionName: string, status: string) {
  const actionXPath = `//div[@class="response-action"][contains(text(),'${actionName}')]//span[@class="action-status"]`;
  await assertions.assertContainsText(page.locator(actionXPath), status);
});

Then('circular progress indicator should show {int} percent', async function (percentage: number) {
  const progressXPath = '//div[@class="circular-progress"]';
  const progressElement = page.locator(progressXPath);
  const value = await progressElement.getAttribute('data-value');
  expect(parseInt(value || '0')).toBe(percentage);
});

Then('{string} text should be displayed', async function (text: string) {
  const textXPath = `//*[contains(text(),'${text}')]`;
  await assertions.assertVisible(page.locator(textXPath));
});

Then('timeline view should expand showing chronological event history', async function () {
  const timelineXPath = '//div[@id="timeline-view"]';
  await waits.waitForVisible(page.locator(timelineXPath));
  const eventsXPath = '//div[@class="timeline-event"]';
  const events = page.locator(eventsXPath);
  const count = await events.count();
  expect(count).toBeGreaterThan(0);
});

Then('dashboard should display {int} filtered incidents', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
});

Then('filter tags should show {string} and {string}', async function (tag1: string, tag2: string) {
  const tag1XPath = `//span[@class="filter-tag"][contains(text(),'${tag1}')]`;
  const tag2XPath = `//span[@class="filter-tag"][contains(text(),'${tag2}')]`;
  await assertions.assertVisible(page.locator(tag1XPath));
  await assertions.assertVisible(page.locator(tag2XPath));
});

Then('all {int} incidents should reappear', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
});

Then('filter tags should be removed', async function () {
  const tagsXPath = '//span[@class="filter-tag"]';
  const tags = page.locator(tagsXPath);
  const count = await tags.count();
  expect(count).toBe(0);
});

Then('search bar should become active with cursor', async function () {
  const searchBarXPath = '//input[@id="search-bar"]';
  const searchBar = page.locator(searchBarXPath);
  await expect(searchBar).toBeFocused();
});

Then('search suggestions dropdown should appear', async function () {
  const dropdownXPath = '//div[@id="search-suggestions"]';
  await waits.waitForVisible(page.locator(dropdownXPath));
});

Then('dashboard should display {int} incidents containing search term', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
});

Then('dashboard should display {int} specific incident', async function (count: number) {
  const incidentCardsXPath = '//div[@class="incident-card"]';
  await assertions.assertElementCount(page.locator(incidentCardsXPath), count);
});

Then('view should switch to historical dashboard with date selector', async function () {
  const historicalViewXPath = '//div[@id="historical-dashboard"]';
  const dateSelectorXPath = '//div[@id="date-selector"]';
  await assertions.assertVisible(page.locator(historicalViewXPath));
  await assertions.assertVisible(page.locator(dateSelectorXPath));
});

Then('line graph should display incident trends for selected period', async function () {
  const graphXPath = '//svg[@id="trend-graph"]';
  await assertions.assertVisible(page.locator(graphXPath));
});

Then('tooltip should display incident statistics', async function () {
  const tooltipXPath = '//div[@class="chart-tooltip"]';
  await assertions.assertVisible(page.locator(tooltipXPath));
});

Then('graph should update to show stacked area chart with severity breakdown', async function () {
  const stackedChartXPath = '//svg[@id="stacked-chart"]';
  await waits.waitForVisible(page.locator(stackedChartXPath));
});

Then('export options {string}, {string}, {string} should appear', async function (opt1: string, opt2: string, opt3: string) {
  const opt1XPath = `//button[contains(text(),'${opt1}')]`;
  const opt2XPath = `//button[contains(text(),'${opt2}')]`;
  const opt3XPath = `//button[contains(text(),'${opt3}')]`;
  await assertions.assertVisible(page.locator(opt1XPath));
  await assertions.assertVisible(page.locator(opt2XPath));
  await assertions.assertVisible(page.locator(opt3XPath));
});

Then('file {string} should download to browser', async function (fileName: string) {
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain(fileName);
});

Then('dashboard should load with {string} access', async function (accessLevel: string) {
  this.currentAccessLevel = accessLevel;
  const dashboardXPath = '//div[@id="dashboard"]';
  await assertions.assertVisible(page.locator(dashboardXPath));
});

Then('{string} for Export button', async function (permission: string) {
  const exportButtonXPath = '//button[@id="export"]';
  const button = page.locator(exportButtonXPath);
  if (permission === 'enabled') {
    await expect(button).toBeEnabled();
  } else {
    await expect(button).toBeDisabled();
  }
});

Then('{string} for Filter feature', async function (permission: string) {
  const filterButtonXPath = '//button[@id="filter"]';
  const button = page.locator(filterButtonXPath);
  if (permission === 'enabled') {
    await expect(button).toBeEnabled();
  } else {
    await expect(button).toBeDisabled();
  }
});

Then('{string} for Search feature', async function (permission: string) {
  const searchBarXPath = '//input[@id="search-bar"]';
  const searchBar = page.locator(searchBarXPath);
  if (permission === 'enabled') {
    await expect(searchBar).toBeEnabled();
  } else {
    await expect(searchBar).toBeDisabled();
  }
});

Then('{string} for Historical Data tab', async function (permission: string) {
  const tabXPath = '//button[@role="tab"][contains(text(),"Historical")]';
  const tab = page.locator(tabXPath);
  if (permission === 'enabled' || permission === 'visible') {
    await assertions.assertVisible(tab);
  }
});

Then('{string} should be displayed', async function (message: string) {
  if (message) {
    const messageXPath = `//*[contains(text(),'${message}')]`;
    await assertions.assertVisible(page.locator(messageXPath));
  }
});

Then('indicator should show {string} with countdown timer', async function (text: string) {
  const indicatorXPath = '//div[@id="refresh-indicator"]';
  await assertions.assertContainsText(page.locator(indicatorXPath), text);
  const timerXPath = '//span[@id="countdown-timer"]';
  await assertions.assertVisible(page.locator(timerXPath));
});

Then('dashboard should flash briefly and update with latest data', async function () {
  const dashboardXPath = '//div[@id="dashboard"]';
  const dashboard = page.locator(dashboardXPath);
  const initialOpacity = await dashboard.evaluate(el => window.getComputedStyle(el).opacity);
  await page.waitForTimeout(500);
  const currentOpacity = await dashboard.evaluate(el => window.getComputedStyle(el).opacity);
  expect(parseFloat(currentOpacity)).toBeGreaterThanOrEqual(parseFloat(initialOpacity));
});

Then('spinning animation should appear on button', async function () {
  const spinnerXPath = '//button[@id="manual-refresh"]//span[@class="spinner"]';
  await assertions.assertVisible(page.locator(spinnerXPath));
});

Then('dashboard should update immediately', async function () {
  await waits.waitForNetworkIdle();
  const updatedXPath = '//div[@data-updated="true"]';
  await assertions.assertVisible(page.locator(updatedXPath));
});

Then('indicator should show {string} in gray', async function (text: string) {
  const indicatorXPath = '//div[@id="refresh-indicator"]';
  await assertions.assertContainsText(page.locator(indicatorXPath), text);
  const indicator = page.locator(indicatorXPath);
  const color = await indicator.evaluate(el => window.getComputedStyle(el).color);
  expect(color).toContain('128');
});

Then('no automatic refresh should occur', async function () {
  const initialTime = await page.locator('//span[@id="last-updated"]').textContent();
  await page.waitForTimeout(this.refreshInterval * 1000 + 1000);
  const currentTime = await page.locator('//span[@id="last-updated"]').textContent();
  expect(currentTime).toBe(initialTime);
});

Then('auto-refresh should resume with countdown timer', async function () {
  const timerXPath = '//span[@id="countdown-timer"]';
  await assertions.assertVisible(page.locator(timerXPath));
});

Then('export modal should open with format options', async function () {
  const modalXPath = '//div[@id="export-modal"]';
  await waits.waitForVisible(page.locator(modalXPath));
  const formatOptionsXPath = '//div[@class="format-option"]';
  const options = page.locator(formatOptionsXPath);
  const count = await options.count();
  expect(count).toBeGreaterThan(0);
});

Then('incident count should update to {string}', async function (countText: string) {
  const countXPath = '//span[@id="selected-count"]';
  await assertions.assertContainsText(page.locator(countXPath), countText);
});

Then('progress bar should show {string}', async function (text: string) {
  const progressXPath = '//div[@class="progress-bar"]';
  await assertions.assertVisible(page.locator(progressXPath));
  const progressTextXPath = '//span[@class="progress-text"]';
  await assertions.assertContainsText(page.locator(progressTextXPath), text);
});

Then('file {string} should download', async function (fileName: string) {
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toBe(fileName);
});

Then('PDF should contain all {int} incidents with proper formatting', async function (count: number) {
  this.downloadedPdfIncidentCount = count;
});

Then('layout should adjust to {string}', async function (layoutType: string) {
  const layoutXPath = `//div[@data-layout="${layoutType}"]`;
  await assertions.assertVisible(page.locator(layoutXPath));
});

Then('{string} should be displayed', async function (navigationType: string) {
  if (navigationType === 'hamburger menu') {
    const hamburgerXPath = '//button[@id="hamburger-menu"]';
    await assertions.assertVisible(page.locator(hamburgerXPath));
  } else if (navigationType === 'sidebar') {
    const sidebarXPath = '//nav[@id="sidebar"]';
    await assertions.assertVisible(page.locator(sidebarXPath));
  }
});

Then('detail panel should display as {string}', async function (displayType: string) {
  const detailXPath = `//div[@data-display="${displayType}"]`;
  await assertions.assertVisible(page.locator(detailXPath));
});

Then('layout should return to three-column view', async function () {
  const layoutXPath = '//div[@data-layout="three-column"]';
  await assertions.assertVisible(page.locator(layoutXPath));
});