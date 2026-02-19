# 🔄 Bidirectional GitHub Issue Sync

## ✅ Now Deployed and Working!

Your Nexus project now has **full bidirectional sync** between tasks and GitHub issues.

---

## 🚀 How It Works

### **Nexus → GitHub** (Real-time)

When you change a task status in Nexus, it automatically updates the GitHub issue:

| Nexus Status | GitHub Issue State | What Happens |
|--------------|-------------------|--------------|
| **Todo** | ✅ **Open** | Issue is reopened in GitHub |
| **In Progress** | ✅ **Open** | Issue remains/becomes open |
| **Review** | ❌ **Closed** | Issue is closed in GitHub |
| **Done** | ❌ **Closed** | Issue is closed in GitHub |

### **GitHub → Nexus** (Via Webhook)

When someone changes an issue in GitHub, it automatically updates the task in Nexus:

| GitHub Action | Nexus Status | What Happens |
|---------------|--------------|--------------|
| **Close Issue** | ✅ **Review** | Task moves to Review (needs verification) |
| **Reopen Issue** | ✅ **In Progress** | Task moves back to In Progress |

---

## 📋 Complete Workflow Example

### Scenario 1: Developer Closes Issue in GitHub

1. **Dev closes issue #42 in GitHub**
   ```
   Issue #42: "Fix login bug" → Closed ✅
   ```

2. **Webhook fires → Nexus receives event**
   ```
   [GitHub Webhook] Issue #42 closed in repo/project
   ```

3. **Task automatically moves to Review**
   ```
   Task "Fix login bug" → Status: Review ⏳
   ```

4. **Project manager verifies in Nexus**
   - Opens Kanban board
   - Sees task in Review column
   - Tests the fix
   - Moves to Done if satisfied ✅

5. **Task marked Done → Issue stays closed in GitHub**
   ```
   Task "Fix login bug" → Status: Done ✅
   GitHub Issue #42 → Remains closed ✅
   ```

---

### Scenario 2: PM Moves Task Back to Todo

1. **PM discovers issue not actually fixed**
   ```
   Task "Fix login bug" → Moved to Todo
   ```

2. **Nexus syncs to GitHub**
   ```
   Syncing task to GitHub...
   ```

3. **GitHub issue reopened automatically**
   ```
   Issue #42: "Fix login bug" → Reopened 🔄
   Labels updated: status: todo
   ```

4. **Dev sees issue is back open**
   - Notification in GitHub
   - Issue appears in "Open" tab
   - Can continue working on it

---

## 🔒 Loop Prevention

The system prevents infinite loops between Nexus and GitHub:

✅ **10-second sync window** - Recently synced changes are not re-processed
✅ **Status tracking** - Compares previous state before updating
✅ **Timestamp checks** - Uses `githubSyncedAt` to detect recent syncs

**Example:**
```
1. User moves task to "done" in Nexus
2. Nexus closes GitHub issue (sets githubSyncedAt)
3. GitHub webhook fires back to Nexus
4. Nexus sees: "closed 2 seconds ago, skip"
5. No infinite loop! ✅
```

---

## 🎯 Status Mapping Details

### **Review Status** (New!)

- **Purpose:** Allows devs to close issues when done, but PM can verify before marking truly "Done"
- **GitHub:** Issue is closed (removes from dev's queue)
- **Nexus:** Task is in Review column (PM can verify/test)
- **Workflow:**
  1. Dev finishes → Closes GitHub issue
  2. Task moves to Review in Nexus
  3. PM tests/verifies
  4. PM moves to Done if satisfied
  5. PM moves back to Todo/Progress if not ready

### **Status Flow**

```
┌─────────┐
│  Todo   │────┐
└─────────┘    │
               ▼
         GitHub: OPEN
               │
┌─────────┐    │
│Progress │◄───┘
└─────────┘
     │
     ▼
┌─────────┐
│ Review  │────┐
└─────────┘    │
               ▼
         GitHub: CLOSED
               │
┌─────────┐    │
│  Done   │◄───┘
└─────────┘
```

---

## 🧪 Testing the Sync

### **Test 1: Nexus → GitHub**

1. Go to: https://nexus-rosy-nine.vercel.app/
2. Open a project with GitHub linked
3. Find a task with a GitHub issue
4. Move task to "Review"
5. Check GitHub → Issue should be closed ✅

6. Move same task back to "Todo"
7. Check GitHub → Issue should be reopened ✅

### **Test 2: GitHub → Nexus**

1. Go to your GitHub repository
2. Find an issue linked to a Nexus task
3. Close the issue in GitHub
4. Go back to Nexus Kanban board
5. Task should be in "Review" column ✅

6. Reopen the issue in GitHub
7. Refresh Nexus
8. Task should be in "In Progress" column ✅

---

## 📊 What Gets Synced

### **From Nexus to GitHub:**

✅ Issue State (open/closed)
✅ Issue Title
✅ Issue Description
✅ Labels (status, priority, type)
✅ Assignee
✅ Story Points (in body)
✅ Last Sync Timestamp
✅ **NEW:** Nexus Status (todo/progress/review/done)

### **From GitHub to Nexus:**

✅ Issue State → Task Status
✅ Sync Timestamp
✅ Automatic Page Revalidation

---

## 🔧 Technical Details

### **Sync Triggers**

**Automatic Sync:**
- ✅ Task status change in Nexus
- ✅ Issue closed/reopened in GitHub
- ✅ Task updated (title, description, assignee)

**Manual Sync:**
- ✅ Click sync button on task
- ✅ Batch sync all tasks in project (admin)

### **Webhook Configuration**

For the GitHub → Nexus sync to work, you need:

1. **Webhook URL:**
   ```
   https://nexus-rosy-nine.vercel.app/api/github/webhook
   ```

2. **Events to Subscribe:**
   - ✅ Issues (closed, reopened)

3. **Content Type:**
   - `application/json`

4. **Secret (Optional but Recommended):**
   - Set `GITHUB_WEBHOOK_SECRET` in env vars
   - Webhook will verify signature

### **Environment Variables**

Required for sync:
```env
# User's GitHub token (from OAuth)
# Automatically set when user logs in with GitHub

# Optional: System bot token for fallback
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxxx

# Optional: Webhook verification
GITHUB_WEBHOOK_SECRET=your-secret-here
```

---

## 🎨 UI Indicators

### **Sync Status Indicators:**

**In Nexus:**
- 🔗 GitHub icon on synced tasks
- 🔄 Sync spinner when updating
- ✅ Success toast when synced
- ⚠️ Error toast if sync fails
- 📅 Last synced timestamp

**In GitHub:**
- 🏷️ Status label (status: todo, status: review, etc.)
- 📝 Nexus Status in issue body
- 🔗 Task ID in issue body
- ⏰ Last synced timestamp

---

## ⚠️ Important Notes

### **Review Status Behavior**

❗ **Moving to Review closes the GitHub issue**
- This is intentional!
- Allows devs to close issues when done
- PM can verify before marking truly "Done"
- If not ready, PM moves back to Todo → Issue reopens

### **Status Preservation**

✅ **GitHub close → Nexus Review** (not Done)
- Prevents premature completion
- Requires PM verification
- Better workflow control

### **Webhook Requirements**

⚠️ **GitHub → Nexus sync requires webhook**
- Set up webhook in GitHub repo settings
- Point to `/api/github/webhook`
- Select "Issues" events
- Without webhook, GitHub changes won't sync back

---

## 🐛 Troubleshooting

### Issue: Task doesn't update from GitHub

**Check:**
1. Is webhook configured in GitHub?
2. Is webhook URL correct?
3. Are "Issues" events enabled?
4. Check Vercel logs for webhook errors

**Solution:**
```bash
# Check webhook logs in GitHub
Settings → Webhooks → Recent Deliveries
```

### Issue: GitHub issue doesn't update from Nexus

**Check:**
1. Does user have GitHub token?
2. Is project linked to GitHub repo?
3. Does task have `githubIssueNumber`?

**Solution:**
```bash
# Re-sync manually
Click sync icon on task card
```

### Issue: Infinite loop between Nexus and GitHub

**Check:**
1. Are you seeing rapid status changes?
2. Check `githubSyncedAt` timestamps

**Solution:**
- Loop prevention is built-in (10-second window)
- If it persists, check for manual status changes
- Contact support with task ID

---

## 📈 Benefits

### **For Developers:**
✅ Work in GitHub as usual
✅ Close issues when done
✅ Don't need to update Nexus manually
✅ See Nexus status in GitHub issues

### **For Project Managers:**
✅ Verify completed work before marking "Done"
✅ Track progress in Nexus Kanban
✅ Reopen issues by moving to Todo
✅ Full visibility of dev work

### **For Teams:**
✅ Single source of truth (synced)
✅ Less manual coordination
✅ Better workflow control
✅ Automatic updates both ways

---

## 🎉 Success Indicators

You'll know sync is working when:

✅ Task moved to Review → Issue closed in GitHub
✅ Issue closed in GitHub → Task moved to Review in Nexus
✅ Task moved to Todo → Issue reopened in GitHub
✅ Issue reopened in GitHub → Task in Progress in Nexus
✅ Labels updated automatically
✅ No infinite loops
✅ Toast notifications show sync success

---

## 📝 Summary

**The bidirectional sync is now LIVE at:**
https://nexus-rosy-nine.vercel.app/

**What changed:**
- ✅ Moving tasks to Todo/Progress reopens GitHub issues
- ✅ Moving tasks to Review/Done closes GitHub issues
- ✅ Closing GitHub issues moves tasks to Review
- ✅ Reopening GitHub issues moves tasks to Progress
- ✅ Loop prevention with 10-second window
- ✅ Better status tracking and revalidation

**Test it now and enjoy seamless GitHub integration!** 🚀

---

**Last Updated:** February 18, 2026
**Status:** 🟢 LIVE in Production
**Deployment:** https://nexus-rosy-nine.vercel.app/
