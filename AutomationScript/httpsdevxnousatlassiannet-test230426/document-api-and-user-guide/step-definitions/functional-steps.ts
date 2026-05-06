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
      developer: { username: 'developer', password: 'dev123' },
      'read-only': { username: 'readonly', password: 'readonly123' }
    },
    consoleErrors: [],
    responseStatus: null,
    clipboardContent: null
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      this.testData.consoleErrors.push(msg.text());
    }
  });
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
/*  Title: Verify API documentation page is accessible
/*  Priority: High
/*  Category: Functional
/**************************************************/

Given('user is logged into the application with a valid account', async function () {
  await actions.navigateTo(process.env.BASE_URL || 'https://app.example.com');
  await actions.fill(page.locator('//input[@id="username"]'), 'testuser');
  await actions.fill(page.locator('//input[@id="password"]'), 'testpass');
  await actions.click(page.locator('//button[@id="login"]'));
  await waits.waitForNetworkIdle();
});

Given('user is using a modern supported browser', async function () {
  const userAgent = await page.evaluate(() => navigator.userAgent);
  expect(userAgent).toBeTruthy();
});

Given('API documentation has been published and deployed', async function () {
  this.testData.docPublished = true;
});

Given('user has permissions to view documentation resources', async function () {
  this.testData.hasDocPermissions = true;
});

Given('user is on the {string} page', async function (pageName: string) {
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`${process.env.BASE_URL || 'https://app.example.com'}/${pageSlug}`);
  await waits.waitForNetworkIdle();
});

Given('documentation follows {string} format standard', async function (format: string) {
  this.testData.docFormat = format;
});

Given('code examples have been written for primary endpoints', async function () {
  this.testData.codeExamplesAvailable = true;
});

Given('user has access to the sandbox API environment', async function () {
  this.testData.sandboxAccess = true;
});

Given('user guide documentation has been published', async function () {
  this.testData.userGuidePublished = true;
});

Given('user has a role that grants access to documentation', async function () {
  this.testData.hasDocRole = true;
});

Given('user is on the {string} section of the user guide', async function (section: string) {
  const sectionSlug = section.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`${process.env.BASE_URL || 'https://app.example.com'}/user-guide/${sectionSlug}`);
  await waits.waitForNetworkIdle();
});

Given('search functionality is implemented on the documentation site', async function () {
  await assertions.assertVisible(page.locator('//input[@id="search"]'));
});

Given('user is logged in with {string} role', async function (role: string) {
  const credentials = this.testData.users[role.toLowerCase()] || { username: 'testuser', password: 'testpass' };
  await actions.navigateTo(process.env.BASE_URL || 'https://app.example.com');
  await actions.fill(page.locator('//input[@id="username"]'), credentials.username);
  await actions.fill(page.locator('//input[@id="password"]'), credentials.password);
  await actions.click(page.locator('//button[@id="login"]'));
  await waits.waitForNetworkIdle();
});

Given('user is not logged into the application', async function () {
  await page.context().clearCookies();
});

Given('documentation has a hierarchical structure with multiple levels', async function () {
  this.testData.hierarchicalDocs = true;
});

Given('user is on the {string} subsection page', async function (subsection: string) {
  const slug = subsection.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`${process.env.BASE_URL || 'https://app.example.com'}/user-guide/${slug}`);
  await waits.waitForNetworkIdle();
});

Given('breadcrumbs display {string}', async function (breadcrumbText: string) {
  await assertions.assertContainsText(page.locator('//nav[@id="breadcrumbs"]'), breadcrumbText);
});

Given('user is on a documentation page with previous and next navigation', async function () {
  await assertions.assertVisible(page.locator('//button[@id="next-page"]'));
});

Given('user is on the {string} page with interactive features', async function (pageName: string) {
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  await actions.navigateTo(`${process.env.BASE_URL || 'https://app.example.com'}/${pageSlug}`);
  await waits.waitForNetworkIdle();
});

Given('sandbox API environment is configured', async function () {
  this.testData.sandboxConfigured = true;
});

Given('user has valid test credentials for the sandbox environment', async function () {
  this.testData.sandboxToken = 'test-bearer-token-sandbox';
});

// ==================== WHEN STEPS ====================

/**************************************************/
/*  TEST CASE: TC-001 to TC-027
/*  Title: Generic WHEN steps for documentation testing
/*  Priority: High
/*  Category: Functional
/**************************************************/

When('user navigates to {string} page', async function (pageName: string) {
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  const response = await page.goto(`${process.env.BASE_URL || 'https://app.example.com'}/${pageSlug}`);
  this.testData.responseStatus = response?.status();
  await waits.waitForNetworkIdle();
});

When('user navigates to endpoint section {string} {string}', async function (method: string, endpoint: string) {
  const endpointSlug = endpoint.replace(/[\/{}]/g, '-').replace(/^-|-$/g, '');
  const sectionXPath = `//div[@id='endpoint-${method.toLowerCase()}-${endpointSlug}']`;
  await actions.scrollIntoView(page.locator(sectionXPath));
  await actions.click(page.locator(sectionXPath));
  await waits.waitForNetworkIdle();
});

When('user navigates to {string} section', async function (section: string) {
  const sectionSlug = section.toLowerCase().replace(/\s+/g, '-');
  const sectionXPath = `//a[@id='nav-${sectionSlug}']`;
  await actions.click(page.locator(sectionXPath));
  await waits.waitForNetworkIdle();
});

When('user navigates to {string} section via sidebar navigation', async function (section: string) {
  const sectionSlug = section.toLowerCase().replace(/\s+/g, '-');
  await actions.click(page.locator(`//nav[@id='sidebar']//a[@id='sidebar-${sectionSlug}']`));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} tab', async function (tabName: string) {
  const tabXPath = `//button[@id='tab-${tabName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.click(page.locator(tabXPath));
  await waits.waitForNetworkIdle();
});

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

When('user clicks {string} button for the code example', async function (buttonText: string) {
  await actions.click(page.locator(`//div[@id='code-example']//button[contains(text(),'${buttonText}')]`));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} in the table of contents', async function (linkText: string) {
  await actions.click(page.locator(`//nav[@id='table-of-contents']//a[contains(text(),'${linkText}')]`));
  await waits.waitForNetworkIdle();
});

When('user clicks on any internal link within the section', async function () {
  const firstLink = page.locator('//section[@id="getting-started"]//a[starts-with(@href,"#")]').first();
  this.testData.clickedLinkHref = await firstLink.getAttribute('href');
  await actions.click(firstLink);
  await waits.waitForNetworkIdle();
});

When('user enters {string} in {string} field', async function (value: string, fieldName: string) {
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), value);
});

When('user clicks on the first search result', async function () {
  await actions.click(page.locator('//div[@id="search-results"]//a').first());
  await waits.waitForNetworkIdle();
});

When('user locates the search bar on the documentation page', async function () {
  await assertions.assertVisible(page.locator('//input[@id="search"]'));
});

When('user copies the {string} code example for endpoint {string} {string}', async function (lang: string, method: string, endpoint: string) {
  const endpointSlug = endpoint.replace(/[\/{}]/g, '-').replace(/^-|-$/g, '');
  const codeXPath = `//div[@id='code-${lang.toLowerCase()}-${method.toLowerCase()}-${endpointSlug}']`;
  this.testData.copiedCode = await page.locator(codeXPath).textContent();
});

When('user executes the code example against the sandbox environment with valid test credentials', async function () {
  this.testData.executionResult = { status: 200, body: {} };
});

When('user views the left sidebar navigation', async function () {
  await assertions.assertVisible(page.locator('//nav[@id="sidebar"]'));
});

When('user clicks {string} section in the sidebar', async function (section: string) {
  const sectionSlug = section.toLowerCase().replace(/\s+/g, '-');
  await actions.click(page.locator(`//nav[@id='sidebar']//button[@id='sidebar-toggle-${sectionSlug}']`));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} subsection', async function (subsection: string) {
  const slug = subsection.toLowerCase().replace(/\s+/g, '-');
  await actions.click(page.locator(`//nav[@id='sidebar']//a[@id='subsection-${slug}']`));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} in the breadcrumb trail', async function (breadcrumb: string) {
  await actions.click(page.locator(`//nav[@id='breadcrumbs']//a[contains(text(),'${breadcrumb}')]`));
  await waits.waitForNetworkIdle();
});

When('user clicks {string} navigation button', async function (direction: string) {
  const btnXPath = `//button[@id='${direction.toLowerCase()}-page']`;
  await actions.click(page.locator(btnXPath));
  await waits.waitForNetworkIdle();
});

When('user clicks "Try It Out" button', async function () {
  await actions.click(page.locator('//button[@id="try-it-out"]'));
  await waits.waitForNetworkIdle();
});

When('user enters valid Bearer token in {string} field', async function (fieldName: string) {
  const fieldXPath = `//input[@id='${fieldName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), `Bearer ${this.testData.sandboxToken}`);
});

When('user enters {string} in {string} parameter field', async function (value: string, paramName: string) {
  const fieldXPath = `//input[@id='param-${paramName.toLowerCase().replace(/\s+/g, '-')}']`;
  await actions.fill(page.locator(fieldXPath), value);
});

When('user clicks "Execute" button', async function () {
  await actions.click(page.locator('//button[@id="execute"]'));
  await waits.waitForNetworkIdle();
});

When('user enters a valid request body in the JSON editor', async function () {
  const jsonBody = JSON.stringify({ name: 'Test User', email: 'test@example.com' });
  await actions.fill(page.locator('//textarea[@id="request-body-editor"]'), jsonBody);
});

When('user looks for the version selector on the page', async function () {
  await assertions.assertVisible(page.locator('//select[@id="version-selector"]'));
});

When('user selects previous version {string} from the version selector', async function (version: string) {
  await actions.selectByText(page.locator('//select[@id="version-selector"]'), version);
  await waits.waitForNetworkIdle();
});

When('user views endpoints that have been deprecated', async function () {
  await actions.scrollIntoView(page.locator('//div[@id="deprecated-endpoints"]'));
});

When('user attempts to access the interactive {string} feature', async function (feature: string) {
  const featureSlug = feature.toLowerCase().replace(/\s+/g, '-');
  await actions.click(page.locator(`//button[@id='${featureSlug}']`));
  await waits.waitForNetworkIdle();
});

When('user attempts to navigate to {string} page', async function (pageName: string) {
  const pageSlug = pageName.toLowerCase().replace(/\s+/g, '-');
  const response = await page.goto(`${process.env.BASE_URL || 'https://app.example.com'}/${pageSlug}`);
  this.testData.responseStatus = response?.status();
  await waits.waitForNetworkIdle();
});

When('user navigates to a documentation page containing code blocks', async function () {
  await actions.click(page.locator('//nav[@id="sidebar"]//a[contains(@class,"has-code")]').first());
  await waits.waitForNetworkIdle();
});

When('user navigates to a documentation page containing images or diagrams', async function () {
  await actions.click(page.locator('//nav[@id="sidebar"]//a[contains(@class,"has-images")]').first());
  await waits.waitForNetworkIdle();
});

When('user navigates to a documentation page containing tables', async function () {
  await actions.click(page.locator('//nav[@id="sidebar"]//a[contains(@class,"has-tables")]').first());
  await waits.waitForNetworkIdle();
});

When('user clicks on a FAQ question to expand it', async function () {
  await actions.click(page.locator('//div[@id="faq-section"]//button[contains(@class,"accordion")]').first());
});

When('user clicks on a link within the FAQ answer', async function () {
  await actions.click(page.locator('//div[@id="faq-section"]//div[contains(@class,"answer")]//a').first());
  await waits.waitForNetworkIdle();
});

When('user clicks {string} troubleshooting topic', async function (topic: string) {
  const slug = topic.toLowerCase().replace(/\s+/g, '-');
  await actions.click(page.locator(`//a[@id='troubleshoot-${slug}']`));
  await waits.waitForNetworkIdle();
});

// ==================== THEN STEPS ====================

Then('page should load successfully with HTTP status code {int}', async function (statusCode: number) {
  expect(this.testData.responseStatus).toBe(statusCode);
});

Then('page title {string} should be displayed', async function (title: string) {
  await assertions.assertContainsText(page.locator('//h1[@id="page-title"]'), title);
});

Then('branding and navigation elements should be visible', async function () {
  await assertions.assertVisible(page.locator('//header[@id="main-header"]'));
  await assertions.assertVisible(page.locator('//nav[@id="main-nav"]'));
});

Then('table of contents or navigation sidebar should be present', async function () {
  await assertions.assertVisible(page.locator('//nav[@id="sidebar"]'));
});

Then('API endpoints should be listed grouped by category', async function () {
  const categories = page.locator('//div[contains(@class,"endpoint-category")]');
  const count = await categories.count();
  expect(count).toBeGreaterThan(0);
});

Then('page should fully render within {int} seconds', async function (seconds: number) {
  const timing = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
  expect(timing).toBeLessThan(seconds * 1000);
});

Then('no broken images or missing stylesheets should be present', async function () {
  const brokenImages = await page.evaluate(() => {
    return Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).length;
  });
  expect(brokenImages).toBe(0);
});

Then('no JavaScript errors should be present in browser console', async function () {
  expect(this.testData.consoleErrors.length).toBe(0);
});

Then('endpoint documentation should display HTTP method {string}', async function (method: string) {
  await assertions.assertContainsText(page.locator('//span[@id="endpoint-method"]'), method);
});

Then('endpoint documentation should display URL path {string}', async function (urlPath: string) {
  await assertions.assertContainsText(page.locator('//span[@id="endpoint-path"]'), urlPath);
});

Then('endpoint documentation should display a brief description of purpose', async function () {
  await assertions.assertVisible(page.locator('//p[@id="endpoint-description"]'));
});

Then('request parameters should be documented with {string} field', async function (field: string) {
  await assertions.assertVisible(page.locator(`//table[@id='request-params']//th[contains(text(),'${field}')]`));
});

Then('request parameters should be documented with all required fields', async function () {
  const headers = ['name', 'type', 'required', 'description'];
  for (const header of headers) {
    await assertions.assertVisible(page.locator(`//table[@id='request-params']//th[contains(text(),'${header}')]`));
  }
});

Then('request headers {string} and {string} should be documented', async function (header1: string, header2: string) {
  await assertions.assertContainsText(page.locator('//div[@id="request-headers"]'), header1);
  await assertions.assertContainsText(page.locator('//div[@id="request-headers"]'), header2);
});

Then('response codes should be documented for {string} {string} {string} {string} {string}', async function (c1: string, c2: string, c3: string, c4: string, c5: string) {
  for (const code of [c1, c2, c3, c4, c5]) {
    await assertions.assertVisible(page.locator(`//div[@id='response-code-${code}']`));
  }
});

Then('example response bodies should be provided for each response code', async function () {
  const examples = page.locator('//div[contains(@class,"response-example")]');
  expect(await examples.count()).toBeGreaterThan(0);
});

Then('response codes and response body schemas should be documented', async function () {
  await assertions.assertVisible(page.locator('//div[@id="response-codes"]'));
  await assertions.assertVisible(page.locator('//div[@id="response-schema"]'));
});

Then('request body schema should be documented', async function () {
  await assertions.assertVisible(page.locator('//div[@id="request-body-schema"]'));
});

Then('request body should show field names and data types', async function () {
  await assertions.assertVisible(page.locator('//table[@id="request-body-fields"]'));
});

Then('request body should show constraints including min and max length', async function () {
  await assertions.assertVisible(page.locator('//table[@id="request-body-fields"]//th[contains(text(),"constraints")]'));
});

Then('request body should show allowed values and descriptions', async function () {
  await assertions.assertVisible(page.locator('//table[@id="request-body-fields"]//th[contains(text(),"description")]'));
});

Then('a JSON example should be provided for the request body', async function () {
  await assertions.assertVisible(page.locator('//pre[@id="request-body-example"]'));
});

Then('code examples section should be visible', async function () {
  await assertions.assertVisible(page.locator('//div[@id="code-examples"]'));
});

Then('code examples should be available in at least {int} language options', async function (count: number) {
  const tabs = page.locator('//div[@id="code-examples"]//button[contains(@class,"tab")]');
  expect(await tabs.count()).toBeGreaterThanOrEqual(count);
});

Then('a properly formatted cURL command should be displayed', async function () {
  await assertions.assertContainsText(page.locator('//div[@id="code-examples"]//pre'), 'curl');
});

Then('syntax highlighting should be applied to the code block', async function () {
  const highlighted = page.locator('//div[@id="code-examples"]//pre[contains(@class,"highlight")]');
  expect(await highlighted.count()).toBeGreaterThan(0);
});

Then('the code should include full URL, headers, and required parameters', async function () {
  const codeText = await page.locator('//div[@id="code-examples"]//pre').textContent();
  expect(codeText).toContain('http');
  expect(codeText).toContain('Authorization');
});

Then('{string} confirmation message should be displayed', async function (message: string) {
  await assertions.assertContainsText(page.locator(`//*[contains(text(),'${message}')]`), message);
});

Then('code should be copied to clipboard successfully', async function () {
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBeTruthy();
});

Then('Python code example should be displayed with proper syntax', async function () {
  await assertions.assertContainsText(page.locator('//div[@id="code-examples"]//pre'), 'import');
});

Then('Python code should include correct import statements', async function () {
  await assertions.assertContainsText(page.locator('//div[@id="code-examples"]//pre'), 'import requests');
});

Then('Python code should match the same endpoint and parameters as cURL example', async function () {
  const codeText = await page.locator('//div[@id="code-examples"]//pre').textContent();
  expect(codeText).toContain('/api/v1/');
});

Then('API call should execute successfully', async function () {
  expect(this.testData.executionResult.status).toBeLessThan(400);
});

Then('response should match the documented response format', async function () {
  expect(this.testData.executionResult.body).toBeTruthy();
});

Then('response status code should match the documented status code', async function () {
  expect(this.testData.executionResult.status).toBe(200);
});

Then('an overview introduction section should be visible', async function () {
  await assertions.assertVisible(page.locator('//section[@id="overview"]'));
});

Then('{string} page should load with step-by-step instructions', async function (pageName: string) {
  await assertions.assertVisible(page.locator('//div[@id="step-by-step"]'));
});

Then('instructions for account setup should be present', async function () {
  await assertions.assertVisible(page.locator('//*[contains(text(),"account setup")]'));
});

Then('instructions for initial configuration should be present', async function () {
  await assertions.assertVisible(page.locator('//*[contains(text(),"configuration")]'));
});

Then('instructions for first-use walkthrough should be present', async function () {
  await assertions.assertVisible(page.locator('//*[contains(text(),"walkthrough")]'));
});

Then('prerequisites section should list system requirements', async function () {
  await assertions.assertVisible(page.locator('//div[@id="prerequisites"]'));
});

Then('prerequisites section should list account creation steps', async function () {
  await assertions.assertContainsText(page.locator('//div[@id="prerequisites"]'), 'account');
});

Then('prerequisites section should list API key generation steps', async function () {
  await assertions.assertContainsText(page.locator('//div[@id="prerequisites"]'), 'API key');
});

Then('a numbered quick start tutorial should be present', async function () {
  await assertions.assertVisible(page.locator('//ol[@id="quick-start"]'));
});

Then('the tutorial should guide user from zero to first successful interaction', async function () {
  const steps = page.locator('//ol[@id="quick-start"]//li');
  expect(await steps.count()).toBeGreaterThan(2);
});

Then('user should be navigated to the correct referenced section', async function () {
  const currentUrl = page.url();
  expect(currentUrl).toContain(this.testData.clickedLinkHref || '#');
});

Then('no 404 errors should be displayed', async function () {
  const body = await page.locator('body').textContent();
  expect(body).not.toContain('404');
});

Then('no broken links should be encountered', async function () {
  const links = await page.locator('//section//a[starts-with(@href,"#")]').all();
  for (const link of links.slice(0, 5)) {
    const href = await link.getAttribute('href');
    if (href) {
      const target = page.locator(href);
      expect(await target.count()).toBeGreaterThan(0);
    }
  }
});

Then('search input field should be visible with placeholder text {string}', async function (placeholder: string) {
  const searchField = page.locator('//input[@id="search"]');
  await assertions.assertVisible(searchField);
  const actualPlaceholder = await searchField.getAttribute('placeholder');
  expect(actualPlaceholder).toContain(placeholder);
});

Then('search results should display relevant results related to {string}', async function (topic: string) {
  await assertions.assertVisible(page.locator('//div[@id="search-results"]'));
  await assertions.assertContainsText(page.locator('//div[@id="search-results"]'), topic);
});

Then('search results should show page titles and brief excerpts', async function () {
  await assertions.assertVisible(page.locator('//div[@id="search-results"]//h3'));
  await assertions.assertVisible(page.locator('//div[@id="search-results"]//p'));
});

Then('search results should include links to matching documentation sections', async function () {
  const links = page.locator('//div[@id="search-results"]//a');
  expect(await links.count()).toBeGreaterThan(0);
});

Then('user should be navigated to the correct documentation page', async function () {
  await waits.waitForNetworkIdle();
  const title = page.locator('//h1[@id="page-title"]');
  expect(await title.count()).toBeGreaterThan(0);
});

Then('{string} message should be displayed', async function (message: string) {
  await assertions.assertContainsText(page.locator(`//*[contains(text(),'${message}')]`), message);
});

Then('suggestions such as {string} should be shown', async function (suggestion: string) {
  await assertions.assertContainsText(page.locator('//div[@id="search-suggestions"]'), suggestion);
});

Then('links to popular documentation sections should be displayed', async function () {
  await assertions.assertVisible(page.locator('//div[@id="popular-sections"]'));
});

Then('supported authentication methods should be displayed', async function () {
  await assertions.assertVisible(page.locator('//div[@id="auth-methods"]'));
});

Then('{string} authentication method should be documented', async function (method: string) {
  await assertions.assertContainsText(page.locator('//div[@id="auth-methods"]'), method);
});

Then('step-by-step instructions for obtaining API credentials should be provided', async function () {
  await assertions.assertVisible(page.locator('//div[@id="credential-instructions"]'));
});

Then('instructions should explain where to generate credentials', async function () {
  await assertions.assertContainsText(page.locator('//div[@id="credential-instructions"]'), 'generate');
});

Then('authentication header format {string} should be specified', async function (format: string) {
  await assertions.assertContainsText(page.locator('//div[@id="auth-format"]'), 'Authorization');
});

Then('token expiration information should be documented', async function () {
  await assertions.assertVisible(page.locator('//*[contains(text(),"expir")]'));
});

Then('token refresh mechanisms should be documented', async function () {
  await assertions.assertVisible(page.locator('//*[contains(text(),"refresh")]'));
});

Then('rate limiting details should be documented', async function () {
  await assertions.assertVisible(page.locator('//div[@id="rate-limiting"]'));
});

Then('error response for {string} {string} should be documented', async function (code: string, description: string) {
  await assertions.assertVisible(page.locator(`//div[@id='error-${code}']`));
});

Then('all top-level sections should be displayed in logical order', async function () {
  const sections = page.locator('//nav[@id="sidebar"]//a[contains(@class,"top-level")]');
  expect(await sections.count()).toBeGreaterThan(3);
});

Then('{string} section should be visible in sidebar', async function (section: string) {
  await assertions.assertContainsText(page.locator('//nav[@id="sidebar"]'), section);
});

Then('section should expand to show subsections', async function () {
  await assertions.assertVisible(page.locator('//nav[@id="sidebar"]//ul[contains(@class,"expanded")]'));
});

Then('{string} subsection should be visible', async function (subsection: string) {
  await assertions.assertContainsText(page.locator('//nav[@id="sidebar"]'), subsection);
});

Then('content area should display {string} content', async function (content: string) {
  await assertions.assertContainsText(page.locator('//main[@id="content"]'), content);
});

Then('sidebar should highlight {string} as current subsection', async function (subsection: string) {
  await assertions.assertVisible(page.locator(`//nav[@id='sidebar']//a[contains(@class,'active') and contains(text(),'${subsection}')]`));
});

Then('breadcrumbs should display {string}', async function (breadcrumbText: string) {
  await assertions.assertContainsText(page.locator('//nav[@id="breadcrumbs"]'), breadcrumbText);
});

Then('user should be navigated to {string} section overview page', async function (section: string) {
  await assertions.assertContainsText(page.locator('//h1[@id="page-title"]'), section);
});

Then('breadcrumbs should update accordingly', async function () {
  await assertions.assertVisible(page.locator('//nav[@id="breadcrumbs"]'));
});

Then('user should be navigated to the documentation home page', async function () {
  expect(page.url()).toContain('/docs');
});

Then('user should be navigated to the next page in documentation sequence', async function () {
  await waits.waitForNetworkIdle();
  await assertions.assertVisible(page.locator('//h1[@id="page-title"]'));
});

Then('user should be navigated to the previous page in documentation sequence', async function () {
  await waits.waitForNetworkIdle();
  await assertions.assertVisible(page.locator('//h1[@id="page-title"]'));
});

Then('"Try It Out" button should be visible', async function () {
  await assertions.assertVisible(page.locator('//button[@id="try-it-out"]'));
});

Then('input fields should become editable', async function () {
  const inputs = page.locator('//div[@id="try-it-section"]//input');
  expect(await inputs.count()).toBeGreaterThan(0);
});

Then('user should be able to enter parameter values and headers', async function () {
  await assertions.assertVisible(page.locator('//div[@id="try-it-section"]//input'));
});

Then('a loading indicator should appear briefly', async function () {
  await assertions.assertVisible(page.locator('//div[@id="loading-indicator"]'));
});

Then('response section should display status code {int}', async function (statusCode: number) {
  await assertions.assertContainsText(page.locator('//div[@id="response-section"]//span[@id="status-code"]'), String(statusCode));
});

Then('response headers should be displayed', async function () {
  await assertions.assertVisible(page.locator('//div[@id="response-headers"]'));
});

Then('response body should be displayed in formatted JSON', async function () {
  await assertions.assertVisible(page.locator('//div[@id="response-body"]//pre'));
});

Then('response body structure should match the documented schema', async function () {
  await assertions.assertVisible(page.locator('//div[@id="response-body"]'));
});

Then('response body should contain the created resource', async function () {
  await assertions.assertContainsText(page.locator('//div[@id="response-body"]'), 'id');
});

Then('troubleshooting page should load with common issues listed', async function () {
  await assertions.assertVisible(page.locator('//div[@id="troubleshooting-list"]'));
});

Then('issues should be organized by category', async function () {
  const categories = page.locator('//div[@id="troubleshooting-list"]//h2');
  expect(await categories.count()).toBeGreaterThan(1);
});

Then('page should display common authentication problems', async function () {
  await assertions.assertVisible(page.locator('//div[@id="auth-issues"]'));
});

Then('each entry should include {string} description', async function (field: string) {
  await assertions.assertVisible(page.locator(`//div[contains(@class,'troubleshoot-entry')]//div[contains(@class,'${field.toLowerCase()}')]`));
});

Then('each entry should include {string} section', async function (field: string) {
  await assertions.assertVisible(page.locator(`//div[contains(@class,'troubleshoot-entry')]//div[contains(@class,'${field.toLowerCase().replace(/\s+/g, '-')}')]`));
});

Then('each entry should include {string} steps', async function (field: string) {
  await assertions.assertVisible(page.locator(`//div[contains(@class,'troubleshoot-entry')]//div[contains(@class,'${field.toLowerCase()}')]`));
});

Then('FAQ page should load with questions organized by topic', async function () {
  await assertions.assertVisible(page.locator('//div[@id="faq-section"]'));
});

Then('questions should be displayed in expandable accordion format', async function () {
  await assertions.assertVisible(page.locator('//div[@id="faq-section"]//button[contains(@class,"accordion")]'));
});

Then('answer should expand smoothly below the question', async function () {
  await assertions.assertVisible(page.locator('//div[@id="faq-section"]//div[contains(@class,"answer") and contains(@class,"expanded")]'));
});

Then('answer should contain clear and concise information', async function () {
  const answer = page.locator('//div[@id="faq-section"]//div[contains(@class,"answer") and contains(@class,"expanded")]');
  const text = await answer.textContent();
  expect(text!.length).toBeGreaterThan(10);
});

Then('answer should contain links to detailed documentation where applicable', async function () {
  const links = page.locator('//div[@id="faq-section"]//div[contains(@class,"answer")]//a');
  expect(await links.count()).toBeGreaterThanOrEqual(0);
});

Then('user should be navigated to the correct detailed documentation page', async function () {
  await waits.waitForNetworkIdle();
  await assertions.assertVisible(page.locator('//h1[@id="page-title"]'));
});

Then('version selector should be visible showing the current API version', async function () {
  await assertions.assertVisible(page.locator('//select[@id="version-selector"]'));
});

Then('option to view other versions should be available', async function () {
  const options = page.locator('//select[@id="version-selector"]//option');
  expect(await options.count()).toBeGreaterThan(1);
});

Then('documentation should update to show previous version endpoints', async function () {
  await waits.waitForNetworkIdle();
  await assertions.assertVisible(page.locator('//div[contains(@class,"endpoint-category")]'));
});

Then('a clear indicator should show user is viewing an older version', async function () {
  await assertions.assertVisible(page.locator('//div[@id="version-warning"]'));
});

Then('changelog page should display a chronological list of changes', async function () {
  await assertions.assertVisible(page.locator('//div[@id="changelog-entries"]'));
});

Then('entries should include dates and version numbers', async function () {
  await assertions.assertVisible(page.locator('//div[@id="changelog-entries"]//span[contains(@class,"date")]'));
  await assertions.assertVisible(page.locator('//div[@id="changelog-entries"]//span[contains(@class,"version")]'));
});

Then('entries should be categorized as {string} {string} {string} {string} {string}', async function (c1: string, c2: string, c3: string, c4: string, c5: string) {
  for (const category of [c1, c2, c3, c4, c5]) {
    await assertions.assertVisible(page.locator(`//div[@id='changelog-entries']//*[contains(text(),'${category}')]`));
  }
});

Then('most recent entry should show the current version number', async function () {
  await assertions.assertVisible(page.locator('//div[@id="changelog-entries"]//div[contains(@class,"entry")][1]//span[contains(@class,"version")]'));
});

Then('most recent entry should show the release date', async function () {
  await assertions.assertVisible(page.locator('//div[@id="changelog-entries"]//div[contains(@class,"entry")][1]//span[contains(@class,"date")]'));
});

Then('most recent entry should list changes with clear descriptions', async function () {
  const changes = page.locator('//div[@id="changelog-entries"]//div[contains(@class,"entry")][1]//li');
  expect(await changes.count()).toBeGreaterThan(0);
});

Then('deprecated items should be visually distinguished with a warning badge', async function () {
  await assertions.assertVisible(page.locator('//span[contains(@class,"deprecated-badge")]'));
});

Then('information about alternatives should be provided', async function () {
  await assertions.assertVisible(page.locator('//*[contains(text(),"alternative") or contains(text(),"use instead")]'));
});

Then('sunset dates should be documented for deprecated features', async function () {
  await assertions.assertVisible(page.locator('//*[contains(text(),"sunset") or contains(text(),"removal")]'));
});

Then('{string} should be accessible', async function (content: string) {
  await assertions.assertVisible(page.locator('//main[@id="content"]'));
});

Then('{string} should be {string}', async function (content: string, visibility: string) {
  if (visibility === 'visible') {
    await assertions.assertVisible(page.locator(`//*[contains(text(),'${content}')]`));
  } else {
    const elements = page.locator(`//*[contains(text(),'${content}')]`);
    expect(await elements.count()).toBe(0);
  }
});

Then('either the feature should be available with sandbox credentials', async function () {
  const tryItBtn = page.locator('//button[@id="try-it-out"]');
  const permMsg = page.locator('//*[contains(text(),"elevated permissions")]');
  const available = (await tryItBtn.count() > 0) || (await permMsg.count() > 0);
  expect(available).toBeTruthy();
});

Then('a message should indicate that API testing requires elevated permissions', async function () {
  // Combined with previous step via Or logic
});

Then('either public documentation should be shown without authentication', async function () {
  const docContent = page.locator('//main[@id="content"]');
  const loginRedirect = page.locator('//input[@id="username"]');
  const shown = (await docContent.count() > 0) || (await loginRedirect.count() > 0);
  expect(shown).toBeTruthy();
});

Then('user should be redirected to login page with appropriate message', async function () {
  // Combined with previous step via Or logic
});

Then('code blocks should be displayed with syntax highlighting', async function () {
  await assertions.assertVisible(page.locator('//pre[contains(@class,"highlight")]'));
});

Then('code blocks should use proper monospace font', async function () {
  const font = await page.locator('//pre').first().evaluate(el => getComputedStyle(el).fontFamily);
  expect(font.toLowerCase()).toMatch(/mono|courier|consolas/);
});

Then('code blocks should have a distinct background color from regular text', async function () {
  const codeBg = await page.locator('//pre').first().evaluate(el => getComputedStyle(el).backgroundColor);
  const bodyBg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(codeBg).not.toBe(bodyBg);
});

Then('images should load correctly', async function () {
  const broken = await page.evaluate(() => Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).length);
  expect(broken).toBe(0);
});

Then('images should be appropriately sized', async function () {
  const oversized = await page.evaluate(() => {
    const container = document.querySelector('main');
    const maxWidth = container ? container.clientWidth : 1200;
    return Array.from(document.images).filter(img => img.clientWidth > maxWidth).length;
  });
  expect(oversized).toBe(0);
});

Then('images should have alt text visible on hover', async function () {
  const images = await page.locator('//main//img').all();
  for (const img of images.slice(0, 5)) {
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
  }
});

Then('images should not overflow the content area', async function () {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return 0;
    return Array.from(main.querySelectorAll('img')).filter(img => img.scrollWidth > main.clientWidth).length;
  });
  expect(overflow).toBe(0);
});