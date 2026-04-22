Feature: DevOps Dashboard Incident Monitoring Security and Error Handling
  As a DevOps Manager
  I want the incident monitoring dashboard to handle errors and security threats gracefully
  So that system integrity is maintained and unauthorized access is prevented

  Background:
    Given the incident monitoring dashboard is accessible
    And the system has security logging enabled

  @negative @regression @priority-high @security
  Scenario: Login failure with invalid credentials
    Given user is on the login page
    And dashboard service is running
    And no active session exists
    When user enters "wronguser@company.com" in "Username" field
    And user enters "wrongpass123" in "Password" field
    And user clicks "Sign In" button
    And user waits for response
    Then error message "Invalid username or password. Please try again." should be displayed
    And "Username" field should retain entered value
    And "Password" field should be cleared
    And no session should be created
    And failed login attempt should be logged
    And user should remain on login page

  @negative @regression @priority-high @security
  Scenario: Access denial for expired session
    Given user was logged in as "DevOps Manager"
    And session has expired on server
    And user is viewing dashboard
    When user clicks on any incident card
    And user waits for server response
    Then session timeout modal "Your session has expired" should be displayed
    When user clicks "OK" button on modal
    Then user should be redirected to login page
    When user navigates back using browser back button
    Then login page should remain displayed
    And no dashboard access should be allowed
    When user attempts direct URL access to dashboard
    Then user should be redirected to login page
    And message "Please login to continue" should be displayed

  @negative @regression @priority-high @security @sql-injection
  Scenario: SQL injection attempt prevention in search field
    Given user is logged in as "DevOps Manager"
    And dashboard is loaded with incidents
    And search field is accessible
    When user clicks in search field
    And user enters "'; DROP TABLE incidents; --" in search field
    And user presses Enter to search
    Then message "No incidents found matching your search" should be displayed
    When user clears the search field
    Then all incidents should still be displayed
    And database should remain intact
    And potential SQL injection attempt should be logged with user details

  @negative @regression @priority-high @network
  Scenario: Network disconnection during real-time updates
    Given user is logged in as "DevOps Manager"
    And dashboard is showing real-time updates
    And WebSocket connection is active
    And real-time indicator shows "Connected" in green
    When network connection is disabled
    And user waits for 5 seconds
    Then warning banner "Connection lost. Attempting to reconnect..." should be displayed
    When user clicks on an incident
    Then incident details should show with warning "Data may be outdated"
    When network connection is re-enabled
    And user waits for 5 seconds
    Then message "Connection restored" should be displayed
    And dashboard should refresh automatically with latest data
    And WebSocket should reconnect successfully

  @negative @regression @priority-high @security @authorization
  Scenario: Unauthorized access attempt to admin features
    Given user is logged in as "Read-Only Viewer"
    And dashboard is displayed
    When user removes disabled attribute from "Export" button using developer tools
    And user clicks "Export" button
    Then error modal "Access Denied: Insufficient permissions" should be displayed
    When user attempts API call to "/api/incidents/export"
    Then API should return 403 Forbidden error
    And unauthorized access attempt should be logged with user ID and timestamp

  @negative @regression @priority-medium @validation
  Scenario: Handling extremely long search queries
    Given user is logged in as "DevOps Manager"
    And dashboard is loaded
    When user clicks in search field
    And user pastes a 5000 character string into search field
    And user presses Enter to search
    And user waits for response
    Then error message "Search query too long. Maximum 255 characters allowed" should be displayed
    And search field should be highlighted in red with error indicator
    When user clears search field
    Then error state should be removed
    And normal search functionality should return

  @negative @regression @priority-medium @validation
  Scenario Outline: Date range filter with invalid date combinations
    Given user is logged in as "DevOps Manager"
    And dashboard is on "Historical Data" view
    And custom date range selector is available
    When user clicks on "Custom Range" in date selector
    And user sets "From" date to "<from_date>"
    And user sets "To" date to "<to_date>"
    And user clicks "Apply" button
    Then validation error "<error_message>" should be displayed
    And date filter should not be applied
    And previous valid filter should remain active

    Examples:
      | from_date   | to_date     | error_message                          |
      | 2024-12-31  | 2024-01-01  | End date must be after start date     |
      | 2024-01-01  | 2099-01-01  | Future dates are not allowed          |
      | abc-def-ghij| 2024-01-01  | Invalid date format. Use YYYY-MM-DD   |

  @negative @regression @priority-medium @performance
  Scenario: Server timeout during large data export
    Given user is logged in as "DevOps Manager"
    And over 10000 incidents exist in selected range
    And export timeout is set to 30 seconds
    When user selects "Last 365 Days" filter
    Then dashboard should show "10,000+ incidents"
    When user clicks "Export" button
    And user selects "PDF" format
    Then export modal should show warning "Large dataset may take time"
    When user clicks "Proceed with Export"
    And user waits for 30 seconds
    Then progress should stop at approximately 45 percent
    And error message "Export failed: Request timeout. Try smaller date range." should be displayed
    When user clicks "Try Again" button
    Then modal should reset with suggestion to reduce data range

  @negative @regression @priority-high @security @xss
  Scenario: XSS attack prevention in incident details
    Given user is logged in as "DevOps Manager"
    And test incident exists with XSS payload "<script>alert('XSS')</script>" in description
    When user clicks on incident containing XSS payload
    Then incident detail panel should open
    And script tags should be displayed as plain text
    And no JavaScript alerts should appear
    And browser console should show no JavaScript execution errors
    And script tags should be HTML-encoded as "&lt;script&gt;"
    When user copies description text
    Then copied text should contain escaped characters not executable code

  @negative @regression @priority-medium @session
  Scenario: Concurrent session limit exceeded
    Given user account allows maximum 2 concurrent sessions
    And user is logged in on 2 different browsers
    When user opens dashboard in third browser
    And user enters valid credentials
    And user clicks "Sign In" button
    And user waits for response
    Then warning modal "Maximum concurrent sessions (2) reached" should be displayed
    When user selects "Terminate oldest session" option
    And user confirms termination
    Then login should succeed
    And first session should be terminated with notification
    And only 2 sessions should remain active

  @negative @regression @priority-low @empty-state
  Scenario: Empty state handling when no incidents exist
    Given user is logged in as "DevOps Manager"
    And database has zero incidents
    And all services are operational
    When user loads dashboard main view
    Then dashboard should load successfully
    And empty state message "No incidents to display. System is healthy!" should be displayed
    When user clicks on "Historical Data" tab
    Then chart should show flat line at zero with "No historical data available"
    And "Export" button should be disabled with tooltip "No data to export"
    And search bar should show "No incidents to search" placeholder

  @negative @regression @priority-low @session
  Scenario: Filter persistence failure after session timeout
    Given user has active filters applied for "Status: Active" and "Severity: High"
    And session timeout is set to 15 minutes
    And user has been idle for 14 minutes
    When user waits for 2 more minutes
    Then session should expire after 15 minutes total
    When user tries to modify filters
    Then session timeout modal should appear
    When user clicks "Login Again" button
    And user logs in with same credentials
    Then dashboard should load successfully
    And all filters should be reset to default
    And no filter parameters should be preserved in URL

  @negative @regression @priority-medium @rate-limiting
  Scenario: API rate limiting for excessive requests
    Given user is logged in as "DevOps Manager"
    And API rate limit is 100 requests per minute
    And dashboard is loaded
    When user executes script to rapidly click refresh 150 times
    Then first 100 requests should succeed
    And subsequent requests should return HTTP 429 "Too Many Requests" errors
    And error banner "Rate limit exceeded. Please wait before retrying." should be displayed
    When user waits for 60 seconds
    And user clicks refresh once
    Then request should succeed
    And dashboard should update normally
    And abuse attempt should be logged

  @negative @regression @priority-low @websocket
  Scenario: Handling malformed WebSocket messages
    Given user is logged in as "DevOps Manager"
    And WebSocket connection is established
    When user sends malformed JSON "{invalid json;;;" via WebSocket
    Then no visible errors should appear in UI
    And dashboard should continue functioning
    And error "Failed to parse WebSocket message" should be logged in console
    And valid WebSocket messages should still be processed correctly
    And WebSocket should remain connected despite malformed message

  @negative @regression @priority-low @compatibility
  Scenario: Browser compatibility error for unsupported browsers
    Given user is using "Internet Explorer 11" browser
    And dashboard URL is accessible
    When user navigates to dashboard URL
    Then page should load partially
    And banner "Your browser is not supported. Please use Chrome, Firefox, Safari, or Edge" should be displayed
    When user tries to login anyway
    Then login form should appear broken or misaligned
    When user enters credentials and submits
    Then JavaScript errors should prevent successful login
    And basic HTML message with supported browser list should be visible