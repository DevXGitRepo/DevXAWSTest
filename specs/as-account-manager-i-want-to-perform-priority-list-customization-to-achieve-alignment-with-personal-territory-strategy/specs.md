# Feature: As Account Manager, I want to perform priority list customization to achieve alignment with personal territory strategy
Status: NEW
Owner: DevX
Last Updated: 2026-05-06

## Summary
Enable Account Managers to customize their priority lists so that account rankings and focus areas align with their personal territory strategy. The feature allows reordering, filtering, tagging, and persisting priority configurations so that each Account Manager can maintain a tailored view of their accounts that reflects strategic intent, market conditions, and relationship context.

## Actors
- Account Manager (primary end user)
- Sales Manager (oversight, may view team priority lists)
- System (persistence, defaults, conflict detection)
- CRM / Data Source (provides account data and territory assignments)

## Goals
- Allow Account Managers to reorder and weight accounts in their priority list to reflect personal territory strategy.
- Provide filtering and grouping tools so managers can segment accounts by strategic criteria.
- Persist customizations reliably so the priority list is consistent across sessions and devices.
- Maintain visibility for Sales Managers without restricting Account Manager autonomy.
- Reduce time spent manually tracking priorities outside the system.

## Key Features
- Drag-and-drop (or explicit rank entry) reordering of accounts within the priority list.
- Custom tagging and categorization of accounts (e.g., "Growth Target," "Retention Risk," "New Opportunity").
- Filtering and sorting by territory attributes, account size, engagement recency, or custom tags.
- Ability to pin accounts to the top of the list regardless of other sort criteria.
- Persistence of all customizations per Account Manager with version history.
- Optional notes field per account entry to capture strategic rationale.
- Reset-to-default option that restores system-generated priority ordering.

## Data & Constraints
- PriorityList: id, account_manager_id, last_modified, version
- PriorityEntry: id, priority_list_id, account_id, rank, pinned (boolean), tags[], notes, last_modified
- Account: id, name, territory_id, segment, revenue_band, engagement_score (sourced from CRM)
- Tag: id, label, color, account_manager_id (user-defined)
- Constraints:
  - An Account Manager can only customize priority lists for accounts within their assigned territory.
  - Maximum number of custom tags per user: configurable (default 25).
  - Notes field limited to 500 characters per entry.
  - Priority list must reflect current territory assignment; removed accounts are archived, not deleted.

## User Scenarios & Testing

### Scenario 1 — Reorder priority list (happy path)
1. Account Manager opens their priority list view.
2. Account Manager drags an account from position 8 to position 2.
3. System updates rankings for all affected entries and persists the new order.
4. Account Manager navigates away and returns; the list reflects the saved order.

Acceptance criteria (testable):
- After reordering, the new rank order is persisted and displayed consistently on reload.
- All intermediate ranks adjust automatically (no duplicate or missing ranks).
- The change is reflected within 2 seconds of the user completing the action.

### Scenario 2 — Tag and filter accounts
1. Account Manager creates a custom tag "Q3 Expansion."
2. Account Manager applies the tag to five accounts.
3. Account Manager filters the priority list to show only accounts tagged "Q3 Expansion."
4. Filtered view displays exactly those five accounts in their current rank order.

Acceptance criteria (testable):
- Custom tags are created, applied, and persisted without page reload.
- Filtering by tag returns only matching accounts and preserves rank order.
- Removing a tag from all accounts and deleting it removes it from filter options.

### Scenario 3 — Pin accounts to top
1. Account Manager pins two accounts.
2. Pinned accounts appear at the top of the list regardless of other sort/filter criteria.
3. Account Manager unpins one account; it returns to its ranked position.

Acceptance criteria (testable):
- Pinned accounts always render above non-pinned accounts.
- Unpinning restores the account to its previously assigned rank.

### Scenario 4 — Reset to system default
1. Account Manager clicks "Reset to Default."
2. System prompts for confirmation.
3. Upon confirmation, the list reverts to the system-generated priority order.
4. Custom tags and notes are preserved; only rank order is reset.

Acceptance criteria (testable):
- After reset, rank order matches the system-generated default.
- Tags and notes remain intact post-reset.
- A confirmation step prevents accidental resets.

### Scenario 5 — Territory change removes accounts
1. An account is reassigned out of the Account Manager's territory by the system/admin.
2. The account is removed from the active priority list and moved to an archived section.
3. Account Manager is notified of the change.

Acceptance criteria (testable):
- Accounts no longer in the user's territory do not appear in the active priority list.
- Archived entries are accessible in a separate view for reference.
- A notification or visual indicator alerts the Account Manager to the territory change.

## Functional Requirements (testable)

1. **Priority list display**
   - Account Managers see a ranked list of all accounts in their assigned territory upon accessing the feature.
   - List displays account name, rank, tags, and last-engagement date at minimum.

2. **Reordering**
   - Users can reorder via drag-and-drop or by entering an explicit rank number.
   - Rank changes are saved automatically (no separate "Save" action required for reorder).

3. **Custom tags**
   - Users can create, rename, recolor, and delete custom tags.
   - Tags can be applied to or removed from one or multiple accounts in a single action.

4. **Filtering and sorting**
   - Users can filter by tag, territory segment, revenue band, or engagement score range.
   - Users can sort by rank, account name, or last-engagement date.
   - Active filters are visually indicated and can be cleared individually or all at once.

5. **Pinning**
   - Users can pin/unpin accounts; pinned accounts are visually distinct and anchored to the top.

6. **Notes**
   - Users can add or edit a free-text note on any priority entry.
   - Notes are saved on blur or explicit save and are visible in the detail/expand view.

7. **Persistence and resumability**
   - All customizations persist server-side and are available across devices and sessions.
   - Version history allows the user to view (read-only) previous states of their priority list.

8. **Reset to default**
   - A single action resets rank order to system-generated defaults after user confirmation.

9. **Territory integrity**
   - The system enforces that only accounts within the user's current territory appear on the active list.
   - Changes to territory assignments are reflected within one sync cycle. [NEEDS CLARIFICATION: sync frequency]

10. **Sales Manager visibility**
    - Sales Managers can view (read-only) the priority lists of Account Managers on their team.
    - Sales Managers cannot edit another user's priority list.

11. **Accessibility**
    - All interactive elements (drag handles, filters, tag controls) meet WCAG 2.1 AA.
    - Keyboard-only reordering is supported as an alternative to drag-and-drop.

12. **Performance**
    - Priority list loads usable content within 2 seconds for lists of up to 500 accounts on broadband.
    - Reorder and tag operations complete (UI feedback) within 500ms.

## Success Criteria (measurable & verifiable)
- **Adoption:** 80% of active Account Managers customize their priority list within 30 days of launch.
- **Task efficiency:** Median time to reorder 5 accounts is under 30 seconds.
- **Persistence reliability:** 99.9% of saved customizations are retrievable on next session without data loss.
- **User satisfaction:** Post-launch survey scores ≥ 4/5 for "The priority list helps me execute my territory strategy."
- **Performance:** 95th percentile page load for the priority list view is under 2.5 seconds.
- **Accessibility:** Zero critical WCAG 2.1 AA violations on the priority list view in automated and manual audit.

## Key Entities
- Account Manager (user performing customization)
- Sales Manager (read-only oversight)
- Account (CRM-sourced record within a territory)
- PriorityList (container for a user's ranked entries)
- PriorityEntry (individual account ranking, tags, notes)
- Tag (user-defined label)
- Territory (assignment boundary)

## Assumptions
- Account data and territory assignments are sourced from an existing CRM and kept in sync.
- Each Account Manager has exactly one active priority list at a time (no multi-list scenarios in v1).
- The system-generated default priority order is provided by an existing scoring algorithm outside the scope of this feature.
- Account Managers access the feature via modern web browsers; mobile-responsive design is required.

## Milestones (high-level)
1. **M1** — Core priority list display, drag-and-drop reordering, persistence, and reset-to-default.
2. **M2** — Custom tags, filtering, sorting, pinning, and notes.
3. **M3** — Sales Manager read-only view, version history, territory-change notifications, and accessibility hardening.

---

Notes:
- Clarify sync frequency for territory assignment changes with the CRM/platform team.
- Confirm maximum territory size (number of accounts) to validate performance requirements.
- Determine whether version history should support rollback or remain read-only reference.