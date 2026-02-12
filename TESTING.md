# Testing Guide

## Testing Strategy

### 1. Manual Testing

#### Authentication Flow
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Logout
- [ ] Session persistence across page refreshes

#### Vertical Management (Admin)
- [ ] Create vertical
- [ ] Assign users to vertical
- [ ] Remove users from vertical
- [ ] View vertical member count

#### Project Management (Admin)
- [ ] Create project in vertical
- [ ] Add members to project (must be in vertical)
- [ ] Try to add user not in vertical (should fail)
- [ ] Remove members from project
- [ ] View project details

#### Sprint Management (Admin)
- [ ] Create sprint with valid dates
- [ ] Try to create sprint with end date before start date (should fail)
- [ ] Activate sprint
- [ ] Try to activate second sprint (should fail - one active rule)
- [ ] Complete sprint
- [ ] View sprint list

#### Task Management
- [ ] Create task in active sprint
- [ ] Set task type (story/task/bug)
- [ ] Set priority
- [ ] Assign to team member
- [ ] Set story points
- [ ] View task details
- [ ] Edit task
- [ ] Delete task (with confirmation)

#### Kanban Board
- [ ] Drag task from To Do to In Progress
- [ ] Drag task from In Progress to Review
- [ ] Drag task from Review to Done
- [ ] Verify task status updates in database
- [ ] Click task card to open details

#### Comments
- [ ] Add comment to task
- [ ] View all comments
- [ ] Verify comment timestamp and author

#### File Attachments
- [ ] Upload image file (< 10MB)
- [ ] Upload PDF file
- [ ] Try to upload file > 10MB (should fail)
- [ ] Download attachment
- [ ] Delete attachment

#### AI Sprint Planning (Admin)
- [ ] Open AI sprint planning modal
- [ ] Enter feature description
- [ ] Generate tasks
- [ ] Verify stories and child tasks created
- [ ] Check tasks appear on Kanban board

#### User Management (Admin)
- [ ] View all users
- [ ] Promote member to admin
- [ ] Demote admin to member
- [ ] Verify role changes take effect

#### Mobile Responsiveness
- [ ] Open app on mobile (< 640px)
- [ ] Verify hamburger menu appears
- [ ] Navigate through menu items
- [ ] Create task on mobile
- [ ] Drag tasks on mobile Kanban
- [ ] View modals (should be full-screen)

#### Keyboard Shortcuts
- [ ] Press N to open new task modal
- [ ] Press ESC to close modal
- [ ] Press ? to open shortcuts guide
- [ ] Verify shortcuts don't trigger in text inputs

#### Error Handling
- [ ] Trigger form validation error
- [ ] Simulate network error
- [ ] Navigate to non-existent page (404)
- [ ] Verify error boundaries catch errors
- [ ] Check error messages are user-friendly

### 2. Integration Testing (Future)

```typescript
// Example: Task creation test
describe('Task Management', () => {
  it('should create a new task', async () => {
    const task = await createTask({
      sprintId: 'sprint-id',
      title: 'Test task',
      type: 'task',
      priority: 'medium',
    });
    expect(task).toBeDefined();
    expect(task.title).toBe('Test task');
  });
});
```

### 3. E2E Testing (Future)

Using Playwright:

```typescript
// Example: Full user flow
test('complete task workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Create task
  await page.click('text=New Task');
  await page.fill('[name="title"]', 'E2E Test Task');
  await page.click('button:has-text("Create Task")');

  // Verify task appears
  await expect(page.locator('text=E2E Test Task')).toBeVisible();
});
```

### 4. Load Testing

Using k6:

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/dashboard');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

Run with:
```bash
k6 run load-test.js
```

### 5. Security Testing

#### Authentication
- [ ] SQL injection attempts (Prisma prevents)
- [ ] XSS attempts (React escapes)
- [ ] CSRF protection (Next.js built-in)
- [ ] Session hijacking prevention
- [ ] Password strength requirements

#### Authorization
- [ ] Member cannot access admin pages
- [ ] Users cannot access other verticals' projects
- [ ] File download requires authentication
- [ ] API endpoints validate permissions

#### File Upload
- [ ] File type validation
- [ ] File size validation
- [ ] Malicious file detection
- [ ] Secure file storage (R2)

### 6. Performance Testing

#### Metrics to Monitor
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

#### Tools
```bash
# Lighthouse
npx lighthouse http://localhost:3000 --view

# WebPageTest
# Visit https://www.webpagetest.org/

# Chrome DevTools
# Use Performance tab to profile
```

### 7. Accessibility Testing

- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA labels
- [ ] Alt text on images
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] Semantic HTML structure

Tools:
```bash
# axe DevTools
npm install -D @axe-core/cli
npx axe http://localhost:3000
```

## Test Coverage Goals

- Unit Tests: > 80%
- Integration Tests: Critical paths
- E2E Tests: Main user flows
- Security: All auth/authz flows
- Performance: All main pages
- Accessibility: WCAG AA compliance

## Continuous Integration

### GitHub Actions Example

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Bug Reporting

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/videos
5. Browser/device info
6. Error messages from console

## Test Database

For testing, use a separate database:

```env
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/nexus_test"
```

Reset test database:
```bash
npx prisma migrate reset --skip-seed
```

## Monitoring in Production

- Use Vercel Analytics for real user monitoring
- Set up Sentry for error tracking
- Monitor Core Web Vitals
- Track API response times
- Alert on error rate spikes

---

**Remember:** Test early, test often!
