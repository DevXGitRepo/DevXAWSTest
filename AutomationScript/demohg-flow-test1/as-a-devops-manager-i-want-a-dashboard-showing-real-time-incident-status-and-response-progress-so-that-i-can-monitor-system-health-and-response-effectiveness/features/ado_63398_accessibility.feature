Feature: Accessibility compliance for DevOps incident dashboard
  As a DevOps Manager with accessibility needs
  I want the incident dashboard to be fully accessible
  So that I can monitor system health and response effectiveness regardless of my abilities or assistive technology

  Background:
    Given user is on the login page
    And user enters "manager@devops.com" in "Email" field
    And user enters "Manager@123" in "Password" field
    And user clicks "Sign In" button
    And user should see "Incident Dashboard" page

  @accessibility @a11y @priority-high
  Scenario: Complete keyboard navigation through dashboard without mouse
    Given dashboard displays multiple active incidents
    And keyboard navigation is enabled in browser
    When user presses Tab key from browser address bar
    Then focus should move to skip navigation link with visible indicator
    When user presses Tab to navigate through header elements
    Then focus should move through logo, navigation menu, and user profile in logical order
    And focus rings should be visible on all focused elements
    When user presses Enter on "Incidents" navigation item
    Then "Incidents" section should load
    And focus should move to first incident card
    When user uses arrow keys to navigate between incident cards
    Then focus should move between cards with clear visual indicators
    When user presses Enter on an incident card
    Then incident details modal should open
    And focus should be trapped within modal
    When user presses Escape key
    Then modal should close
    And focus should return to previously focused incident card
    When user presses Shift+Tab to navigate backwards
    Then focus should move in reverse order through all interactive elements
    When user tabs to "Export" button and presses Space bar
    Then export menu should open
    And arrow keys should navigate menu options

  @accessibility @a11y @priority-high
  Scenario: Screen reader compatibility and ARIA implementation
    Given NVDA screen reader is active
    And dashboard displays active incidents
    And screen reader is in browse mode
    When user navigates to dashboard with screen reader
    Then page title "Incident Dashboard - DevOps Manager Portal" should be announced
    When user presses H to navigate through headings
    Then heading structure should be announced as "h1 Incident Dashboard, h2 Active Incidents, h2 Response Progress"
    When user navigates to incident status indicator showing "Critical"
    Then screen reader should announce "Critical severity, 3 incidents"
    When user tabs to real-time update region
    Then live region should be announced with "aria-live=polite"
    And updates should be announced as "Incident INS-1234 status changed to Investigating"
    When user navigates to incidents data table
    Then table structure should be announced with headers "Incident ID, Title, Status, Severity, Assigned To, Last Updated"
    When user enters forms mode and interacts with filter dropdown
    Then dropdown should announce "Status filter, combobox, collapsed, 1 of 5"
    When user navigates to incident trends chart
    Then alternative text should announce "Bar chart showing 45 incidents this week, 23% decrease from last week"

  @accessibility @a11y @priority-high
  Scenario Outline: Color contrast and visual accessibility compliance
    Given dashboard displays incidents with "<severity>" severity
    And color contrast analyzer tool is available
    When user analyzes text contrast for "<element>" against background
    Then contrast ratio should meet minimum "<ratio>" requirement
    And information should not rely on color alone
    And additional "<indicator>" should be present

    Examples:
      | severity | element                | ratio  | indicator        |
      | Critical | incident titles        | 4.5:1  | icon or pattern  |
      | Critical | red status indicator   | 3:1    | exclamation icon |
      | Warning  | yellow text on white   | 3:1    | warning icon     |
      | Success  | green success message  | 4.5:1  | checkmark icon   |
      | Disabled | inactive buttons       | 3:1    | visual styling   |

  @accessibility @a11y @priority-high
  Scenario: Focus management in modal dialogs and dynamic content
    Given dashboard displays multiple incidents
    And keyboard navigation is enabled
    When user tabs to "View Details" button and presses Enter
    Then modal should open with focus on modal heading
    When user presses Tab repeatedly within modal
    Then focus should cycle only within modal elements
    And background content should not be reachable
    When user presses Escape key
    Then modal should close
    And focus should return to "View Details" button
    When user opens filter panel using keyboard
    Then panel should expand
    And focus should move to first filter input
    When user applies filter that removes current focused item
    Then focus should move to next available item
    When real-time incident update occurs
    Then focus should remain on current element
    When user deletes focused incident
    Then focus should move to next incident or "No incidents" message

  @accessibility @a11y @priority-medium
  Scenario: Mobile accessibility with touch and gesture support
    Given dashboard is loaded on mobile device
    And TalkBack screen reader is available
    And device is in portrait orientation
    When user enables screen reader and swipes through dashboard
    Then all elements should be reachable via swipe gestures
    And content should be announced clearly
    When user double-taps on incident card
    Then card should expand showing details
    And action should be confirmed by screen reader
    When user verifies touch target sizes
    Then all interactive elements should be minimum "44" pixels
    And adequate spacing should exist between targets
    When user performs pinch-to-zoom on charts
    Then charts should remain accessible
    And zoom should not break layout
    When user uses rotor control for navigation
    Then navigation by headings, links, and form controls should work
    When user rotates device to landscape
    Then layout should adapt responsively
    And all content should remain accessible without horizontal scrolling

  @accessibility @a11y @priority-high
  Scenario Outline: Form input accessibility and error handling
    Given dashboard filter and search forms are available
    And screen reader is active
    When user tabs to "<field>" input field
    Then field should be announced with label "<label>"
    When user enters "<invalid_input>" in field
    Then error message "<error>" should be announced via aria-live
    And error should be associated with field via aria-describedby

    Examples:
      | field         | label                    | invalid_input | error                      |
      | search        | Search incidents         | <<<>>>        | Invalid characters in search |
      | date_range    | Select start date        | 13/32/2024    | Invalid date format        |
      | severity      | Severity filter required |               | Required field             |

  @accessibility @a11y @priority-medium
  Scenario: Time-based content and auto-updating accessibility
    Given dashboard has real-time updates enabled
    And auto-refresh is set to "30" second intervals
    When user locates auto-refresh control
    Then "Pause auto-refresh" button should be available and announced
    When auto-update occurs while user reads content
    Then updates should be announced via polite live region
    And reading should not be interrupted
    When user presses pause button
    Then auto-refresh should stop
    And "Auto-refresh paused" status should be announced
    When session timeout warning appears
    Then warning should display "5" minutes before timeout
    And alert should have accessible alert role
    When user interacts with "Extend session" option
    Then button should be keyboard accessible
    And "5 minutes remaining" should be announced
    When user resumes auto-refresh
    Then "Auto-refresh resumed, updating every 30 seconds" should be announced

  @accessibility @a11y @priority-medium
  Scenario: Data visualization and chart accessibility
    Given dashboard displays incident trend charts
    And screen reader is active
    When user navigates to incident trend line chart
    Then chart should be announced as "Line chart: Incident trends over last 30 days"
    When user presses Enter to access detailed data
    Then data table alternative should appear with exact values
    When user tabs through pie chart segments
    Then each segment should be focusable
    And segment should announce "Critical: 25%, 10 incidents"
    When user accesses chart legend via keyboard
    Then legend items should be focusable
    And proper associations should be announced
    When user exports chart data using keyboard
    Then export option should be accessible
    And accessible CSV format should be produced with all data points
    When user verifies visual alternatives
    Then charts should use patterns or shapes in addition to color