Feature: DevOps Incident Management Dashboard
  As a DevOps Manager
  I want a dashboard showing real-time incident status and response progress
  So that I can monitor system health and response effectiveness

  Background:
    Given the dashboard service is running and accessible
    And the incident management system is connected

  @functional @regression @priority-high
  Scenario: Successful login and dashboard initial load with active incidents
    Given user has valid DevOps Manager credentials
    And {int} active incidents exist in the system
    And user is on the login page
    When user enters {string} in {string} field
    And user enters {string} in {string} field
    And user clicks {string} button
    And user waits for page to load
    Then user should see {string} page
    And {string} should be visible
    And table should display {int} rows
    And incident status indicators should show appropriate colors
    And {string} should be displayed in top-right corner

  @functional @regression @priority-high
  Scenario: Real-time incident status updates without page refresh
    Given user is logged in as DevOps Manager
    And dashboard is displaying {int} active incidents
    And WebSocket connection is established
    And incident {string} shows status {string} with orange indicator
    When external system updates incident {string} status to {string}
    And user waits for {int} seconds
    Then incident {string} should display status {string} with blue indicator
    And no page refresh should occur
    And last updated timestamp should show current time
    And success message {string} should be displayed

  @functional @regression @priority-high
  Scenario: Incident detail view with response actions and progress visualization
    Given user is logged in as DevOps Manager
    And dashboard shows incident {string} with {int} response actions
    And incident has {int} percent progress completed
    When user clicks on incident card {string}
    Then incident detail panel should slide in from right side
    And {int} response actions should be listed
    And {string} action should show {string} status
    And {string} action should show {string} status
    And {string} action should show {string} status
    And circular progress indicator should show {int} percent
    And {string} text should be displayed
    When user clicks {string} button
    Then timeline view should expand showing chronological event history

  @functional @regression @priority-medium
  Scenario Outline: Incident filtering by status and severity
    Given user is logged in as DevOps Manager
    And dashboard displays {int} total incidents
    When user clicks {string} button
    And user selects {string} checkbox under Status filter
    And user selects "<severity1>" checkbox under Severity filter
    And user selects "<severity2>" checkbox under Severity filter
    And user clicks {string} button
    Then dashboard should display {int} filtered incidents
    And filter tags should show {string} and {string}
    When user clicks {string} link
    Then all {int} incidents should reappear
    And filter tags should be removed

    Examples:
      | severity1 | severity2 | 
      | Critical  | High      |
      | Medium    | Low       |

  @functional @regression @priority-medium
  Scenario: Incident search functionality with various search terms
    Given user is logged in as DevOps Manager
    And dashboard displays {int} incidents
    And search bar is visible in top navigation
    When user clicks in search bar with placeholder {string}
    Then search bar should become active with cursor
    When user enters {string} in search field
    Then search suggestions dropdown should appear
    When user presses Enter key
    Then dashboard should display {int} incidents containing search term
    When user clears search field
    And user enters {string} in search field
    And user selects the suggested incident
    Then dashboard should display {int} specific incident
    When user clicks X button in search bar
    Then all {int} incidents should reappear

  @functional @regression @priority-medium
  Scenario: Historical incident data access and trend visualization
    Given user is logged in as DevOps Manager
    And system has {int} days of historical incident data
    And user is on {string} page
    When user clicks {string} tab
    Then view should switch to historical dashboard with date selector
    When user selects {string} from date range dropdown
    Then line graph should display incident trends for selected period
    When user hovers over data point for day {int}
    Then tooltip should display incident statistics
    When user clicks {string} toggle
    Then graph should update to show stacked area chart with severity breakdown
    When user clicks {string} button
    Then export options {string}, {string}, {string} should appear
    When user clicks {string}
    Then file {string} should download to browser

  @functional @regression @priority-high
  Scenario Outline: Role-based access control for different user types
    Given user is logged out initially
    And dashboard has sensitive incident data
    When user logs in as "<role>"
    Then dashboard should load with "<access_level>" access
    And "<export_permission>" for Export button
    And "<filter_permission>" for Filter feature
    And "<search_permission>" for Search feature
    And "<historical_permission>" for Historical Data tab
    When user attempts to access restricted feature
    Then "<restriction_message>" should be displayed

    Examples:
      | role              | access_level | export_permission | filter_permission | search_permission | historical_permission | restriction_message        |
      | DevOps Manager    | full         | enabled           | enabled           | enabled           | enabled               |                             |
      | DevOps Engineer   | limited      | disabled          | enabled           | enabled           | enabled               |                             |
      | Read-Only Viewer  | view-only    | disabled          | disabled          | disabled          | visible               | Insufficient permissions    |

  @functional @regression @priority-medium
  Scenario: Dashboard auto-refresh and manual refresh functionality
    Given user is logged in as DevOps Manager
    And dashboard is displaying current incidents
    And auto-refresh is enabled with {int} second interval
    When user observes refresh indicator
    Then indicator should show {string} with countdown timer
    When user waits for {int} seconds
    Then dashboard should flash briefly and update with latest data
    When user clicks manual refresh button
    Then spinning animation should appear on button
    And dashboard should update immediately
    When user clicks auto-refresh toggle to disable
    Then indicator should show {string} in gray
    When user waits for {int} seconds
    Then no automatic refresh should occur
    When user re-enables auto-refresh
    Then auto-refresh should resume with countdown timer

  @functional @regression @priority-low
  Scenario: Incident export functionality with multiple formats
    Given user is logged in as DevOps Manager
    And dashboard shows {int} filtered incidents
    And user has download permissions
    When user clicks {string} button
    Then export modal should open with format options
    When user checks {string} checkbox
    Then incident count should update to {string}
    When user selects {string} format
    And user clicks {string} button
    Then progress bar should show {string}
    When generation completes
    Then success message {string} should be displayed
    When user clicks {string} button
    Then file {string} should download
    And PDF should contain all {int} incidents with proper formatting

  @functional @regression @priority-medium
  Scenario Outline: Responsive UI design on different screen sizes
    Given user is logged in as DevOps Manager
    And dashboard is loaded on desktop browser
    When browser is resized to "<screen_size>" width
    Then layout should adjust to "<layout_type>"
    And "<navigation_type>" should be displayed
    When user clicks on an incident card
    Then detail panel should display as "<detail_display>"
    When browser returns to desktop size
    Then layout should return to three-column view

    Examples:
      | screen_size | layout_type    | navigation_type  | detail_display |
      | 1920px      | three-column   | sidebar          | panel          |
      | 768px       | two-column     | sidebar          | overlay        |
      | 375px       | single-column  | hamburger menu   | modal          |