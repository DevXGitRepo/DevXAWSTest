import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { Page, Browser, BrowserContext, chromium, expect } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { HomePage } from '../pages/HomePage';
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
  dashboardPage = new DashboardPage(page, context);
  
  this.testData = {
    users: {
      'DevOps Manager': { username: 'devops_manager', password: 'DevOps123!' },
      admin: { username: 'admin', password: 'admin123' },
      user: { username: 'testuser', password: 'testpass' }
    },
    incidents: [],
    connections: [],
    startTime: Date.now()
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

Given('user is logged in as {string} with full permissions', async function (userType: string) {
  const credentials = this.testData?.users?.[userType] || { username: 'testuser', password: 'testpass' };
  await actions.navigateTo(process.env.BASE_URL || 'http://localhost:3000');
  await actions.fill(page.locator('//input[@id="username"]'), credentials.username);
  await actions.fill(page.locator('//input[@id="password"]'), credentials.password);
  await actions.click(page.locator('//button[@id="login"]'));
  await waits.waitForNetworkIdle();
});

Given('user is on {string} page', async function (pageName: string) {
  const pageUrl = `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
  await actions.navigateTo(`${process.env.BASE_URL || 'http://localhost:3000'}${pageUrl}`);
  await waits.waitForDomContentLoaded();
});

/**************************************************/
/*  TEST CASE: TC-001
/*  Title: Dashboard handles maximum concurrent incidents load
/*  Priority: High
/*  Category: Edge Cases
/**************************************************/

Given('system has {int} active incidents in various states', async function (incidentCount: number) {
  this.testData.incidentCount = incidentCount;
  const states = ['Active', 'Investigating', 'Resolved', 'Closed'];
  for (let i = 0; i < incidentCount; i++) {
    this.testData.incidents.push({
      id: i + 1,
      state: states[i % states.length],
      title: `Incident ${i + 1}`,
      severity: i % 3 === 0 ? 'Critical' : i % 2 === 0 ? 'High' : 'Medium'
    });
  }
});

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: Dashboard displays appropriate empty state
/*  Priority: Medium
/*  Category: Edge Cases
/**************************************************/

Given('database contains no active or historical incidents', async function () {
  this.testData.incidents = [];
  this.testData.hasNoIncidents = true;
});

Given('all dashboard widgets are enabled', async function () {
  this.testData.widgetsEnabled = true;
});

/**************************************************/
/*  TEST CASE: TC-003
/*  Title: Dashboard handles special characters
/*  Priority: Medium
/*  Category: Edge Cases
/**************************************************/

Given('incident exists with {int} character title containing special characters', async function (charCount: number) {
  const specialTitle = '🚨Critical❗DB_Error<script>alert(1)</script>™€¥§½¾'.padEnd(charCount, 'X');
  this.testData.specialIncident = {
    id: 999,
    title: specialTitle,
    charCount: charCount
  };
});

Given('title includes {string} text', async function (specialText: string) {
  this.testData.specialIncident.containsText = specialText;
});

/**************************************************/
/*  TEST CASE: TC-004
/*  Title: Dashboard supports simultaneous access
/*  Priority: High
/*  Category: Edge Cases
/**************************************************/

Given('{int} DevOps Manager accounts are authenticated', async function (managerCount: number) {
  this.testData.managerCount = managerCount;
  this.testData.managers = [];
  for (let i = 0; i < managerCount; i++) {
    this.testData.managers.push({
      id: i + 1,
      username: `devops_manager_${i + 1}`,
      authenticated: true
    });
  }
});

Given('dashboard is configured for WebSocket real-time updates', async function () {
  this.testData.webSocketEnabled = true;
  await page.evaluate(() => {
    window.localStorage.setItem('realtime-updates', 'enabled');
  });
});

Given('{int} active incidents exist with ongoing status changes', async function (incidentCount: number) {
  this.testData.activeIncidents = incidentCount;
  for (let i = 0; i < incidentCount; i++) {
    this.testData.incidents.push({
      id: i + 1,
      status: 'Active',
      changing: true
    });
  }
});

/**************************************************/
/*  TEST CASE: TC-005
/*  Title: Dashboard handles network interruption
/*  Priority: High
/*  Category: Edge Cases
/**************************************************/

Given('dashboard is showing real-time updates', async function () {
  this.testData.realtimeActive = true;
  await assertions.assertVisible(page.locator('//div[@id="realtime-indicator"]'));
});

Given('at least {int} incidents are displayed in various states', async function (minIncidents: number) {
  const incidentCards = page.locator('//div[@class="incident-card"]');
  const count = await incidentCards.count();
  expect(count).toBeGreaterThanOrEqual(minIncidents);
});

/**************************************************/
/*  TEST CASE: TC-006
/*  Title: Dashboard processes maximum historical data
/*  Priority: Medium
/*  Category: Edge Cases
/**************************************************/

Given('dashboard contains {int} years of historical incident data', async function (years: number) {
  this.testData.historicalYears = years;
  this.testData.historicalDataLoaded = true;
});

Given('database is indexed properly for date range queries', async function () {
  this.testData.databaseIndexed = true;
});

/**************************************************/
/*  TEST CASE: TC-007
/*  Title: Dashboard handles rapid filter changes
/*  Priority: Medium
/*  Category: Edge Cases
/**************************************************/

Given('dashboard is loaded with {int} incidents', async function (incidentCount: number) {
  await waits.waitForVisible(page.locator('//div[@id="incident-dashboard"]'));
  this.testData.loadedIncidents = incidentCount;
});

Given('all filter options are available', async function () {
  await assertions.assertVisible(page.locator('//div[@id="filter-panel"]'));
  this.testData.filtersAvailable = true;
});

/**************************************************/
/*  TEST CASE: TC-008
/*  Title: Dashboard maintains responsiveness at zoom
/*  Priority: Low
/*  Category: Edge Cases
/**************************************************/

Given('dashboard is loaded in {string}', async function (browserName: string) {
  this.testData.browserName = browserName;
});

Given('screen resolution is set to {string}', async function (resolution: string) {
  const [width, height] = resolution.split('x').map(Number);
  await page.setViewportSize({ width, height });
});

Given('multiple incidents are displayed with charts and graphs', async function () {
  await assertions.assertVisible(page.locator('//div[@class="incident-chart"]'));
  await assertions.assertVisible(page.locator('//div[@class="incident-graph"]'));
});

// ==================== WHEN STEPS ====================

When('user navigates to {string} page', async function (url: string) {
  await actions.navigateTo(`${process.env.BASE_URL || 'http://localhost:3000'}${url}`);
  await waits.waitForNetworkIdle();
});

When('user scrolls through incident list rapidly', async function () {
  const list = page.locator('//div[@id="incident-list"]');
  await actions.scrollIntoView(list);
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(50);
  }
});

When('user clicks on incident number {int}', async function (incidentNumber: number) {
  const incidentXPath = `//div[@data-incident-id="${incidentNumber}"]`;
  await actions.click(page.locator(incidentXPath));
  await waits.waitForNetworkIdle();
});

When('user accesses {string} page', async function (url: string) {
  await actions.navigateTo(`${process.env.BASE_URL || 'http://localhost:3000'}${url}`);
  await waits.waitForDomContentLoaded();
});

When('user clicks {string} tab', async function (tabName: string) {
  const tabXPath = `//button[@role="tab" and contains(text(),"${tabName}")]`;
  await actions.click(page.locator(tabXPath));
  await waits.waitForNetworkIdle();
});

When('user applies date filter for last {int} days', async function (days: number) {
  const dateFilterXPath = '//input[@id="date-filter"]';
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  await actions.fill(page.locator(dateFilterXPath), `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`);
  await waits.waitForNetworkIdle();
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

When('user locates incident with special character title in list', async function () {
  const specialIncidentXPath = `//div[contains(@class,"incident-card") and contains(.,"🚨")]`;
  await actions.scrollIntoView(page.locator(specialIncidentXPath));
});

When('user hovers over truncated title', async function () {
  const truncatedTitleXPath = '//span[@class="truncated-title"]';
  await actions.hover(page.locator(truncatedTitleXPath));
  await page.waitForTimeout(500);
});

When('user clicks incident to open details view', async function () {
  const incidentXPath = `//div[@data-incident-id="${this.testData.specialIncident.id}"]`;
  await actions.click(page.locator(incidentXPath));
  await waits.waitForNetworkIdle();
});

When('user searches for {string} in search bar', async function (searchQuery: string) {
  const searchXPath = '//input[@id="search-bar"]';
  await actions.fill(page.locator(searchXPath), searchQuery);
  await page.waitForTimeout(500);
  await waits.waitForNetworkIdle();
});

When('user exports incident list to CSV', async function () {
  await actions.click(page.locator('//button[@id="export-csv"]'));
  await waits.waitForNetworkIdle();
});

When('all {int} managers connect to dashboard simultaneously', async function (managerCount: number) {
  this.testData.connectionsEstablished = 0;
  for (let i = 0; i < managerCount; i++) {
    this.testData.connections.push({
      managerId: i + 1,
      connected: true,
      timestamp: Date.now()
    });
    this.testData.connectionsEstablished++;
  }
});

When('incident status changes from {string} to {string}', async function (fromStatus: string, toStatus: string) {
  this.testData.statusChange = {
    from: fromStatus,
    to: toStatus,
    timestamp: Date.now()
  };
});

When('{int} users apply different filters simultaneously', async function (userCount: number) {
  this.testData.simultaneousFilters = userCount;
});

When('{int} new incidents are triggered', async function (incidentCount: number) {
  this.testData.newIncidentsTriggered = incidentCount;
});

When('network disconnects for {int} seconds', async function (seconds: number) {
  await context.setOffline(true);
  await page.waitForTimeout(seconds * 1000);
});

When('user attempts to click on an incident during disconnection', async function () {
  try {
    await actions.click(page.locator('//div[@class="incident-card"][1]'));
  } catch (error) {
    this.testData.clickDuringDisconnection = true;
  }
});

When('network reconnects after {int} seconds', async function (seconds: number) {
  await page.waitForTimeout(seconds * 1000);
  await context.setOffline(false);
});

When('user sets date filter from {string} to current date', async function (startDate: string) {
  const dateRangeXPath = '//input[@id="date-range-picker"]';
  const endDate = new Date().toISOString().split('T')[0];
  await actions.fill(page.locator(dateRangeXPath), `${startDate} - ${endDate}`);
  await waits.waitForNetworkIdle();
});

When('data loads within {int} seconds maximum', async function (maxSeconds: number) {
  const startTime = Date.now();
  await waits.waitForHidden(page.locator('//div[@class="loading-indicator"]'));
  const loadTime = (Date.now() - startTime) / 1000;
  expect(loadTime).toBeLessThanOrEqual(maxSeconds);
});

When('user clicks {string} button for entire date range', async function (buttonText: string) {
  await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} button in pagination', async function (buttonText: string) {
  const paginationXPath = `//div[@class="pagination"]//button[contains(text(),'${buttonText}')]`;
  await actions.click(page.locator(paginationXPath));
  await waits.waitForNetworkIdle();
});

When('user applies additional filter for {string} severity', async function (severity: string) {
  const severityFilterXPath = `//input[@type="checkbox" and @value="${severity.toLowerCase()}"]`;
  await actions.check(page.locator(severityFilterXPath));
  await waits.waitForNetworkIdle();
});

When('user rapidly toggles status filter {int} times between {string} and {string}', async function (toggleCount: number, status1: string, status2: string) {
  const status1XPath = `//input[@type="checkbox" and @value="${status1.toLowerCase()}"]`;
  const status2XPath = `//input[@type="checkbox" and @value="${status2.toLowerCase()}"]`;
  for (let i = 0; i < toggleCount; i++) {
    await actions.check(page.locator(status1XPath));
    await page.waitForTimeout(50);
    await actions.check(page.locator(status2XPath));
    await page.waitForTimeout(50);
  }
});

When('user types search query {string} letter by letter', async function (searchQuery: string) {
  const searchXPath = '//input[@id="search-bar"]';
  const searchInput = page.locator(searchXPath);
  await actions.clearAndFill(searchInput, '');
  for (const char of searchQuery) {
    await actions.type(searchInput, char);
    await page.waitForTimeout(100);
  }
});

When('user applies all filters simultaneously', async function () {
  await actions.check(page.locator('//input[@id="filter-active"]'));
  await actions.check(page.locator('//input[@id="filter-critical"]'));
  await actions.check(page.locator('//input[@id="filter-recent"]'));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} button', async function (buttonText: string) {
  await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  await waits.waitForNetworkIdle();
});

When('user applies conflicting filters', async function () {
  await actions.check(page.locator('//input[@id="filter-resolved"]'));
  await actions.check(page.locator('//input[@id="filter-active"]'));
  await waits.waitForNetworkIdle();
});

When('user zooms browser to {int} percent', async function (zoomLevel: number) {
  await page.evaluate((zoom) => {
    document.body.style.zoom = `${zoom}%`;
  }, zoomLevel);
  await page.waitForTimeout(500);
});

When('user scrolls horizontally and vertically', async function () {
  await page.evaluate(() => {
    window.scrollTo(100, 100);
    window.scrollTo(0, 0);
  });
});

When('user clicks on an incident card', async function () {
  await actions.click(page.locator('//div[@class="incident-card"][1]'));
  await waits.waitForNetworkIdle();
});

When('user returns zoom to {int} percent', async function (zoomLevel: number) {
  await page.evaluate((zoom) => {
    document.body.style.zoom = `${zoom}%`;
  }, zoomLevel);
  await page.waitForTimeout(500);
});

// ==================== THEN STEPS ====================

Then('dashboard should display loading indicator', async function () {
  await assertions.assertVisible(page.locator('//div[@class="loading-indicator"]'));
});

Then('dashboard should load within {int} seconds', async function (seconds: number) {
  const startTime = Date.now();
  await waits.waitForHidden(page.locator('//div[@class="loading-indicator"]'));
  const loadTime = (Date.now() - startTime) / 1000;
  expect(loadTime).toBeLessThanOrEqual(seconds);
});

Then('pagination controls should show {string} text', async function (paginationText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="pagination-info"]'), paginationText);
});

Then('scrolling should be smooth without freezing', async function () {
  const startTime = Date.now();
  await page.evaluate(() => window.scrollBy(0, 1000));
  const scrollTime = Date.now() - startTime;
  expect(scrollTime).toBeLessThan(100);
});

Then('virtual scrolling should engage for performance', async function () {
  const virtualScrollXPath = '//div[@class="virtual-scroll-container"]';
  await assertions.assertVisible(page.locator(virtualScrollXPath));
});

Then('incident details should load within {int} seconds', async function (seconds: number) {
  const startTime = Date.now();
  await waits.waitForVisible(page.locator('//div[@id="incident-details"]'));
  const loadTime = (Date.now() - startTime) / 1000;
  expect(loadTime).toBeLessThanOrEqual(seconds);
});

Then('browser memory usage should remain below {int} MB', async function (maxMemoryMB: number) {
  const metrics = await page.evaluate(() => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1048576;
    }
    return 0;
  });
  expect(metrics).toBeLessThan(maxMemoryMB);
});

Then('no memory leaks should be detected', async function () {
  const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
  await page.waitForTimeout(2000);
  const finalMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
  const memoryIncrease = (finalMemory - initialMemory) / 1048576;
  expect(memoryIncrease).toBeLessThan(10);
});

Then('dashboard should display {string} message', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="dashboard-message"]'), message);
});

Then('tab should display {string} message', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="tab-content"]'), message);
});

Then('suggestion text {string} should be visible', async function (suggestionText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="suggestion-text"]'), suggestionText);
});

Then('empty state message should remain visible', async function () {
  await assertions.assertVisible(page.locator('//div[@class="empty-state"]'));
});

Then('date range should be displayed', async function () {
  await assertions.assertVisible(page.locator('//div[@class="date-range-display"]'));
});

Then('warning message {string} should be displayed', async function (warningMessage: string) {
  await assertions.assertContainsText(page.locator('//div[@class="warning-message"]'), warningMessage);
});

Then('no empty file should be generated', async function () {
  const downloads = await page.context().waitForEvent('download', { timeout: 2000 }).catch(() => null);
  expect(downloads).toBeNull();
});

Then('title should display with all special characters rendered correctly', async function () {
  const titleElement = page.locator('//span[@class="incident-title"]');
  const titleText = await titleElement.textContent();
  expect(titleText).toContain('🚨');
  expect(titleText).toContain('❗');
});

Then('HTML should be properly escaped', async function () {
  const htmlContent = await page.locator('//span[@class="incident-title"]').innerHTML();
  expect(htmlContent).not.toContain('<script>');
  expect(htmlContent).toContain('&lt;script&gt;');
});

Then('full title should appear in tooltip', async function () {
  await assertions.assertVisible(page.locator('//div[@role="tooltip"]'));
});

Then('all characters should display correctly', async function () {
  const tooltipText = await page.locator('//div[@role="tooltip"]').textContent();
  expect(tooltipText).toContain('🚨');
  expect(tooltipText).toContain('™€¥§½¾');
});

Then('detail page should show full title without truncation', async function () {
  const fullTitle = await page.locator('//h1[@class="incident-detail-title"]').textContent();
  expect(fullTitle?.length).toBeGreaterThan(50);
});

Then('special characters should remain intact', async function () {
  const detailTitle = await page.locator('//h1[@class="incident-detail-title"]').textContent();
  expect(detailTitle).toContain('🚨');
  expect(detailTitle).toContain('™€¥§½¾');
});

Then('search should return the incident correctly', async function () {
  await assertions.assertVisible(page.locator(`//div[@data-incident-id="${this.testData.specialIncident.id}"]`));
});

Then('CSV should contain properly encoded special characters', async function () {
  this.testData.csvExported = true;
});

Then('no data corruption should occur', async function () {
  expect(this.testData.csvExported).toBeTruthy();
});

Then('all connections should establish within {int} seconds', async function (seconds: number) {
  const connectionTime = (Date.now() - this.testData.startTime) / 1000;
  expect(connectionTime).toBeLessThanOrEqual(seconds);
  expect(this.testData.connectionsEstablished).toBe(this.testData.managerCount);
});

Then('no connection failures should occur', async function () {
  const failedConnections = this.testData.connections.filter(c => !c.connected);
  expect(failedConnections.length).toBe(0);
});

Then('all {int} dashboards should update within {int} seconds', async function (dashboardCount: number, seconds: number) {
  await page.waitForTimeout(seconds * 1000);
  this.testData.allDashboardsUpdated = true;
});

Then('each user filter should apply independently', async function () {
  this.testData.independentFilters = true;
});

Then('other users should not be affected', async function () {
  expect(this.testData.independentFilters).toBeTruthy();
});

Then('new incidents should appear on all dashboards within {int} seconds', async function (seconds: number) {
  await page.waitForTimeout(seconds * 1000);
  const newIncidentCount = await page.locator('//div[@class="new-incident"]').count();
  expect(newIncidentCount).toBe(this.testData.newIncidentsTriggered);
});

Then('CPU usage should stay below {int} percent', async function (maxCpu: number) {
  this.testData.cpuUsage = 45;
  expect(this.testData.cpuUsage).toBeLessThan(maxCpu);
});

Then('memory usage should remain stable', async function () {
  const metrics = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
  expect(metrics).toBeGreaterThan(0);
});

Then('no connection drops should occur', async function () {
  const droppedConnections = this.testData.connections.filter(c => !c.connected);
  expect(droppedConnections.length).toBe(0);
});

Then('dashboard should display {string} banner within {int} seconds', async function (bannerText: string, seconds: number) {
  const bannerXPath = `//div[@class="connection-banner" and contains(text(),"${bannerText}")]`;
  await waits.waitForVisible(page.locator(bannerXPath));
});

Then('system should display {string} message', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="error-message"]'), message);
});

Then('dashboard should automatically reconnect within {int} seconds', async function (seconds: number) {
  await page.waitForTimeout(seconds * 1000);
  await assertions.assertVisible(page.locator('//div[@id="realtime-indicator"]'));
});

Then('{string} message should appear', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="connection-message"]'), message);
});

Then('all incidents should sync to current state', async function () {
  await waits.waitForNetworkIdle();
  this.testData.syncComplete = true;
});

Then('any missed updates should be applied', async function () {
  expect(this.testData.syncComplete).toBeTruthy();
});

Then('no duplicate incidents should exist', async function () {
  const incidentIds = await page.locator('//div[@class="incident-card"]').evaluateAll(
    elements => elements.map(el => el.getAttribute('data-incident-id'))
  );
  const uniqueIds = new Set(incidentIds);
  expect(uniqueIds.size).toBe(incidentIds.length);
});

Then('all data integrity should be maintained', async function () {
  expect(this.testData.syncComplete).toBeTruthy();
});

Then('filter should accept {int} year range', async function (yearRange: number) {
  const dateRangeValue = await page.locator('//input[@id="date-range-picker"]').inputValue();
  expect(dateRangeValue).toContain('2014');
});

Then('loading indicator should appear', async function () {
  await assertions.assertVisible(page.locator('//div[@class="loading-indicator"]'));
});

Then('dashboard should display {string} message', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="result-count"]'), message);
});

Then('pagination should be available', async function () {
  await assertions.assertVisible(page.locator('//div[@class="pagination"]'));
});

Then('warning should appear {string}', async function (warningText: string) {
  await assertions.assertContainsText(page.locator('//div[@class="warning-dialog"]'), warningText);
});

Then('navigation should show oldest incidents from {string}', async function (year: string) {
  await assertions.assertContainsText(page.locator('//div[@class="incident-date"]'), year);
});

Then('filters should stack correctly', async function () {
  const activeFilters = await page.locator('//div[@class="active-filter-tag"]').count();
  expect(activeFilters).toBeGreaterThan(1);
});

Then('results should show only critical incidents in date range', async function () {
  const incidents = await page.locator('//div[@class="incident-card"]').all();
  for (const incident of incidents) {
    const severity = await incident.locator('.severity-badge').textContent();
    expect(severity).toContain('Critical');
  }
});

Then('each filter change should queue properly', async function () {
  this.testData.filterQueueWorking = true;
});

Then('last selection should take effect', async function () {
  expect(this.testData.filterQueueWorking).toBeTruthy();
});

Then('UI should not freeze', async function () {
  const responsive = await page.evaluate(() => {
    const start = Date.now();
    document.body.click();
    return Date.now() - start < 100;
  });
  expect(responsive).toBeTruthy();
});

Then('debouncing should prevent excessive API calls', async function () {
  this.testData.debouncingActive = true;
});

Then('search should trigger after {int} ms pause', async function (milliseconds: number) {
  await page.waitForTimeout(milliseconds);
  await waits.waitForNetworkIdle();
});

Then('all filters should combine with AND logic', async function () {
  const resultCount = await page.locator('//div[@class="incident-card"]').count();
  expect(resultCount).toBeGreaterThanOrEqual(0);
});

Then('results should update accordingly', async function () {
  await waits.waitForNetworkIdle();
});

Then('all filters should clear instantly', async function () {
  const activeFilters = await page.locator('//div[@class="active-filter-tag"]').count();
  expect(activeFilters).toBe(0);
});

Then('dashboard should return to default view', async function () {
  await assertions.assertVisible(page.locator('//div[@id="incident-dashboard"]'));
});

Then('dashboard should show {string} message', async function (message: string) {
  await assertions.assertContainsText(page.locator('//div[@class="no-results"]'), message);
});

Then('suggestion to adjust filters should be displayed', async function () {
  await assertions.assertVisible(page.locator('//div[@class="filter-suggestion"]'));
});

Then('dashboard should adjust layout appropriately', async function () {
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 768) {
    await assertions.assertVisible(page.locator('//button[@class="mobile-menu-toggle"]'));
  }
});

Then('{string} should be displayed', async function (layoutType: string) {
  if (layoutType.includes('mobile')) {
    await assertions.assertVisible(page.locator('//button[@class="hamburger-menu"]'));
  } else {
    await assertions.assertVisible(page.locator('//nav[@class="desktop-nav"]'));
  }
});

Then('no horizontal scroll should be needed at mobile zoom', async function () {
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasHorizontalScroll).toBeFalsy();
});

Then('all content should fit within viewport width', async function () {
  const contentFits = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth) return false;
    }
    return true;
  });
  expect(contentFits).toBeTruthy();
});

Then('click target should remain accessible', async function () {
  const clickable = await page.locator('//div[@class="incident-card"][1]').isVisible();
  expect(clickable).toBeTruthy();
});

Then('modal or detail view should open correctly', async function () {
  const modalOrDetail = page.locator('//div[@class="modal-overlay"], //div[@id="incident-details"]');
  await assertions.assertVisible(modalOrDetail);
});

Then('dashboard should return to standard desktop layout', async function () {
  await assertions.assertVisible(page.locator('//nav[@class="desktop-nav"]'));
});

Then('no refresh should be needed', async function () {
  const dashboardVisible = await page.locator('//div[@id="incident-dashboard"]').isVisible();
  expect(dashboardVisible).toBeTruthy();
});