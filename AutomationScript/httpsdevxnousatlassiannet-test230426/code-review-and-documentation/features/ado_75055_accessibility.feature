Feature: Accessibility Compliance for Search Execution Error Handling
  As a user with assistive technology
  I want search execution, results handling, and security controls to be fully accessible when errors occur
  So that I can recover from issues easily using keyboard navigation and screen readers

  Background:
    Given the system is available
    And screen reader software is running

  @accessibility @a11y @priority-medium @regression
  Scenario: Verify keyboard and screen reader accessibility for parsing failure manual review notification
    Given user is on "Search Results" page
    And a parsing failure has occurred requiring manual review
    When user navigates to "Parsing failed - manual review required" notification using keyboard only
    Then all interactive elements should be reachable via "Tab" key
    And "Parsing failed - manual review required" message should be announced by screen reader
    And focus order should follow a logical reading sequence
    And all elements should have appropriate ARIA labels
    And the system should remain stable
    And no data corruption should occur

  @accessibility @a11y @priority-medium @functional
  Scenario Outline: Verify accessible focus management on error state elements during parsing failure
    Given user is on "Search Results" page
    And a parsing failure has occurred requiring manual review
    When user presses "<key>" key to navigate to "<element>"
    Then "<element>" should receive visible focus indicator
    And screen reader should announce "<announcement>"

    Examples:
      | key       | element                | announcement                              |
      | Tab       | Error Message          | Parsing failed - manual review required   |
      | Tab       | Retry Button           | Retry, button                             |
      | Tab       | Help Link              | Get help, link                            |
      | Shift+Tab | Error Message          | Parsing failed - manual review required   |

  @accessibility @a11y @priority-medium @edge
  Scenario: Verify error notification meets WCAG color contrast requirements
    Given user is on "Search Results" page
    And a parsing failure has occurred requiring manual review
    When user inspects "Parsing failed - manual review required" message
    Then the text contrast ratio should meet minimum "4.5" to "1" ratio
    And the error indicator should not rely solely on color to convey meaning
    And an appropriate "alert" ARIA role should be present on the error container