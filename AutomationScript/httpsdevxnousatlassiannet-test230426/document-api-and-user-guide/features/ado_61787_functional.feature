Feature: Document API and User Guide
  As a developer or user of the application
  I want to access comprehensive API documentation and a user guide
  So that I can understand how to integrate with and use the system effectively

  Background:
    Given user is logged into the application with a valid account
    And user is using a modern supported browser

  @functional @regression @priority-high @smoke
  Scenario: Verify API documentation page is accessible and loads correctly
    Given API documentation has been published and deployed
    And user has permissions to view documentation resources
    When user navigates to "API Documentation" page
    Then page should load successfully with HTTP status code 200
    And page title "API Documentation" should be displayed
    And branding and navigation elements should be visible
    And table of contents or navigation sidebar should be present
    And API endpoints should be listed grouped by category
    And page should fully render within 3 seconds
    And no broken images or missing stylesheets should be present
    And no JavaScript errors should be present in browser console

  @functional @regression @priority-high
  Scenario: Verify all API endpoints are documented with required fields
    Given user is on the "API Documentation" page
    And documentation follows "OpenAPI/Swagger" format standard
    When user navigates to endpoint section "GET" "/api/v1/users"
    Then endpoint documentation should display HTTP method "GET"
    And endpoint documentation should display URL path "/api/v1/users"
    And endpoint documentation should display a brief description of purpose
    And request parameters should be documented with "name" field
    And request parameters should be documented with "type" field
    And request parameters should be documented with "required/optional" status
    And request parameters should be documented with "description" field
    And request headers "Authorization" and "Content-Type" should be documented
    And response codes should be documented for "200" "400" "401" "404" "500"
    And example response bodies should be provided for each response code

  @functional @regression @priority-high
  Scenario Outline: Verify endpoint documentation completeness for multiple endpoints
    Given user is on the "API Documentation" page
    When user navigates to endpoint section "<method>" "<endpoint>"
    Then endpoint documentation should display HTTP method "<method>"
    And endpoint documentation should display URL path "<endpoint>"
    And request parameters should be documented with all required fields
    And response codes and response body schemas should be documented

    Examples:
      | method | endpoint              |
      | GET    | /api/v1/users         |
      | POST   | /api/v1/users         |
      | GET    | /api/v1/users/{id}    |
      | PUT    | /api/v1/users/{id}    |
      | DELETE | /api/v1/users/{id}    |
      | GET    | /api/v1/resources     |
      | POST   | /api/v1/resources     |

  @functional @regression @priority-high
  Scenario: Verify POST/PUT/PATCH endpoints include request body schema documentation
    Given user is on the "API Documentation" page
    When user navigates to endpoint section "POST" "/api/v1/users"
    Then request body schema should be documented
    And request body should show field names and data types
    And request body should show constraints including min and max length
    And request body should show allowed values and descriptions
    And a JSON example should be provided for the request body

  @functional @regression @priority-high
  Scenario: Verify API documentation includes working code examples
    Given user is on the "API Documentation" page
    And code examples have been written for primary endpoints
    When user navigates to endpoint section "GET" "/api/v1/users"
    Then code examples section should be visible
    And code examples should be available in at least 3 language options
    When user clicks "cURL" tab
    Then a properly formatted cURL command should be displayed
    And syntax highlighting should be applied to the code block
    And the code should include full URL, headers, and required parameters
    When user clicks "Copy" button for the code example
    Then "Copied!" confirmation message should be displayed
    And code should be copied to clipboard successfully
    When user clicks "Python" tab
    Then Python code example should be displayed with proper syntax
    And Python code should include correct import statements
    And Python code should match the same endpoint and parameters as cURL example

  @functional @regression @priority-high
  Scenario: Verify code examples execute successfully against sandbox environment
    Given user is on the "API Documentation" page
    And user has access to the sandbox API environment
    When user copies the "cURL" code example for endpoint "GET" "/api/v1/users"
    And user executes the code example against the sandbox environment with valid test credentials
    Then API call should execute successfully
    And response should match the documented response format
    And response status code should match the documented status code

  @functional @regression @priority-high
  Scenario: Verify user guide is accessible and contains getting started section
    Given user guide documentation has been published
    And user has a role that grants access to documentation
    When user navigates to "User Guide" page
    Then page title "User Guide" should be displayed
    And an overview introduction section should be visible
    When user clicks "Getting Started" in the table of contents
    Then "Getting Started" page should load with step-by-step instructions
    And instructions for account setup should be present
    And instructions for initial configuration should be present
    And instructions for first-use walkthrough should be present
    And prerequisites section should list system requirements
    And prerequisites section should list account creation steps
    And prerequisites section should list API key generation steps
    And a numbered quick start tutorial should be present
    And the tutorial should guide user from zero to first successful interaction

  @functional @regression @priority-high
  Scenario: Verify internal links within Getting Started section work correctly
    Given user is on the "Getting Started" section of the user guide
    When user clicks on any internal link within the section
    Then user should be navigated to the correct referenced section
    And no 404 errors should be displayed
    And no broken links should be encountered

  @functional @regression @priority-medium
  Scenario: Verify user guide search functionality returns relevant results
    Given user is on the "User Guide" page
    And search functionality is implemented on the documentation site
    When user locates the search bar on the documentation page
    Then search input field should be visible with placeholder text "Search documentation..."

  @functional @regression @priority-medium
  Scenario Outline: Verify search returns relevant results for valid queries
    Given user is on the "User Guide" page
    When user enters "<search_term>" in "Search" field
    And user clicks "Search" button
    Then search results should display relevant results related to "<expected_topic>"
    And search results should show page titles and brief excerpts
    And search results should include links to matching documentation sections
    When user clicks on the first search result
    Then user should be navigated to the correct documentation page

    Examples:
      | search_term    | expected_topic  |
      | authentication | authentication  |
      | /api/v1/users  | users endpoint  |
      | auth           | authentication  |

  @functional @regression @priority-medium @negative
  Scenario: Verify search handles no results gracefully
    Given user is on the "User Guide" page
    When user enters "xyzabc123nonsense" in "Search" field
    And user clicks "Search" button
    Then "No results found" message should be displayed
    And suggestions such as "Try different keywords" should be shown
    And links to popular documentation sections should be displayed

  @functional @regression @priority-high
  Scenario: Verify API documentation authentication section is complete and accurate
    Given user is on the "API Documentation" page
    When user navigates to "Authentication" section
    Then supported authentication methods should be displayed
    And "API Key" authentication method should be documented
    And "OAuth 2.0" authentication method should be documented
    And "Bearer Token" authentication method should be documented
    And step-by-step instructions for obtaining API credentials should be provided
    And instructions should explain where to generate credentials
    And authentication header format "Authorization: Bearer <your-token>" should be specified
    And token expiration information should be documented
    And token refresh mechanisms should be documented
    And rate limiting details should be documented
    And error response for "401" "Unauthorized" should be documented
    And error response for "403" "Forbidden" should be documented

  @functional @regression @priority-medium
  Scenario: Verify user guide navigation structure and breadcrumbs work correctly
    Given user is on the "User Guide" page
    And documentation has a hierarchical structure with multiple levels
    When user views the left sidebar navigation
    Then all top-level sections should be displayed in logical order
    And "Getting Started" section should be visible in sidebar
    And "Configuration" section should be visible in sidebar
    And "API Reference" section should be visible in sidebar
    And "Troubleshooting" section should be visible in sidebar
    And "FAQ" section should be visible in sidebar

  @functional @regression @priority-medium
  Scenario: Verify sidebar navigation expands and collapses correctly
    Given user is on the "User Guide" page
    When user clicks "Configuration" section in the sidebar
    Then section should expand to show subsections
    And "Environment Setup" subsection should be visible
    And "Database Configuration" subsection should be visible
    And "Security Settings" subsection should be visible
    When user clicks "Database Configuration" subsection
    Then content area should display "Database Configuration" content
    And sidebar should highlight "Database Configuration" as current subsection
    And breadcrumbs should display "Home > Configuration > Database Configuration"

  @functional @regression @priority-medium
  Scenario: Verify breadcrumb navigation works correctly
    Given user is on the "Database Configuration" subsection page
    And breadcrumbs display "Home > Configuration > Database Configuration"
    When user clicks "Configuration" in the breadcrumb trail
    Then user should be navigated to "Configuration" section overview page
    And breadcrumbs should update accordingly
    When user clicks "Home" in the breadcrumb trail
    Then user should be navigated to the documentation home page

  @functional @regression @priority-medium
  Scenario: Verify previous and next navigation buttons work correctly
    Given user is on a documentation page with previous and next navigation
    When user clicks "Next" navigation button
    Then user should be navigated to the next page in documentation sequence
    When user clicks "Previous" navigation button
    Then user should be navigated to the previous page in documentation sequence

  @functional @regression @priority-medium
  Scenario: Verify API documentation interactive Try It Out functionality for GET endpoint
    Given user is on the "API Documentation" page with interactive features
    And sandbox API environment is configured
    And user has valid test credentials for the sandbox environment
    When user navigates to endpoint section "GET" "/api/v1/users"
    Then "Try It Out" button should be visible
    When user clicks "Try It Out" button
    Then input fields should become editable
    And user should be able to enter parameter values and headers
    When user enters valid Bearer token in "Authorization" field
    And user enters "10" in "limit" parameter field
    And user clicks "Execute" button
    Then a loading indicator should appear briefly
    And response section should display status code 200
    And response headers should be displayed
    And response body should be displayed in formatted JSON
    And response body structure should match the documented schema

  @functional @regression @priority-medium
  Scenario: Verify API documentation interactive Try It Out functionality for POST endpoint
    Given user is on the "API Documentation" page with interactive features
    And sandbox API environment is configured
    And user has valid test credentials for the sandbox environment
    When user navigates to endpoint section "POST" "/api/v1/users"
    And user clicks "Try It Out" button
    And user enters valid Bearer token in "Authorization" field
    And user enters a valid request body in the JSON editor
    And user clicks "Execute" button
    Then response section should display status code 201
    And response body should contain the created resource

  @functional @regression @priority-medium
  Scenario: Verify user guide includes troubleshooting section
    Given user is on the "User Guide" page
    When user navigates to "Troubleshooting" section via sidebar navigation
    Then troubleshooting page should load with common issues listed
    And issues should be organized by category
    When user clicks "Authentication Issues" troubleshooting topic
    Then page should display common authentication problems
    And each entry should include "Problem" description
    And each entry should include "Possible causes" section
    And each entry should include "Solution" steps
    And each entry should include "Related links" section

  @functional @regression @priority-medium
  Scenario: Verify user guide includes FAQ section with expandable answers
    Given user is on the "User Guide" page
    When user navigates to "FAQ" section
    Then FAQ page should load with questions organized by topic
    And questions should be displayed in expandable accordion format
    When user clicks on a FAQ question to expand it
    Then answer should expand smoothly below the question
    And answer should contain clear and concise information
    And answer should contain links to detailed documentation where applicable
    When user clicks on a link within the FAQ answer
    Then user should be navigated to the correct detailed documentation page

  @functional @regression @priority-medium
  Scenario: Verify API documentation versioning and changelog are present
    Given user is on the "API Documentation" page
    When user looks for the version selector on the page
    Then version selector should be visible showing the current API version
    And option to view other versions should be available
    When user selects previous version "v1" from the version selector
    Then documentation should update to show previous version endpoints
    And a clear indicator should show user is viewing an older version

  @functional @regression @priority-medium
  Scenario: Verify changelog section contains complete change history
    Given user is on the "API Documentation" page
    When user navigates to "Changelog" section
    Then changelog page should display a chronological list of changes
    And entries should include dates and version numbers
    And entries should be categorized as "Added" "Changed" "Deprecated" "Removed" "Fixed"
    And most recent entry should show the current version number
    And most recent entry should show the release date
    And most recent entry should list changes with clear descriptions

  @functional @regression @priority-medium
  Scenario: Verify deprecated endpoints are clearly marked in documentation
    Given user is on the "API Documentation" page
    When user views endpoints that have been deprecated
    Then deprecated items should be visually distinguished with a warning badge
    And information about alternatives should be provided
    And sunset dates should be documented for deprecated features

  @functional @regression @priority-high
  Scenario Outline: Verify documentation is accessible to different user roles
    Given user is logged in with "<role>" role
    When user navigates to "API Documentation" page
    Then "<expected_content>" should be accessible
    And "<restricted_content>" should be "<visibility>"

    Examples:
      | role      | expected_content                    | restricted_content        | visibility |
      | Admin     | all endpoints and admin sections    | none                      | visible    |
      | Developer | developer-relevant endpoints        | admin-only sections       | hidden     |
      | Read-only | public and general endpoints        | admin-only sections       | hidden     |

  @functional @regression @priority-high
  Scenario: Verify Read-only user access to interactive Try It Out feature
    Given user is logged in with "Read-only" role
    When user navigates to "API Documentation" page
    And user attempts to access the interactive "Try It Out" feature
    Then either the feature should be available with sandbox credentials
    Or a message should indicate that API testing requires elevated permissions

  @functional @regression @priority-high
  Scenario: Verify documentation access without authentication
    Given user is not logged into the application
    When user attempts to navigate to "API Documentation" page
    Then either public documentation should be shown without authentication
    Or user should be redirected to login page with appropriate message

  @functional @regression @priority-medium
  Scenario: Verify user guide content formatting for code blocks
    Given user is on the "User Guide" page
    When user navigates to a documentation page containing code blocks
    Then code blocks should be displayed with syntax highlighting
    And code blocks should use proper monospace font
    And code blocks should have a distinct background color from regular text

  @functional @regression @priority-medium
  Scenario: Verify user guide content formatting for images and diagrams
    Given user is on the "User Guide" page
    When user navigates to a documentation page containing images or diagrams
    Then images should load correctly
    And images should be appropriately sized
    And images should have alt text visible on hover
    And images should not overflow the content area

  @functional @regression @priority-medium
  Scenario: Verify user guide content formatting for tables
    Given user is on the "User Guide" page
    When user navigates to a documentation page containing tables
    Then