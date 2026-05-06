Feature: Document API and User Guide Edge Cases
  As a documentation team member
  I want the API documentation and user guide to handle edge cases gracefully
  So that the documentation portal remains robust, secure, and usable under unusual conditions

  Background:
    Given user is authenticated with appropriate permissions
    And the documentation portal is accessible

  @edge @regression @priority-high
  Scenario: API documentation page handles extremely long endpoint descriptions without layout breaking
    Given user is logged in with "documentation editor" role
    And user's browser window is set to "1920x1080" resolution
    And at least one API endpoint exists with editable description field
    When user navigates to "/docs/api/edit" page
    Then API documentation editor loads with list of existing endpoints
    When user selects an existing API endpoint entry and clicks "Edit" button
    Then edit form opens with pre-populated fields for the endpoint
    When user pastes a "10000" character string containing paragraphs, inline code, URLs, and special characters "<>&\"'" in "Description" field
    Then the text field accepts the full "10000" character input without truncation or freezing
    When user clicks "Save" button
    Then success message "Documentation updated successfully" should be displayed
    When user navigates to the public-facing API documentation view for the same endpoint
    Then the full description renders correctly without layout overflow or horizontal scrollbars
    And no broken HTML entities are displayed
    When user resizes the browser window to "375" pixels width
    Then the long description wraps properly within the content container
    And no overlapping with navigation or other UI elements occurs

  @edge @regression @priority-high
  Scenario Outline: User guide search handles Unicode characters, emojis, and special symbols
    Given user is authenticated with "read-only" access
    And user guide documentation is published
    When user navigates to "/docs/user-guide" page
    Then user guide page loads with search bar visible
    When user enters "<search_input>" in "Search" field
    And user presses Enter key
    Then search executes without server errors
    And "<expected_result>" should be displayed
    And no security vulnerabilities are exploited

    Examples:
      | search_input                                    | expected_result                                          |
      | 🔑🔐📡                                        | No results found                                         |
      | 日本語テスト中文测试العربية                      | No results found                                         |
      | '; DROP TABLE docs; --                          | No results found                                         |
      | <script>alert("xss")</script>                   | No results found                                         |
      | AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA | Search query too long or No results found                |

  @edge @regression @priority-medium
  Scenario: API documentation renders correctly with zero endpoints documented
    Given user is logged in with "admin" role
    And all existing API endpoint documentation has been removed
    And browser cache has been cleared
    When user navigates to "/docs/api" page
    Then the page loads without errors
    And empty state message "No API endpoints documented yet" should be displayed
    When user checks the table of contents or navigation sidebar
    Then the sidebar shows no endpoint entries
    And the sidebar remains structurally intact without broken links
    When user attempts to use the "Try it out" interactive API testing feature
    Then the feature displays a message indicating no endpoints are available for testing
    When user clicks "Export Documentation" button
    Then message "No content available to export" should be displayed
    When user enters "GET" in "Search" field
    And user presses Enter key
    Then "No results found" should be displayed
    And no null reference exceptions occur

  @edge @regression @priority-high
  Scenario: Simultaneous edits to the same documentation section by multiple users
    Given "User A" is logged in with "documentation editor" role in a separate session
    And "User B" is logged in with "documentation editor" role in a separate session
    And documentation section "Authentication" exists with known content
    And both users have navigated to the edit page for "Authentication" section
    When "User A" clicks "Edit" on the "Authentication" section
    Then "User A" sees the edit form with current content loaded
    When "User A" modifies the first paragraph to read "OAuth 2.0 is the primary authentication method"
    And "User B" clicks "Edit" on the "Authentication" section within "5" seconds
    Then "User B" sees either a warning "This section is being edited by another user" or the edit form opens
    When "User A" clicks "Save" button
    Then "User A" sees confirmation message "Documentation updated successfully"
    When "User B" modifies the paragraph to read "API keys are the primary authentication method"
    And "User B" clicks "Save" button within "30" seconds of User A's save
    Then "User B" sees a conflict resolution dialog or error "This section has been modified by another user. Please refresh and try again"
    When "User B" refreshes the page
    Then the "Authentication" section displays "OAuth 2.0 is the primary authentication method"
    And no data corruption has occurred

  @edge @regression @priority-high
  Scenario: Documentation page handles special characters in API endpoint paths and parameters
    Given user is logged in with "documentation editor" role
    And API documentation editor is accessible at "/docs/api/edit"
    When user clicks "Add New Endpoint" button
    Then a new endpoint form appears with fields for Method, Path, Description, Parameters, and Response
    When user enters "/api/v1/users/{user-id}/roles/{role_name}" in "Path" field
    Then the path field accepts curly braces and displays them as path parameter indicators
    When user adds a query parameter named "filter[status]" with value example "active&archived"
    Then the parameter name with square brackets and value with ampersand are accepted and properly escaped
    When user enters JSON object with special characters in "Request Body" field
      """
      {"name": "O'Brien & Sons", "url": "https://example.com/path?q=test&lang=en"}
      """
    Then the JSON with single quotes, ampersands, and URL special characters is accepted and syntax-highlighted
    When user clicks "Save" button
    Then success message should be displayed without encoding issues
    When user views the saved endpoint in the public documentation view
    Then all special characters render correctly
    And curly braces show as path parameters
    And square brackets in parameter names display properly
    And JSON example shows unescaped readable content
    When user clicks "Copy URL" button for the endpoint
    Then the generated URL properly encodes special characters for HTTP compliance
    And square brackets are encoded as "%5B" and "%5D"

  @edge @regression @priority-medium
  Scenario: User guide table of contents handles deeply nested section hierarchy
    Given user is logged in with "documentation editor" role
    And user guide editor supports hierarchical section creation
    And the user guide has at least one top-level section
    When user navigates to the user guide editor
    And user creates a nested hierarchy of "12" levels deep with each as a subsection of the previous
    Then the editor allows creation of deeply nested sections or displays a maximum depth warning
    When user adds content text "Test content at level 12" to the deepest nested section
    Then content is accepted and saved at the deepest level
    When user navigates to the published user guide
    And user expands the table of contents to view all nested levels
    Then the table of contents renders all levels with appropriate indentation that remains readable
    When user clicks on the "Level 12" section link in the table of contents
    Then the page navigates to the correct section content without broken anchor links
    When user views the breadcrumb navigation for the "Level 12" section
    Then breadcrumbs show the path without overflowing the page width

  @edge @regression @priority-medium
  Scenario: API documentation export handles maximum payload with 500+ endpoints
    Given user is logged in with "admin" role
    And the API documentation contains "500" or more documented endpoints with full details
    And export functionality supports OpenAPI JSON and PDF formats
    When user navigates to "/docs/api" page
    Then the documentation page loads with pagination or lazy loading for the large number of endpoints
    When user clicks "Export All" button
    And user selects "OpenAPI 3.0 JSON" format
    Then export process begins with a progress indicator
    When user waits for the export to complete within "60" seconds
    Then export completes successfully and a JSON file is downloaded
    And the file size is between "5" and "50" megabytes
    When user validates the downloaded JSON against the OpenAPI 3.0 specification
    Then the JSON is valid OpenAPI 3.0 format with all "500" endpoints present
    When user returns to the export page and selects "PDF" format
    Then PDF generation begins without timeout errors
    When user verifies the PDF content
    Then the PDF contains a complete table of contents and all endpoint documentation
    And internal links and page numbers are functional

  @edge @regression @priority-medium
  Scenario: Documentation versioning handles rapid consecutive saves within 1 second
    Given user is logged in with "documentation editor" role
    And documentation section "Getting Started" is open in edit mode
    And version history feature is enabled
    And network connection is stable with low latency
    When user changes the text to "Version 1 change" and clicks "Save" immediately
    Then first save request is sent to the server
    When user changes the text to "Version 2 change" and clicks "Save" within "500" milliseconds
    Then system either queues the second save or shows "Save in progress" indicator
    When user changes the text to "Version 3 change" and clicks "Save" within "500" milliseconds
    Then system handles the rapid save gracefully without race conditions
    When user waits for "5" seconds for all operations to complete
    And user refreshes the page
    Then the page displays the most recent valid save content
    And the content is in a consistent non-corrupted state
    When user opens the version history for "Getting Started" section
    Then version history shows a logical sequence of saves without duplicate entries
    And no corrupted timestamps or missing versions are present

  @edge @regression @priority-low
  Scenario: User guide renders correctly when documentation contains only code blocks and no prose
    Given user is logged in with "documentation editor" role
    And the documentation system supports markdown with code block formatting
    When user creates a new user guide section titled "Quick Start Code Examples"
    Then new section is created and editor opens
    When user enters "5" consecutive code blocks in languages "Python, JavaScript, cURL, Java, Go" each containing "50" or more lines
    Then editor accepts all code blocks and applies syntax highlighting for each language
    When user clicks "Save" button
    And user navigates to the published view
    Then the section renders with properly formatted code blocks
    And each code block has correct syntax highlighting and language labels
    When user verifies "Copy" buttons on each code block
    Then each code block has a functional "Copy to clipboard" button
    And copied content matches the exact code without extra whitespace or formatting artifacts
    When user views a code block containing lines exceeding "200" characters
    Then long lines are handled with horizontal scroll within the code block container
    And the entire page does not scroll horizontally
    When user views the page on a mobile device at "375" pixels width
    Then code blocks remain readable with horizontal scroll within their containers
    And the page layout does not break

  @edge @regression @priority-medium
  Scenario: API documentation handles endpoint with extremely large response schema
    Given user is logged in with "documentation editor" role
    And API documentation editor supports response schema definition
    And the system allows nested object definitions in response schemas
    When user creates or edits an API endpoint and navigates to the "Response Schema" section
    Then response schema editor opens with ability to define fields and nested objects
    When user defines a response schema with "100" fields including "5" levels of nested objects with mixed types
    Then the schema editor accepts all field definitions without performance degradation or UI freezing
    When user clicks "Save" button
    Then save completes successfully within "10" seconds without timeout
    When user views the published documentation for this endpoint
    And user expands the response schema section
    Then the schema renders in a readable collapsible tree structure with proper indentation
    And type indicators are displayed for all "100" fields
    When user clicks "Expand All" to show all nested fields simultaneously
    Then all fields expand without browser lag or memory issues
    And the page remains responsive
    When user clicks "Generate Example Response" button
    Then a valid JSON example is generated matching the schema structure
    And appropriate sample values are provided for each field type