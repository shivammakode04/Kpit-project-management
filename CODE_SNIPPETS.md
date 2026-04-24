# Code Snippets & Quick Reference

## Backend Code Snippets

### 1. Create Notification with Project Reference
```python
from apps.core.utils import create_notification

# Send project invitation
create_notification(
    user_id=2,
    notification_type='project_invite',
    message=f'You have been invited to join Project "{project.name}"',
    project_id=project.id,
    related_object_id=member.id,
)
```

### 2. Query Accepted Members
```python
from apps.projects.models import ProjectMember

# Get only accepted members
accepted_members = ProjectMember.objects.filter(
    project_id=project_id,
    status='accepted'
).select_related('user')

# Get with user details
for member in accepted_members:
    print(f"{member.user.username} - {member.role}")
```

### 3. Query Users Not in Project
```python
from django.db.models import Q
from apps.users.models import CustomUser
from apps.projects.models import ProjectMember

# Get users not in project
project_user_ids = ProjectMember.objects.filter(
    project_id=project_id
).values_list('user_id', flat=True)

available_users = CustomUser.objects.exclude(id__in=project_user_ids)

# With search
search_query = 'john'
available_users = available_users.filter(
    Q(username__icontains=search_query) |
    Q(email__icontains=search_query) |
    Q(full_name__icontains=search_query)
)
```

### 4. Accept Invitation
```python
from apps.projects.models import ProjectMember
from apps.notifications.models import Notification

# Accept invitation
member = ProjectMember.objects.get(id=member_id, user=request.user)
member.status = 'accepted'
member.save()

# Mark notification as read
Notification.objects.filter(
    user=request.user,
    type='project_invite',
    related_object_id=member.id,
).update(is_read=True)
```

---

## Frontend Code Snippets

### 1. Use TeamManagement Component
```tsx
import { TeamManagement } from '@/components/TeamManagement';

export function ProjectSettings({ projectId }: { projectId: number }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Team Management</h2>
        <TeamManagement projectId={projectId} />
      </div>
    </div>
  );
}
```

### 2. Use NotificationBell Component
```tsx
import { NotificationBell } from '@/components/NotificationBell';
import { useQueryClient } from '@tanstack/react-query';

export function Topbar() {
  const queryClient = useQueryClient();

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h1>FlowForge</h1>
      <NotificationBell 
        onInviteAccepted={() => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }}
      />
    </div>
  );
}
```

### 3. Use TaskAssignmentSelect Component
```tsx
import { TaskAssignmentSelect } from '@/components/TaskAssignmentSelect';
import { useState } from 'react';

export function CreateTaskModal({ projectId }: { projectId: number }) {
  const [assignedTo, setAssignedTo] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Assign To</label>
        <TaskAssignmentSelect
          projectId={projectId}
          value={assignedTo}
          onChange={setAssignedTo}
        />
      </div>
    </div>
  );
}
```

### 4. Call API Endpoints
```typescript
import { projectsApi } from '@/api/projects';

// Get users directory
const users = await projectsApi.getUsersDirectory(projectId, 'john');

// Get accepted members
const members = await projectsApi.getMembers(projectId, 'accepted');

// Send invitation
const member = await projectsApi.inviteMember(projectId, userId);

// Accept invitation
const accepted = await projectsApi.acceptInvite(memberId);
```

### 5. Handle Notifications
```typescript
import { notificationsApi } from '@/api/notifications';

// Get all notifications
const response = await notificationsApi.list();
const notifications = response.data.results;

// Filter project invites
const invites = notifications.filter(n => n.type === 'project_invite');

// Check if has unread
const hasUnread = notifications.some(n => !n.is_read);
```

---

## API Request Examples

### cURL Examples

#### Get Users Directory
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/projects/1/users-directory/?q=john"
```

#### Get Accepted Members
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/projects/1/members/?status=accepted"
```

#### Send Invitation
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2}' \
  "http://localhost:8000/api/projects/1/invite/"
```

#### Accept Invitation
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/projects/invites/1/accept/"
```

#### Get Notifications
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/notifications/"
```

---

## Database Queries

### Check Pending Invitations
```sql
SELECT * FROM project_members 
WHERE status = 'pending' 
ORDER BY joined_at DESC;
```

### Check Accepted Members
```sql
SELECT pm.*, u.username, u.email 
FROM project_members pm
JOIN users u ON pm.user_id = u.id
WHERE pm.project_id = 1 AND pm.status = 'accepted';
```

### Check Notifications for User
```sql
SELECT * FROM notifications 
WHERE user_id = 1 AND type = 'project_invite'
ORDER BY created_at DESC;
```

### Check Unread Notifications
```sql
SELECT COUNT(*) as unread_count 
FROM notifications 
WHERE user_id = 1 AND is_read = 0;
```

---

## Component Props Reference

### TeamManagement
```typescript
interface TeamManagementProps {
  projectId: number;
}

// Usage
<TeamManagement projectId={1} />
```

### NotificationBell
```typescript
interface NotificationBellProps {
  onInviteAccepted?: () => void;
}

// Usage
<NotificationBell onInviteAccepted={() => reloadProjects()} />
```

### TaskAssignmentSelect
```typescript
interface TaskAssignmentSelectProps {
  projectId: number;
  value?: number | null;
  onChange: (userId: number | null) => void;
  disabled?: boolean;
}

// Usage
<TaskAssignmentSelect
  projectId={1}
  value={userId}
  onChange={setUserId}
  disabled={false}
/>
```

---

## Error Handling Examples

### Backend Error Responses

#### 403 Forbidden - Not Admin
```json
{
  "detail": "Only project admin can add members."
}
```

#### 400 Bad Request - Already Member
```json
{
  "detail": "User is already a member or invited."
}
```

#### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### Frontend Error Handling
```typescript
try {
  await projectsApi.inviteMember(projectId, userId);
  toast({
    title: 'Success',
    description: 'Invitation sent successfully',
  });
} catch (error) {
  toast({
    title: 'Error',
    description: 'Failed to send invitation',
    variant: 'destructive',
  });
}
```

---

## State Management Examples

### Using React Query
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';

// Query members
const { data: members, isLoading } = useQuery({
  queryKey: ['members', projectId],
  queryFn: () => projectsApi.getMembers(projectId, 'accepted'),
});

// Mutation for inviting
const { mutate: invite } = useMutation({
  mutationFn: (userId: number) => projectsApi.inviteMember(projectId, userId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members', projectId] });
  },
});
```

### Using Zustand (if applicable)
```typescript
import { create } from 'zustand';

interface ProjectStore {
  selectedProjectId: number;
  setSelectedProjectId: (id: number) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  selectedProjectId: 0,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
}));
```

---

## Testing Examples

### Backend Test
```python
from django.test import TestCase
from apps.projects.models import Project, ProjectMember
from apps.users.models import CustomUser

class ProjectInviteTestCase(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='test123'
        )
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.user
        )

    def test_invite_user(self):
        invitee = CustomUser.objects.create_user(
            username='user',
            email='user@test.com',
            password='test123'
        )
        
        member = ProjectMember.objects.create(
            project=self.project,
            user=invitee,
            status='pending'
        )
        
        self.assertEqual(member.status, 'pending')
```

### Frontend Test
```typescript
import { render, screen } from '@testing-library/react';
import { TeamManagement } from '@/components/TeamManagement';

describe('TeamManagement', () => {
  it('renders tabs', () => {
    render(<TeamManagement projectId={1} />);
    expect(screen.getByText('All Users')).toBeInTheDocument();
    expect(screen.getByText('My Team')).toBeInTheDocument();
  });
});
```

---

## Performance Optimization Tips

### 1. Memoize Components
```typescript
import { memo } from 'react';

export const TeamManagement = memo(function TeamManagement({ projectId }) {
  // Component code
});
```

### 2. Debounce Search
```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((query: string) => handleSearch(query), 300),
  []
);
```

### 3. Lazy Load Components
```typescript
import { lazy, Suspense } from 'react';

const TeamManagement = lazy(() => import('@/components/TeamManagement'));

export function ProjectSettings() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamManagement projectId={1} />
    </Suspense>
  );
}
```

---

## Debugging Tips

### Backend Debugging
```python
# Print query
from django.db import connection
from django.test.utils import CaptureQueriesContext

with CaptureQueriesContext(connection) as ctx:
    members = ProjectMember.objects.filter(project_id=1)
    print(f"Queries: {len(ctx)}")
    for query in ctx:
        print(query['sql'])
```

### Frontend Debugging
```typescript
// Log API calls
import { projectsApi } from '@/api/projects';

const response = await projectsApi.getUsersDirectory(projectId);
console.log('Users:', response.data);

// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

---

## Common Issues & Solutions

### Issue: "Users directory returns empty"
**Solution:** Check that user is project admin
```python
# Verify admin status
member = ProjectMember.objects.get(project=project, user=user)
assert member.role == 'admin'
```

### Issue: "Notification not appearing"
**Solution:** Check notification type and fields
```python
# Verify notification created
notification = Notification.objects.get(user_id=2)
assert notification.type == 'project_invite'
assert notification.project_id is not None
assert notification.related_object_id is not None
```

### Issue: "Task assignment dropdown empty"
**Solution:** Ensure members accepted invitations
```python
# Check member status
members = ProjectMember.objects.filter(
    project_id=project_id,
    status='accepted'
)
assert members.count() > 0
```

---

## Quick Reference Table

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| TeamManagement | `TeamManagement.tsx` | `projectId` | Manage team members |
| NotificationBell | `NotificationBell.tsx` | `onInviteAccepted` | Show notifications |
| TaskAssignmentSelect | `TaskAssignmentSelect.tsx` | `projectId`, `value`, `onChange` | Assign tasks |

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects/{id}/users-directory/` | GET | Get users for inviting |
| `/api/projects/{id}/members/` | GET | Get project members |
| `/api/projects/{id}/invite/` | POST | Send invitation |
| `/api/projects/invites/{member_id}/accept/` | POST | Accept invitation |

---

**Last Updated:** January 2024
**Status:** Complete & Ready for Use
