# Member Management Visual Test Guide

## Prerequisites
1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:3000
3. Login with admin credentials:
   - Email: `admin@nexus.com`
   - Password: `admin123`

---

## Test 1: Verify "Manage Members" Button Exists

### Steps
1. After login, navigate to: http://localhost:3000/admin/projects
2. Locate any project card in the grid

### Expected UI
Each project card should have:
```
┌─────────────────────────────────────┐
│ [Project Name]            [Icon]    │
│                                     │
│ [Description]                       │
│                                     │
│ [Vertical Badge]                    │
│                                     │
│ ┌──────────┐  ┌──────────┐         │
│ │ Members  │  │ Sprints  │         │
│ │   X      │  │   Y      │         │
│ └──────────┘  └──────────┘         │
│                                     │
│ ┌─────────────────────────────┐    │
│ │    View Project       →     │    │
│ └─────────────────────────────┘    │
│ ┌─────────────────────────────┐    │
│ │ 👥  Manage Members          │  ← LOOK FOR THIS
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### ✅ Pass Criteria
- "Manage Members" button is visible
- Button has Users icon (👥)
- Button is below "View Project" button

### ❌ Fail Criteria
- Button is missing
- Button is disabled
- Button has no icon

---

## Test 2: Dialog Opens When Button Clicked

### Steps
1. Click the "Manage Members" button on any project card

### Expected Behavior
A modal dialog should appear with:
```
┌──────────────────────────────────────────┐
│ Manage Members - [Project Name]     [X] │
├──────────────────────────────────────────┤
│                                          │
│ Members must belong to the [Vertical]    │
│ vertical                                 │
│                                          │
│ [PLACEHOLDER MESSAGE OR COMPONENT]       │
│                                          │
└──────────────────────────────────────────┘
```

### Current Issue ⚠️
The dialog currently shows:
```
"Refresh the page to manage members (requires server data)"
```

This is a PLACEHOLDER and indicates the feature is NOT working.

### ✅ Pass Criteria (Once Fixed)
Dialog should show:
```
┌──────────────────────────────────────────┐
│ Manage Members - Customer Portal    [X] │
├──────────────────────────────────────────┤
│ Members must belong to the Product       │
│ Engineering vertical                     │
│                                          │
│ Project Members                          │
│ ┌────────────────────────────────────┐  │
│ │ Sarah Johnson            [X Remove]│  │
│ │ sarah@example.com                  │  │
│ └────────────────────────────────────┘  │
│ ┌────────────────────────────────────┐  │
│ │ Mike Chen                [X Remove]│  │
│ │ mike@example.com                   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Add Member                               │
│ ┌─────────────────┐ ┌──────────────┐   │
│ │ Select user...▼ │ │ + Add        │   │
│ └─────────────────┘ └──────────────┘   │
└──────────────────────────────────────────┘
```

---

## Test 3: Verify Current Members Display (Once Fixed)

### Steps
1. Open dialog on a project that has members
2. Check the "Project Members" section

### Expected UI Elements
- Section header: "Project Members"
- Each member card shows:
  - Member name (or "Unnamed")
  - Member email
  - Remove button (X icon)
- If no members: "No members yet" message

### ✅ Pass Criteria
- All current project members are listed
- Each member has a remove button
- Member names and emails are displayed correctly

### ❌ Fail Criteria
- Members list is empty when members exist
- Member information is incorrect
- Remove buttons are missing

---

## Test 4: Verify Dropdown Shows Available Users (Once Fixed)

### Steps
1. Open dialog on any project
2. Locate the "Add Member" section
3. Click the dropdown

### Expected Behavior
Dropdown should show:
- Only users from the project's vertical
- Only users NOT already in the project
- Format: User name OR email (if no name)

### Example
If vertical has: Sarah, Mike, Tom, Priya
And project has: Sarah, Mike

Dropdown should show: Tom, Priya

### ✅ Pass Criteria
- Dropdown appears when clicked
- Shows only non-member users from vertical
- Displays user names or emails
- Can select a user

### ❌ Fail Criteria
- Dropdown is empty when users are available
- Shows users already in project
- Shows users from different verticals
- Cannot select users

---

## Test 5: Add Member Functionality (Once Fixed)

### Steps
1. Open dialog
2. Select a user from dropdown
3. Click "Add" button
4. Wait for operation to complete

### Expected Behavior

**During Operation:**
```
┌─────────────────┐ ┌──────────────┐
│ Tom Rivera    ✓ │ │ Adding...    │
└─────────────────┘ └──────────────┘
```

**Success:**
- Toast notification appears: "Member added - Member has been added to the project"
- Page reloads
- User now appears in "Project Members" list
- User removed from dropdown

### ✅ Pass Criteria
- Add button shows "Adding..." during operation
- Success toast appears
- Page reloads automatically
- New member appears in members list
- Member count on project card increases

### ❌ Fail Criteria
- No loading state
- Operation fails silently
- Page doesn't reload
- Member not added to list
- Error with no user feedback

---

## Test 6: Remove Member Functionality (Once Fixed)

### Steps
1. Open dialog on project with members
2. Click X button next to any member
3. Wait for operation to complete

### Expected Behavior

**Success:**
- Toast notification: "Member removed - Member has been removed from the project"
- Page reloads
- User disappears from "Project Members" list
- User appears in dropdown

### ✅ Pass Criteria
- Success toast appears
- Page reloads automatically
- Member removed from list
- Member count on project card decreases
- User now available in dropdown

### ❌ Fail Criteria
- Operation fails silently
- Page doesn't reload
- Member still in list
- Error with no user feedback

---

## Test 7: Edge Case - All Users Already Members (Once Fixed)

### Steps
1. Create or find a project where all vertical users are members
2. Open member management dialog

### Expected UI
```
┌──────────────────────────────────────────┐
│ Manage Members - Project Name       [X] │
├──────────────────────────────────────────┤
│ Members must belong to the [Vertical]    │
│ vertical                                 │
│                                          │
│ Project Members                          │
│ ┌────────────────────────────────────┐  │
│ │ Sarah Johnson            [X Remove]│  │
│ │ sarah@example.com                  │  │
│ └────────────────────────────────────┘  │
│ ┌────────────────────────────────────┐  │
│ │ Mike Chen                [X Remove]│  │
│ │ mike@example.com                   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ (No "Add Member" section appears)        │
└──────────────────────────────────────────┘
```

### ✅ Pass Criteria
- "Add Member" section is hidden
- Only members list is shown
- Can still remove members

---

## Test 8: Edge Case - No Members Yet (Once Fixed)

### Steps
1. Create or find a project with no members
2. Open member management dialog

### Expected UI
```
┌──────────────────────────────────────────┐
│ Manage Members - Project Name       [X] │
├──────────────────────────────────────────┤
│ Members must belong to the [Vertical]    │
│ vertical                                 │
│                                          │
│ Project Members                          │
│ No members yet                           │
│                                          │
│ Add Member                               │
│ ┌─────────────────┐ ┌──────────────┐   │
│ │ Select user...▼ │ │ + Add        │   │
│ └─────────────────┘ └──────────────┘   │
└──────────────────────────────────────────┘
```

### ✅ Pass Criteria
- Shows "No members yet" message
- "Add Member" section is visible
- Dropdown shows all vertical users

---

## Test 9: Authorization Check

### Steps
1. Log out
2. Log in as non-admin user:
   - Email: `sarah@nexus.com`
   - Password: `password123`
3. Attempt to navigate to: http://localhost:3000/admin/projects

### Expected Behavior
- Immediate redirect to http://localhost:3000/
- Never see admin projects page
- Never see "Manage Members" functionality

### ✅ Pass Criteria
- Non-admin users cannot access admin projects page
- Redirected to dashboard

### ❌ Fail Criteria
- Non-admin can see admin pages
- No authorization check
- Can manipulate members without admin role

---

## Test 10: Network Error Handling (Once Fixed)

### Steps
1. Open browser DevTools
2. Go to Network tab
3. Set throttling to "Offline"
4. Open member management dialog
5. Try to add or remove a member

### Expected Behavior
- Toast notification with error message
- User-friendly error text
- UI remains stable
- Can retry operation

### ✅ Pass Criteria
- Error toast appears
- Error message is clear
- No crash or blank screen
- Can close dialog and retry

---

## Current Status Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Button Exists | ✅ PASS | Button is visible on project cards |
| 2. Dialog Opens | ⚠️ PARTIAL | Opens but shows placeholder |
| 3. Members Display | ❌ FAIL | MemberAssignment not rendered |
| 4. Dropdown Users | ❌ FAIL | No dropdown shown |
| 5. Add Member | ❌ FAIL | Functionality not accessible |
| 6. Remove Member | ❌ FAIL | Functionality not accessible |
| 7. All Members | ❌ FAIL | Cannot test without working UI |
| 8. No Members | ❌ FAIL | Cannot test without working UI |
| 9. Authorization | ✅ PASS | Server actions check admin role |
| 10. Error Handling | ❌ FAIL | No error handling in UI |

---

## Screenshots to Capture

1. **Admin Projects Page**: Full page showing all project cards
2. **Manage Members Button**: Close-up of button on project card
3. **Current Dialog State**: The placeholder message dialog
4. **Expected Dialog State**: What it should look like (mock)
5. **After Add Member**: Success toast and updated member list
6. **After Remove Member**: Success toast and updated member list
7. **Empty Members State**: "No members yet" message
8. **Full Members State**: All vertical users are members

---

## Manual Testing Checklist

- [ ] Login as admin
- [ ] Navigate to admin projects page
- [ ] Verify "Manage Members" buttons exist on all project cards
- [ ] Click "Manage Members" on first project
- [ ] Document what appears in dialog (should be placeholder)
- [ ] Close dialog
- [ ] Check browser console for errors
- [ ] Verify MemberAssignment component exists in codebase
- [ ] Verify server actions exist and are implemented
- [ ] Document that components are not connected
- [ ] Test with non-admin user (should not see admin pages)

---

## Developer Notes

**Why is it broken?**
The `project-list.tsx` component imports `MemberAssignment` but never uses it. The dialog renders a placeholder message instead.

**What needs to be fixed?**
1. Add `useEffect` to fetch member data when dialog opens
2. Add loading state while data is fetching
3. Replace placeholder with `<MemberAssignment />` component
4. Pass correct props: projectId, verticalId, currentMembers, verticalUsers

**Estimated Fix Time**: 15-30 minutes
