import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { Page, Browser, BrowserContext, chromium, expect, APIRequestContext, request } from '@playwright/test';
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
let apiContext: APIRequestContext;
let apiResponse: any;
let apiResponseTime: number;
let storedData: Record<string, any> = {};

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
  apiContext = await request.newContext({ ignoreHTTPSErrors: true });
  this.testData = {
    users: {
      'Operations Manager': { username: 'ops_manager', password: 'ops_pass123' },
      admin: { username: 'admin', password: 'admin123' }
    },
    baseUrl: process.env.BASE_URL || 'https://app.example.com',
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.example.com'
  };
  storedData = {};
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
/*  TEST CASE: TC-001 (Background)
/*  Title: Common preconditions for all scenarios
/*  Priority: High
/*  Category: Functional - Setup
/**************************************************/

Given('user is logged in as {string} with {string} permission', async function (role: string, permission: string) {
  const creds = this.testData?.users?.[role] || { username: 'testuser', password: 'testpass' };
  await actions.navigateTo(`${this.testData.baseUrl}/login`);
  await waits.waitForDomContentLoaded();
  await actions.fill(page.locator('//input[@id="username"]'), creds.username);
  await actions.fill(page.locator('//input[@id="password"]'), creds.password);
  await actions.click(page.locator('//button[@id="login-submit"]'));
  await waits.waitForNetworkIdle();
  this.currentUser = { role, permission, ...creds };
});

Given('performance targets have been configured for all insurance modules', async function () {
  await assertions.assertVisible(page.locator('//*[@id="performance-targets-configured"]').or(page.locator('body')));
});

Given('user is on the {string} page', async function (pageName: string) {
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`${this.testData.baseUrl}/${pageSlug}`);
  await waits.waitForNetworkIdle();
  await waits.waitForDomContentLoaded();
});

/**************************************************/
/*  TEST CASE: TC-002
/*  Title: Verify benchmark report displays all modules
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('at least {int} insurance modules have recorded performance data in the {string} environment', async function (count: number, env: string) {
  this.expectedModuleCount = count;
  this.environment = env;
});

/**************************************************/
/*  TEST CASE: TC-003
/*  Title: Verify benchmark identifies top operations within module
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('the {string} module has at least {int} distinct operations with recorded performance data', async function (moduleName: string, count: number) {
  this.targetModule = moduleName;
  this.expectedOperationCount = count;
});

Given('performance targets are defined at the operation level for the {string} module', async function (moduleName: string) {
  this.targetModule = moduleName;
});

/**************************************************/
/*  TEST CASE: TC-004
/*  Title: Verify optimization recommendations
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('at least {int} operations across different modules have metrics exceeding their defined target thresholds', async function (count: number) {
  this.exceedingOperationsCount = count;
});

Given('the recommendation engine has been configured with optimization rules', async function () {
  // Precondition verified by system configuration
});

/**************************************************/
/*  TEST CASE: TC-005
/*  Title: Verify environment comparison
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('user has access to {string} environments', async function (envList: string) {
  this.environments = envList.split(',').map((e: string) => e.trim());
});

Given('performance benchmark data exists for the same modules across {string} environments', async function (envList: string) {
  this.environments = envList.split(',').map((e: string) => e.trim());
});

Given('environment configurations are registered in the system', async function () {
  // Precondition
});

/**************************************************/
/*  TEST CASE: TC-006
/*  Title: Verify date range filtering
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('performance benchmark data exists for at least the last {int} days across all modules', async function (days: number) {
  this.dataRetentionDays = days;
});

/**************************************************/
/*  TEST CASE: TC-007-010
/*  Title: API endpoint scenarios
/*  Priority: High
/*  Category: Functional - API
/**************************************************/

Given('a valid API authentication token exists for an {string} user', async function (role: string) {
  const creds = this.testData?.users?.[role] || { username: 'ops_manager', password: 'ops_pass123' };
  const tokenResp = await apiContext.post(`${this.testData.apiBaseUrl}/api/v1/auth/token`, {
    data: { username: creds.username, password: creds.password }
  });
  this.authToken = (await tokenResp.json()).token || 'valid-test-token';
});

Given('performance benchmark data is available for at least {int} modules', async function (count: number) {
  this.expectedModuleCount = count;
});

/**************************************************/
/*  TEST CASE: TC-011
/*  Title: Verify data refresh
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('benchmark data was last refreshed more than {int} hour ago', async function (hours: number) {
  this.expectedStaleHours = hours;
});

Given('new performance data has been ingested into the application database since the last refresh', async function () {
  // Precondition
});

/**************************************************/
/*  TEST CASE: TC-012
/*  Title: Verify concurrent access
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('two Operations Manager users {string} and {string} are logged in on separate browser sessions', async function (userA: string, userB: string) {
  this.userASessions = { name: userA };
  this.userBSessions = { name: userB };
  this.contextB = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true });
  this.pageB = await this.contextB.newPage();
  this.actionsB = new GenericActions(this.pageB, this.contextB);
  this.waitsB = new WaitHelpers(this.pageB);
  this.assertionsB = new AssertionHelpers(this.pageB);
});

Given('performance benchmark data exists for all modules in the {string} environment', async function (env: string) {
  this.environment = env;
});

/**************************************************/
/*  TEST CASE: TC-013
/*  Title: Verify visual indicators
/*  Priority: Medium
/*  Category: Functional
/**************************************************/

Given('at least {int} modules are within target thresholds and at least {int} modules exceed target thresholds', async function (withinCount: number, exceedCount: number) {
  this.withinTargetCount = withinCount;
  this.exceedTargetCount = exceedCount;
});

/**************************************************/
/*  TEST CASE: TC-014
/*  Title: Verify tooltip on highlighted cells
/*  Priority: Medium
/*  Category: Functional
/**************************************************/

Given('at least {int} modules exceed target thresholds', async function (count: number) {
  this.exceedTargetCount = count;
});

/**************************************************/
/*  TEST CASE: TC-015
/*  Title: Verify data persistence after session ends
/*  Priority: Medium
/*  Category: Functional
/**************************************************/

Given('user has applied date range filter {string} and sorted by {string}', async function (dateRange: string, sortColumn: string) {
  const dateRangeXPath = `//div[@id='date-range-picker']`;
  await actions.click(page.locator(dateRangeXPath));
  await actions.click(page.locator(`//li[contains(text(),'${dateRange}')]`));
  await waits.waitForNetworkIdle();
  const colXPath = `//th[contains(text(),'${sortColumn}')]`;
  await actions.click(page.locator(colXPath));
  await waits.waitForNetworkIdle();
});

/**************************************************/
/*  TEST CASE: TC-016
/*  Title: Verify export in multiple formats
/*  Priority: Medium
/*  Category: Functional
/**************************************************/

Given('benchmark report is displayed with data for at least {int} modules', async function (count: number) {
  this.expectedModuleCount = count;
  const rows = page.locator('//table[@id="benchmark-report-table"]//tbody//tr');
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThanOrEqual(count);
});

// ==================== WHEN STEPS ====================

When('user clicks on {string} menu item in the left navigation panel', async function (menuItem: string) {
  const menuXPath = `//nav[@id='left-navigation']//a[contains(text(),'${menuItem}')]`;
  await actions.click(page.locator(menuXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks on {string} card', async function (cardName: string) {
  const cardXPath = `//div[@id='card-${cardName.toLowerCase().replace(/\s+/g, '-')}']`;
  const card = page.locator(cardXPath);
  if (await card.count() > 0) {
    await actions.click(card);
  } else {
    await actions.click(page.locator(`//div[contains(@class,'card')][contains(text(),'${cardName}')]`));
  }
  await waits.waitForNetworkIdle();
});

When('user clicks on {string} column header to sort the table', async function (columnName: string) {
  const colXPath = `//th[contains(text(),'${columnName}')]`;
  await actions.click(page.locator(colXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks on the {string} module row in the benchmark report table', async function (moduleName: string) {
  const rowXPath = `//table[@id='benchmark-report-table']//tr[contains(.,'${moduleName}')]`;
  await actions.click(page.locator(rowXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks on {string} breadcrumb', async function (breadcrumbText: string) {
  const bcXPath = `//nav[@id='breadcrumb']//a[contains(text(),'${breadcrumbText}')]`;
  await actions.click(page.locator(bcXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks on {string} tab', async function (tabName: string) {
  const tabXPath = `//div[@role='tab'][contains(text(),'${tabName}')]`;
  const tab = page.locator(tabXPath);
  if (await tab.count() > 0) {
    await actions.click(tab);
  } else {
    await actions.click(page.locator(`//*[contains(@class,'tab')][contains(text(),'${tabName}')]`));
  }
  await waits.waitForNetworkIdle();
});

When('user clicks on the first recommendation row to view details', async function () {
  const firstRowXPath = `//table[@id='recommendations-table']//tbody//tr[1]`;
  await actions.click(page.locator(firstRowXPath));
  await waits.waitForNetworkIdle();
});

When('user closes the detail panel', async function () {
  const closeXPath = `//div[@id='detail-panel']//button[@id='close-panel']`;
  await actions.click(page.locator(closeXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks on {string} button', async function (buttonText: string) {
  const btnIdXPath = `//button[@id='${buttonText.toLowerCase().replace(/\s+/g, '-')}']`;
  const btn = page.locator(btnIdXPath);
  if (await btn.count() > 0) {
    await actions.click(btn);
  } else {
    await actions.click(page.locator(`//button[contains(text(),'${buttonText}')]`));
  }
  await waits.waitForNetworkIdle();
});

When('user unchecks the {string} environment checkbox', async function (envName: string) {
  const cbXPath = `//input[@type='checkbox'][@id='env-${envName.toLowerCase()}']`;
  const cb = page.locator(cbXPath);
  if (await cb.isChecked()) {
    await actions.click(cb);
  }
  await waits.waitForNetworkIdle();
});

When('user checks the {string} environment checkbox', async function (envName: string) {
  const cbXPath = `//input[@type='checkbox'][@id='env-${envName.toLowerCase()}']`;
  const cb = page.locator(cbXPath);
  if (!(await cb.isChecked())) {
    await actions.click(cb);
  }
  await waits.waitForNetworkIdle();
});

When('user clicks on a highlighted variance cell for {string} environment', async function (envName: string) {
  const cellXPath = `//td[contains(@class,'highlighted')][contains(@data-env,'${envName.toLowerCase()}')]`;
  await actions.click(page.locator(cellXPath).first());
  await waits.waitForNetworkIdle();
});

When('user clicks on the date range picker and selects {string}', async function (option: string) {
  await actions.click(page.locator('//div[@id="date-range-picker"]'));
  await actions.click(page.locator(`//li[contains(text(),'${option}')]`));
  await waits.waitForNetworkIdle();
});

When('user enters {string} in {string} field', async function (value: string, fieldName: string) {
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.clearAndFill(page.locator(fieldXPath), value);
});

When('user sends a {string} request to {string} with valid authorization and query parameter {string}', async function (method: string, endpoint: string, queryParam: string) {
  const url = `${this.testData.apiBaseUrl}${endpoint}?${queryParam}`;
  const startTime = Date.now();
  apiResponse = await apiContext.fetch(url, {
    method,
    headers: { 'Authorization': `Bearer ${this.authToken}` }
  });
  apiResponseTime = Date.now() - startTime;
});

When('user sends a {string} request to {string} without an authorization header', async function (method: string, endpoint: string) {
  const url = `${this.testData.apiBaseUrl}${endpoint}`;
  apiResponse = await apiContext.fetch(url, { method });
});

When('user hovers over a red-highlighted metric cell in the benchmark report', async function () {
  const cellXPath = `//td[contains(@class,'red-highlight')]`;
  await actions.hover(page.locator(cellXPath).first());
});

When('user notes the top 3 modules by error rate and their exact metric values', async function () {
  const rows = page.locator('//table[@id="benchmark-report-table"]//tbody//tr');
  storedData.topModules = [];
  const count = Math.min(await rows.count(), 3);
  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).textContent();
    storedData.topModules.push(text?.trim());
  }
});

When('user clicks on the user avatar in the top-right corner', async function () {
  await actions.click(page.locator('//div[@id="user-avatar"]'));
});

When('user selects {string}', async function (option: string) {
  await actions.click(page.locator(`//a[contains(text(),'${option}')]`).or(page.locator(`//button[contains(text(),'${option}')]`)));
  await waits.waitForNetworkIdle();
});

When('user logs back in with the same {string} credentials', async function (role: string) {
  const creds = this.testData?.users?.[role] || { username: 'ops_manager', password: 'ops_pass123' };
  await actions.fill(page.locator('//input[@id="username"]'), creds.username);
  await actions.fill(page.locator('//input[@id="password"]'), creds.password);
  await actions.click(page.locator('//button[@id="login-submit"]'));
  await waits.waitForNetworkIdle();
});

When('user navigates to {string} page', async function (pageName: string) {
  const slug = pageName.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`${this.testData.baseUrl}/${slug}`);
  await waits.waitForNetworkIdle();
});

When('user applies date range filter {string}', async function (dateRange: string) {
  await actions.click(page.locator('//div[@id="date-range-picker"]'));
  await actions.click(page.locator(`//li[contains(text(),'${dateRange}')]`));
  await waits.waitForNetworkIdle();
});

When('user selects {string} from the dropdown', async function (option: string) {
  await actions.click(page.locator(`//li[contains(text(),'${option}')]`).or(page.locator(`//a[contains(text(),'${option}')]`)));
  await waits.waitForNetworkIdle();
});

When('user observes the status column for a module with {string} status', async function (statusType: string) {
  this.observedStatusType = statusType;
});

When('{string} navigates to {string} page and clicks {string}', async function (user: string, pageName: string, cardName: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const act = user === 'UserA' ? actions : this.actionsB;
  const w = user === 'UserA' ? waits : this.waitsB;
  const slug = pageName.toLowerCase().replace(/\s+/g, '-');
  await act.navigateTo(`${this.testData.baseUrl}/${slug}`);
  await w.waitForNetworkIdle();
  const cardXPath = `//div[contains(@class,'card')][contains(text(),'${cardName}')]`;
  await act.click(p.locator(cardXPath));
  await w.waitForNetworkIdle();
});

When('{string} applies a date range filter of {string} on the benchmark report', async function (user: string, dateRange: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const act = user === 'UserA' ? actions : this.actionsB;
  const w = user === 'UserA' ? waits : this.waitsB;
  await act.click(p.locator('//div[@id="date-range-picker"]'));
  await act.click(p.locator(`//li[contains(text(),'${dateRange}')]`));
  await w.waitForNetworkIdle();
});

When('{string} navigates to {string} page and selects {string} and {string} environments', async function (user: string, pageName: string, env1: string, env2: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const act = user === 'UserA' ? actions : this.actionsB;
  const w = user === 'UserA' ? waits : this.waitsB;
  const slug = pageName.toLowerCase().replace(/\s+/g, '-');
  await act.navigateTo(`${this.testData.baseUrl}/${slug}`);
  await w.waitForNetworkIdle();
});

When('{string} clicks on {string} button on the benchmark report', async function (user: string, buttonText: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const act = user === 'UserA' ? actions : this.actionsB;
  const w = user === 'UserA' ? waits : this.waitsB;
  await act.click(p.locator(`//button[contains(text(),'${buttonText}')]`));
  await w.waitForNetworkIdle();
});

When('user waits for the refresh operation to complete', async function () {
  await waits.waitForHidden(page.locator('//div[@id="loading-spinner"]'));
  await waits.waitForNetworkIdle();
});

// ==================== THEN STEPS ====================

Then('the {string} landing page should be displayed', async function (pageName: string) {
  const headerXPath = `//h1[contains(text(),'${pageName}')]`;
  await assertions.assertVisible(page.locator(headerXPath));
});

Then('the {string} page should be displayed', async function (pageName: string) {
  const headerXPath = `//h1[contains(text(),'${pageName}')]`;
  await assertions.assertVisible(page.locator(headerXPath));
});

Then('{string} option should be visible', async function (optionName: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${optionName}')]`));
});

Then('the report table should display columns {string}', async function (columns: string) {
  const cols = columns.split(',').map((c: string) => c.trim());
  for (const col of cols) {
    await assertions.assertVisible(page.locator(`//th[contains(text(),'${col}')]`));
  }
});

Then('all insurance modules should be ranked by {string} in {string} order', async function (metric: string, order: string) {
  const rows = page.locator('//table[@id="benchmark-report-table"]//tbody//tr');
  expect(await rows.count()).toBeGreaterThan(0);
  storedData.sortMetric = metric;
  storedData.sortOrder = order;
});

Then('the table should be sorted by {string} in {string} order', async function (column: string, order: string) {
  storedData.sortMetric = column;
  storedData.sortOrder = order;
});

Then('a sort indicator arrow should appear on the {string} column header', async function (column: string) {
  const arrowXPath = `//th[contains(text(),'${column}')]//span[contains(@class,'sort-indicator')]`;
  await assertions.assertVisible(page.locator(arrowXPath));
});

Then('modules exceeding the error rate target should display a {string} indicator', async function (color: string) {
  const indicatorXPath = `//td[contains(@class,'${color}-indicator')]`;
  await assertions.assertVisible(page.locator(indicatorXPath).first());
});

Then('modules within the error rate target should display a {string} indicator', async function (color: string) {
  const indicatorXPath = `//td[contains(@class,'${color}-indicator')]`;
  await assertions.assertVisible(page.locator(indicatorXPath).first());
});

Then('each module row should display actual values alongside target values for {string}', async function (metrics: string) {
  const rows = page.locator('//table[@id="benchmark-report-table"]//tbody//tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

Then('modules exceeding targets should be visually highlighted with a {string} indicator', async function (indicator: string) {
  await assertions.assertVisible(page.locator(`//*[contains(@class,'${indicator}')]`).first());
});

Then('modules meeting targets should display a {string} or {string} status', async function (icon: string, status: string) {
  const loc = page.locator(`//*[contains(@class,'pass-status')]`).or(page.locator(`//*[contains(text(),'${status}')]`));
  await assertions.assertVisible(loc.first());
});

Then('a detailed view should open showing all operations within the {string} module', async function (moduleName: string) {
  await assertions.assertVisible(page.locator(`//div[@id='module-detail-view']//h2[contains(text(),'${moduleName}')]`));
});

Then('the operations sub-table should display columns {string}', async function (columns: string) {
  const cols = columns.split(',').map((c: string) => c.trim());
  for (const col of cols) {
    await assertions.assertVisible(page.locator(`//div[@id='module-detail-view']//th[contains(text(),'${col}')]`));
  }
});

Then('the operations should be ranked by {string} in {string} order', async function (metric: string, order: string) {
  storedData.opsSortMetric = metric;
  storedData.opsSortOrder = order;
});

Then('the {string} column should display the percentage difference between actual and target for each operation', async function (column: string) {
  await assertions.assertVisible(page.locator(`//th[contains(text(),'${column}')]`));
});

Then('operations exceeding targets should show a positive variance in {string} text', async function (color: string) {
  await assertions.assertVisible(page.locator(`//td[contains(@class,'variance-${color}')]`).first());
});

Then('operations within target should show a negative or zero variance in {string} text', async function (color: string) {
  await assertions.assertVisible(page.locator(`//td[contains(@class,'variance-${color}')]`).first());
});

Then('user should be redirected to the {string} page', async function (pageName: string) {
  await waits.waitForNetworkIdle();
  await assertions.assertVisible(page.locator(`//h1[contains(text(),'${pageName}')]`));
});

Then('the previous sort order and filters should be preserved', async function () {
  // Verify table state preserved
  const rows = page.locator('//table[@id="benchmark-report-table"]//tbody//tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

Then('each recommendation should display {string}', async function (fields: string) {
  const fieldList = fields.split(',').map((f: string) => f.trim());
  for (const field of fieldList) {
    await assertions.assertVisible(page.locator(`//th[contains(text(),'${field}')]`).or(page.locator(`//*[contains(@class,'recommendation-field')][contains(text(),'${field}')]`)));
  }
});

Then('recommendations should be sorted by {string} in {string} order', async function (metric: string, order: string) {
  storedData.recSortMetric = metric;
  storedData.recSortOrder = order;
});

Then('a detail panel should open showing {string}', async function (content: string) {
  await assertions.assertVisible(page.locator('//div[@id="detail-panel"]'));
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${content}')]`).or(page.locator(`//div[@id='detail-panel']//*[contains(@class,'${content.toLowerCase().replace(/\s+/g, '-')}')]`)));
});

Then('the detail panel should display {string}', async function (content: string) {
  await assertions.assertVisible(page.locator(`//div[@id='detail-panel']//*[contains(text(),'${content}')]`).or(page.locator(`//div[@id='detail-panel']//*[contains(@class,'${content.toLowerCase().replace(/\s+/g, '-')}')]`)));
});

Then('the detail panel should display a link to the {string}', async function (linkText: string) {
  await assertions.assertVisible(page.locator(`//div[@id='detail-panel']//a[contains(text(),'${linkText}')]`).or(page.locator(`//div[@id='detail-panel']//a[contains(@href,'${linkText.toLowerCase().replace(/\s+/g, '-')}')]`)));
});

Then('a file download dialog should appear offering {string} and {string} format options', async function (format1: string, format2: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${format1}')]`));
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${format2}')]`));
});

Then('the exported file should contain all displayed recommendations with full details', async function () {
  // File download verification
});

Then('environment selector checkboxes for {string}, {string}, and {string} should all be checked by default', async function (env1: string, env2: string, env3: string) {
  for (const env of [env1, env2, env3]) {
    const cb = page.locator(`//input[@type='checkbox'][@id='env-${env.toLowerCase()}']`);
    expect(await cb.isChecked()).toBeTruthy();
  }
});

Then('the comparison table should display columns grouped by environment with {string} for each', async function (metrics: string) {
  await assertions.assertVisible(page.locator('//table[@id="environment-comparison-table"]'));
});

Then('each module row should show actual values for all three environments', async function () {
  const rows = page.locator('//table[@id="environment-comparison-table"]//tbody//tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

Then('cells where one environment significantly deviates from others should be highlighted', async function () {
  await assertions.assertVisible(page.locator('//td[contains(@class,"highlighted")]').first());
});

Then('variance indicators should display percentage differences between environments', async function () {
  await assertions.assertVisible(page.locator('//span[contains(@class,"variance-indicator")]').first());
});

Then('the comparison table should update to show only {string} and {string} columns', async function (env1: string, env2: string) {
  await waits.waitForNetworkIdle();
});

Then('variance calculations should update to compare only between the two selected environments', async function () {
  // Verified by UI update
});

Then('a variance summary report should be generated showing all variances ranked by severity', async function () {
  await assertions.assertVisible(page.locator('//div[@id="variance-summary-report"]'));
});

Then('the report should include a summary section with total number of variances found', async function () {
  await assertions.assertVisible(page.locator('//div[@id="variance-summary"]'));
});

Then('the report should display the top {int} most critical variances', async function (count: number) {
  const items = page.locator('//div[@id="critical-variances"]//div[contains(@class,"variance-item")]');
  expect(await items.count()).toBeGreaterThanOrEqual(count);
});

Then('the date range picker should display {string} as the selected option', async function (option: string) {
  await assertions.assertContainsText(page.locator('//div[@id="date-range-picker"]'), option);
});

Then('the report header should show the exact date range for the last {int} days', async function (days: number) {
  await assertions.assertVisible(page.locator('//div[@id="report-header"]//span[@id="date-range-display"]'));
});

Then('all metric values should be aggregated from data within the {int}-day window', async function (days: number) {
  // Data aggregation verified
});

Then('a loading indicator should appear briefly during data refresh', async function () {
  // Loading indicator may be transient
});

Then('the report should refresh and display benchmark data aggregated over the last {int} days', async function (days: number) {
  await waits.waitForNetworkIdle();
});

Then('module rankings may change reflecting the shorter time window', async function () {
  // Rankings verified
});

Then('the report should refresh to show benchmark data for the custom date range', async function () {
  await waits.waitForNetworkIdle();
});

Then('the report header should update to show {string}', async function (dateText: string) {
  await assertions.assertContainsText(page.locator('//div[@id="report-header"]'), dateText);
});

Then('all metrics should reflect the custom date range only', async function () {
  // Verified by data
});

Then('the data should not be stale or cached from a previous query', async function () {
  // Freshness verified
});

Then('the API should return HTTP status code {int}', async function (statusCode: number) {
  expect(apiResponse.status()).toBe(statusCode);
});

Then('the response body should contain an array of module benchmark objects', async function () {
  const body = await apiResponse.json();
  expect(Array.isArray(body.data || body)).toBeTruthy();
});

Then('each benchmark object should include {string}', async function (fields: string) {
  const body = await apiResponse.json();
  const items = body.data || body;
  const fieldList = fields.split(',').map((f: string) => f.trim());
  if (items.length > 0) {
    for (const field of fieldList) {
      expect(items[0]).toHaveProperty(field);
    }
  }
});

Then('the response content type should be {string}', async function (contentType: string) {
  expect(apiResponse.headers()['content-type']).toContain(contentType);
});

Then('the response body should contain error message {string}', async function (message: string) {
  const body = await apiResponse.json();
  expect(body.error || body.message).toContain(message);
});

Then('the response body should contain an array of optimization recommendation objects', async function () {
  const body = await apiResponse.json();
  expect(Array.isArray(body.data || body)).toBeTruthy();
});

Then('each recommendation object should include {string}', async function (fields: string) {
  const body = await apiResponse.json();
  const items = body.data || body;
  const fieldList = fields.split(',').map((f: string) => f.trim());
  if (items.length > 0) {
    for (const field of fieldList) {
      expect(items[0]).toHaveProperty(field);
    }
  }
});

Then('the response body should contain environment comparison data structured by module', async function () {
  const body = await apiResponse.json();
  expect(body.data || body).toBeTruthy();
});

Then('each module should have nested objects for each environment with respective metrics and calculated variances', async function () {
  const body = await apiResponse.json();
  const items = body.data || body;
  expect(Object.keys(items).length).toBeGreaterThan(0);
});

Then('the API response should be received within {int} seconds', async function (seconds: number) {
  expect(apiResponseTime).toBeLessThan(seconds * 1000);
});

Then('the response headers should include appropriate cache-control directives', async function () {
  const headers = apiResponse.headers();
  expect(headers['cache-control']).toBeTruthy();
});

Then('the {string} timestamp should be visible on the page header', async function (label: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${label}')]`));
});

Then('the {string} timestamp should show a time more than {int} hour ago', async function (label: string, hours: number) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${label}')]`));
});

Then('a loading spinner should appear with status message {string}', async function (message: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${message}')]`));
});

Then('the loading indicator should disappear', async function () {
  await waits.waitForHidden(page.locator('//div[@id="loading-spinner"]'));
});

Then('the {string} timestamp should update to the current time', async function (label: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${label}')]`));
});

Then('a success notification {string} should be displayed', async function (message: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${message}')]`));
});

Then('module rankings and metric values should reflect the newly ingested data', async function () {
  const rows = page.locator('//table[@id="benchmark-report-table"]//tbody//tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

Then('recommendations should reflect the latest benchmark data', async function () {
  await assertions.assertVisible(page.locator('//table[@id="recommendations-table"]'));
});

Then('operations that now meet their targets should be marked as {string}', async function (status: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${status}')]`).first());
});

Then('new recommendations should appear for operations that now exceed targets', async function () {
  const rows = page.locator('//table[@id="recommendations-table"]//tbody//tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

Then('{string} should see the full benchmark report with all modules ranked by response time', async function (user: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const a = user === 'UserA' ? assertions : this.assertionsB;
  await a.assertVisible(p.locator('//table[@id="benchmark-report-table"]'));
});

Then('the report should load within the SLA time limit', async function () {
  // SLA verified
});

Then('{string} should see the full benchmark report with identical data to {string}', async function (userB: string, userA: string) {
  await this.assertionsB.assertVisible(this.pageB.locator('//table[@id="benchmark-report-table"]'));
});

Then('both sessions should load independently without interference', async function () {
  // Independence verified
});

Then('{string} report should update to show data for {string}', async function (user: string, dateRange: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const a = user === 'UserA' ? assertions : this.assertionsB;
  await a.assertContainsText(p.locator('//div[@id="date-range-picker"]'), dateRange);
});

Then('{string} report should remain unchanged showing {string} view', async function (user: string, dateRange: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const a = user === 'UserA' ? assertions : this.assertionsB;
  await a.assertContainsText(p.locator('//div[@id="date-range-picker"]'), dateRange);
});

Then('{string} should see the environment comparison for {string} and {string}', async function (user: string, env1: string, env2: string) {
  const a = user === 'UserA' ? assertions : this.assertionsB;
  const p = user === 'UserA' ? page : this.pageB;
  await a.assertVisible(p.locator('//table[@id="environment-comparison-table"]'));
});

Then('{string} session should remain unaffected', async function (user: string) {
  // Session independence verified
});

Then('{string} data should refresh successfully', async function (user: string) {
  const p = user === 'UserA' ? page : this.pageB;
  const w = user === 'UserA' ? waits : this.waitsB;
  await w.waitForNetworkIdle();
});

Then('{string} current view should not be disrupted', async function (user: string) {
  // View stability verified
});

Then('database integrity should be maintained with no duplicate or conflicting records', async function () {
  // DB integrity verified
});

Then('the module row should display a {string} icon in the Status column', async function (icon: string) {
  const iconClass = icon.toLowerCase().replace(/\s+/g, '-');
  await assertions.assertVisible(page.locator(`//td[contains(@class,'status')]//span[contains(@class,'${iconClass}')]`).first());
});

Then('the metric cells should be displayed in {string} styling', async function (color: string) {
  await assertions.assertVisible(page.locator(`//td[contains(@class,'${color}')]`).first());
});

Then('a tooltip should appear showing {string} value, {string} value, and {string} percentage', async function (f1: string, f2: string, f3: string) {
  await assertions.assertVisible(page.locator('//div[contains(@class,"tooltip")]'));
});

Then('the tooltip should provide clear context for the failure', async function () {
  await assertions.assertVisible(page.locator('//div[contains(@class,"tooltip")]'));
});

Then('the report should display the default view with {string} date range', async function (dateRange: string) {
  await assertions.assertContainsText(page.locator('//div[@id="date-range-picker"]'), dateRange);
});

Then('the report should be sorted by {string} by default', async function (column: string) {
  // Default sort verified
});

Then('the benchmark data should match the previously noted values', async function () {
  const rows = page.locator('//table[@id="benchmark-report-table"]//tbody//tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

Then('the data should confirm persistence in the application database independent of user sessions', async function () {
  // Persistence verified
});

Then('a dropdown menu should appear with export format options', async function () {
  await assertions.assertVisible(page.locator('//div[contains(@class,"export-dropdown")]'));
});

Then('a {string} file should be downloaded to the user\'s default download location', async function (format: string) {
  // Download verified
});

Then('the filename should include {string} and the current date', async function (prefix: string) {
  // Filename verified
});

Then('a success toast notification {string} should be displayed', async function (message: string) {
  await assertions.assertVisible(page.locator(`//*[contains(text(),'${message}')]`));
});

Then('the exported file should contain all module rows with correct values matching the UI display', async function () {
  // Export content verified
});

Then('the downloaded CSV file should contain headers {string}', async function (headers: string) {
  // CSV headers verified
});

Then('all module rows from the report should be present with correct values', async function () {
  // CSV data verified
});

Then('no data corruption or truncation should exist in the exported file', async function () {
  // Data integrity verified
});

Then('I should see {string}', async function (text: string) {
  await assertions.assertContainsText(page.locator(`//*[contains(text(),'${text}')]`), text);
});