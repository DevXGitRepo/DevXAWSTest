Feature: Module-Level Performance Benchmarking and Comparison
  As an Operations Manager
  I want to perform module-level performance benchmarking and comparison
  So that I can identify optimization opportunities across insurance operations

  Background:
    Given user is logged in as "Operations Manager" with "benchmark_reports" permission
    And performance targets have been configured for all insurance modules
    And user is on the "Operations Dashboard" page

  @functional @regression @priority-high @smoke
  Scenario: Verify benchmark report displays all insurance modules ranked by response time against defined targets
    Given at least 5 insurance modules have recorded performance data in the "production" environment
    When user clicks on "Performance Benchmarking" menu item in the left navigation panel
    Then the "Performance Benchmarking" landing page should be displayed
    And "Benchmark Reports" option should be visible
    And "Optimization Recommendations" option should be visible
    And "Environment Comparison" option should be visible
    When user clicks on "Benchmark Reports" card
    Then the "Benchmark Reports" page should be displayed
    And the report table should display columns "Module Name, Avg Response Time, Target Response Time, Throughput (req/s), Target Throughput, Error Rate (%), Target Error Rate, Status"
    And all insurance modules should be ranked by "response time" in "descending" order
    When user clicks on "Throughput (req/s)" column header to sort the table
    Then the table should be sorted by "Throughput" in "ascending" order
    And a sort indicator arrow should appear on the "Throughput" column header
    When user clicks on "Error Rate (%)" column header to sort the table
    Then the table should be sorted by "Error Rate" in "descending" order
    And modules exceeding the error rate target should display a "red" indicator
    And modules within the error rate target should display a "green" indicator
    And each module row should display actual values alongside target values for "response time, throughput, error rate"
    And modules exceeding targets should be visually highlighted with a "warning" indicator
    And modules meeting targets should display a "green checkmark" or "Pass" status

  @functional @regression @priority-high
  Scenario: Verify benchmark report identifies and ranks top operations within each module by response time
    Given the "Claims" module has at least 10 distinct operations with recorded performance data
    And performance targets are defined at the operation level for the "Claims" module
    And user is on the "Benchmark Reports" page
    When user clicks on the "Claims" module row in the benchmark report table
    Then a detailed view should open showing all operations within the "Claims" module
    And the operations sub-table should display columns "Operation Name, Avg Response Time (ms), Target Response Time (ms), Throughput, Target Throughput, Error Rate, Target Error Rate, Variance (%)"
    And the operations should be ranked by "response time" in "descending" order
    And the "Variance" column should display the percentage difference between actual and target for each operation
    And operations exceeding targets should show a positive variance in "red" text
    And operations within target should show a negative or zero variance in "green" text
    When user clicks on "Back to Module Overview" breadcrumb
    Then user should be redirected to the "Benchmark Reports" page
    And the previous sort order and filters should be preserved

  @functional @regression @priority-high
  Scenario: Verify optimization recommendations are generated for operations exceeding target thresholds
    Given at least 3 operations across different modules have metrics exceeding their defined target thresholds
    And the recommendation engine has been configured with optimization rules
    And user is on the "Performance Benchmarking" page
    When user clicks on "Optimization Recommendations" tab
    Then the "Optimization Recommendations" page should be displayed
    And each recommendation should display "Module Name, Operation Name, Current Metric Value, Target Value, Recommendation Description, Estimated Improvement Impact"
    And recommendations should be sorted by "estimated improvement impact" in "descending" order
    When user clicks on the first recommendation row to view details
    Then a detail panel should open showing "full recommendation description"
    And the detail panel should display "root cause analysis summary"
    And the detail panel should display "estimated effort level"
    And the detail panel should display "estimated improvement percentage"
    And the detail panel should display "historical trend of the metric"
    And the detail panel should display a link to the "related benchmark report entry"
    When user closes the detail panel
    And user clicks on "Export Recommendations" button
    Then a file download dialog should appear offering "CSV" and "PDF" format options
    And the exported file should contain all displayed recommendations with full details

  @functional @regression @priority-high
  Scenario: Verify benchmark comparison across environments identifies environment-specific variances
    Given user has access to "dev, staging, production" environments
    And performance benchmark data exists for the same modules across "dev, staging, production" environments
    And environment configurations are registered in the system
    And user is on the "Performance Benchmarking" page
    When user clicks on "Environment Comparison" tab
    Then the "Environment Comparison" page should be displayed
    And environment selector checkboxes for "Dev", "Staging", and "Production" should all be checked by default
    And the comparison table should display columns grouped by environment with "Response Time, Throughput, Error Rate" for each
    And each module row should show actual values for all three environments
    And cells where one environment significantly deviates from others should be highlighted
    And variance indicators should display percentage differences between environments
    When user unchecks the "Dev" environment checkbox
    Then the comparison table should update to show only "Staging" and "Production" columns
    And variance calculations should update to compare only between the two selected environments
    When user clicks on a highlighted variance cell for "Production" environment
    Then a detail panel should open showing "environment configuration differences"
    And the detail panel should display "historical performance trend for each environment"
    And the detail panel should display "potential causes for the variance"
    And the detail panel should display a link to "related optimization recommendations"
    When user closes the detail panel
    And user checks the "Dev" environment checkbox
    And user clicks on "Generate Variance Report" button
    Then a variance summary report should be generated showing all variances ranked by severity
    And the report should include a summary section with total number of variances found
    And the report should display the top 3 most critical variances

  @functional @regression @priority-high
  Scenario: Verify date range filtering on benchmark reports returns correct time-scoped data
    Given performance benchmark data exists for at least the last 90 days across all modules
    And user is on the "Benchmark Reports" page
    Then the date range picker should display "Last 30 Days" as the selected option
    And the report header should show the exact date range for the last 30 days
    And all metric values should be aggregated from data within the 30-day window
    When user clicks on the date range picker and selects "Last 7 Days"
    Then a loading indicator should appear briefly during data refresh
    And the report should refresh and display benchmark data aggregated over the last 7 days
    And module rankings may change reflecting the shorter time window
    When user clicks on the date range picker and selects "Custom Range"
    And user enters "2025-04-01" in "Start Date" field
    And user enters "2025-04-30" in "End Date" field
    And user clicks "Apply" button
    Then the report should refresh to show benchmark data for the custom date range
    And the report header should update to show "April 1, 2025 - April 30, 2025"
    And all metrics should reflect the custom date range only
    And the data should not be stale or cached from a previous query

  @functional @regression @priority-high
  Scenario: Verify API endpoint returns correct benchmark data with valid authentication
    Given a valid API authentication token exists for an "Operations Manager" user
    And performance benchmark data is available for at least 3 modules
    When user sends a "GET" request to "/api/v1/benchmarks/reports" with valid authorization and query parameter "environment=production"
    Then the API should return HTTP status code 200
    And the response body should contain an array of module benchmark objects
    And each benchmark object should include "moduleId, moduleName, avgResponseTime, targetResponseTime, throughput, targetThroughput, errorRate, targetErrorRate, status, timestamp"
    And the response content type should be "application/json"

  @functional @regression @priority-high @negative
  Scenario: Verify API endpoint rejects unauthenticated requests
    When user sends a "GET" request to "/api/v1/benchmarks/reports" without an authorization header
    Then the API should return HTTP status code 401
    And the response body should contain error message "Authentication required"

  @functional @regression @priority-high
  Scenario: Verify API endpoint returns optimization recommendations
    Given a valid API authentication token exists for an "Operations Manager" user
    When user sends a "GET" request to "/api/v1/benchmarks/recommendations" with valid authorization and query parameter "environment=production"
    Then the API should return HTTP status code 200
    And the response body should contain an array of optimization recommendation objects
    And each recommendation object should include "recommendationId, moduleId, operationName, currentValue, targetValue, recommendation, estimatedImpact, priority"

  @functional @regression @priority-high
  Scenario: Verify API endpoint returns environment comparison data
    Given a valid API authentication token exists for an "Operations Manager" user
    When user sends a "GET" request to "/api/v1/benchmarks/compare" with valid authorization and query parameter "environments=dev,staging,production"
    Then the API should return HTTP status code 200
    And the response body should contain environment comparison data structured by module
    And each module should have nested objects for each environment with respective metrics and calculated variances

  @functional @regression @priority-high
  Scenario: Verify API response time meets SLA requirements
    Given a valid API authentication token exists for an "Operations Manager" user
    When user sends a "GET" request to "/api/v1/benchmarks/reports" with valid authorization and query parameter "environment=production"
    Then the API response should be received within 3 seconds
    And the response headers should include appropriate cache-control directives

  @functional @regression @priority-high
  Scenario: Verify system correctly processes and returns results when benchmark data is refreshed
    Given benchmark data was last refreshed more than 1 hour ago
    And new performance data has been ingested into the application database since the last refresh
    And user is on the "Benchmark Reports" page
    Then the "Last Updated" timestamp should be visible on the page header
    And the "Last Updated" timestamp should show a time more than 1 hour ago
    When user clicks on "Refresh Data" button
    Then a loading spinner should appear with status message "Refreshing benchmark data..."
    And user waits for the refresh operation to complete
    Then the loading indicator should disappear
    And the "Last Updated" timestamp should update to the current time
    And a success notification "Benchmark data refreshed successfully" should be displayed
    And module rankings and metric values should reflect the newly ingested data
    When user navigates to "Optimization Recommendations" page
    Then recommendations should reflect the latest benchmark data
    And operations that now meet their targets should be marked as "Resolved"
    And new recommendations should appear for operations that now exceed targets

  @functional @regression @priority-high
  Scenario: Verify system handles concurrent benchmark report access and returns expected results
    Given two Operations Manager users "UserA" and "UserB" are logged in on separate browser sessions
    And performance benchmark data exists for all modules in the "production" environment
    When "UserA" navigates to "Performance Benchmarking" page and clicks "Benchmark Reports"
    Then "UserA" should see the full benchmark report with all modules ranked by response time
    And the report should load within the SLA time limit
    When "UserB" navigates to "Performance Benchmarking" page and clicks "Benchmark Reports"
    Then "UserB" should see the full benchmark report with identical data to "UserA"
    And both sessions should load independently without interference
    When "UserA" applies a date range filter of "Last 7 Days" on the benchmark report
    Then "UserA" report should update to show data for "Last 7 Days"
    And "UserB" report should remain unchanged showing "Last 30 Days" view
    When "UserB" navigates to "Environment Comparison" page and selects "Staging" and "Production" environments
    Then "UserB" should see the environment comparison for "Staging" and "Production"
    And "UserA" session should remain unaffected
    When "UserA" clicks on "Refresh Data" button on the benchmark report
    Then "UserA" data should refresh successfully
    And "UserB" current view should not be disrupted
    And database integrity should be maintained with no duplicate or conflicting records

  @functional @regression @priority-medium
  Scenario Outline: Verify benchmark report visual indicators correctly distinguish pass/fail status against targets
    Given at least 2 modules are within target thresholds and at least 2 modules exceed target thresholds
    And user is on the "Benchmark Reports" page
    When user observes the status column for a module with "<status_type>" status
    Then the module row should display a "<icon>" icon in the Status column
    And the metric cells should be displayed in "<color>" styling

    Examples:
      | status_type                                          | icon            | color          |
      | all three metrics within target                      | green checkmark | green          |
      | response time exceeding target only                  | amber warning   | mixed          |
      | all three metrics exceeding target                   | red X           | red            |

  @functional @regression @priority-medium
  Scenario: Verify tooltip displays variance details on highlighted metric cells
    Given at least 2 modules exceed target thresholds
    And user is on the "Benchmark Reports" page
    When user hovers over a red-highlighted metric cell in the benchmark report
    Then a tooltip should appear showing "Current" value, "Target" value, and "Variance" percentage
    And the tooltip should provide clear context for the failure

  @functional @regression @priority-medium
  Scenario: Verify benchmark report data persistence and retrieval after user session ends
    Given user is on the "Benchmark Reports" page
    And user has applied date range filter "Last 7 Days" and sorted by "Error Rate"
    When user notes the top 3 modules by error rate and their exact metric values
    And user clicks on the user avatar in the top-right corner
    And user selects "Sign Out"
    Then user should be redirected to the "Login" page
    When user logs back in with the same "Operations Manager" credentials
    And user navigates to "Performance Benchmarking" page
    And user clicks on "Benchmark Reports" card
    Then the report should display the default view with "Last 30 Days" date range
    And the report should be sorted by "response time" by default
    When user applies date range filter "Last 7 Days"
    And user clicks on "Error Rate (%)" column header to sort the table
    Then the benchmark data should match the previously noted values
    And the data should confirm persistence in the application database independent of user sessions

  @functional @regression @priority-medium
  Scenario Outline: Verify Operations Manager can export benchmark report in multiple formats
    Given benchmark report is displayed with data for at least 5 modules
    And user is on the "Benchmark Reports" page
    When user clicks on "Export" button
    Then a dropdown menu should appear with export format options
    When user selects "Export as <format>" from the dropdown
    Then a "<format>" file should be downloaded to the user's default download location
    And the filename should include "benchmark_report" and the current date
    And a success toast notification "Report exported successfully" should be displayed
    And the exported file should contain all module rows with correct values matching the UI display

    Examples:
      | format |
      | CSV    |
      | PDF    |

  @functional @regression @priority-medium
  Scenario: Verify CSV export file contains correct headers and data
    Given benchmark report is displayed with data for at least 5 modules
    And user is on the "Benchmark Reports" page
    When user clicks on "Export" button
    And user selects "Export as CSV" from the dropdown
    Then the downloaded CSV file should contain headers "Module Name, Avg Response Time, Target Response Time, Throughput, Target Throughput, Error Rate, Target Error Rate, Status"
    And all module rows from the report should be present with correct values
    And no data corruption or truncation should exist in the exported file

  @functional @regression @priority-high @security
  Scenario: Verify Operations Manager has full access to all benchmark features
    When user navigates to "Performance Benchmarking" page
    Then "Benchmark Reports