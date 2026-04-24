# Quick Integration Guide

## Backend Setup

### 1. Run Migrations
```bash
cd backend
python manage.py makemigrations notifications
python manage.py migrate
```

### 2. Verify Endpoints
```bash
# Test users directory
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/projects/1/users-directory/?q=john

# Test members list
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/projects/1/members/?status=accepted

# Test invite
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2}' \
  http://localhost:8000/api/projects/1/invite/

# Test accept invite
curl -X POST -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/projects/invites/1/accept/
```

## Frontend Setup

### 1. Install Components (if needed)
```bash
cd frontend
npm install
```

### 2. Add Components to Your Project

Copy these files to your project:
- `src/components/TeamManagement.tsx`
- `src/components/NotificationBell.tsx`
- `src/components/TaskAssignmentSelect.tsx`

### 3. Update API Service
Replace `src/api/projects.ts` with the updated version that includes:
- `getUsersDirectory()`
- `inviteMember()`
- `acceptInvite()`

### 4. Update Types
Update `src/types/index.ts` to include new Notification fields:
- `project?: number`
- `project_name?: string`
- `related_object_id?: number`

## Integration Examples

### Example 1: Add Team Management to Project Settings

```tsx
// src/pages/project/ProjectSettings.tsx
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

### Example 2: Add Notification Bell to Topbar

```tsx
// src/components/layout/Topbar.tsx
import { NotificationBell } from '@/components/NotificationBell';
import { useQueryClient } from '@tanstack/react-query';

export function Topbar() {
  const queryClient = useQueryClient();

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h1>FlowForge</h1>
      <div className="flex items-center gap-4">
        <NotificationBell 
          onInviteAccepted={() => {
            // Refresh projects when user accepts invite
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }}
        />
      </div>
    </div>
  );
}
```

### Example 3: Use Task Assignment Select

```tsx
// src/components/modals/CreateTaskModal.tsx
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

## API Response Examples

### GET /api/projects/1/users-directory/?q=john
```json
[
  {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "role": "member",
    "created_at": "2024-01-10T10:00:00Z"
  }
]
```

### GET /api/projects/1/members/?status=accepted
```json
[
  {
    "id": 1,
    "project": 1,
    "user": 2,
    "user_detail": {
      "id": 2,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "role": "member",
      "created_at": "2024-01-10T10:00:00Z"
    },
    "role": "member",
    "status": "accepted",
    "joined_at": "2024-01-15T10:00:00Z"
  }
]
```

### POST /api/projects/1/invite/
Request:
```json
{
  "user_id": 2
}
```

Response:
```json
{
  "id": 1,
  "project": 1,
  "user": 2,
  "user_detail": { ... },
  "role": "member",
  "status": "pending",
  "joined_at": "2024-01-15T10:00:00Z"
}
```

### GET /api/notifications/
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "type": "project_invite",
      "message": "You have been invited to join Project \"Website Redesign\"",
      "is_read": false,
      "project": 1,
      "project_name": "Website Redesign",
      "related_object_id": 5,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

## Component Props

### TeamManagement
```typescript
interface TeamManagementProps {
  projectId: number;
}
```

### NotificationBell
```typescript
interface NotificationBellProps {
  onInviteAccepted?: () => void;
}
```

### TaskAssignmentSelect
```typescript
interface TaskAssignmentSelectProps {
  projectId: number;
  value?: number | null;
  onChange: (userId: number | null) => void;
  disabled?: boolean;
}
```

## Troubleshooting

### Issue: "Users directory returns empty"
**Solution**: Ensure user is project admin. Only admins can view users directory.

### Issue: "Invite button disabled after click"
**Solution**: This is expected. Button shows "Invited" state. Reload to see updated list.

### Issue: "Notification not appearing"
**Solution**: Check that notification type is 'project_invite' and related_object_id is set.

### Issue: "Task assignment dropdown empty"
**Solution**: Ensure members have accepted their invitations (status='accepted').

## Database Verification

Check if migrations applied correctly:
```bash
python manage.py showmigrations notifications
```

Should show:
```
notifications
 [X] 0001_initial
 [X] 0002_initial
 [X] 0003_notification_project_notification_related_object_id
```

## Performance Tips

1. **Pagination**: Add pagination to users directory for large user bases
2. **Caching**: Cache accepted members list for 5 minutes
3. **Lazy Loading**: Load notifications only when bell is clicked
4. **Debouncing**: Debounce search input to reduce API calls

## Security Checklist

- [x] Only project admins can invite users
- [x] Users can only accept their own invitations
- [x] Unique constraint prevents duplicate invitations
- [x] Notifications are user-specific
- [x] Task assignment restricted to accepted members

## Next Steps

1. Test all endpoints with Postman/cURL
2. Integrate components into your UI
3. Test the complete workflow
4. Add error handling as needed
5. Customize styling to match your design
6. Add analytics/logging if needed

## Support

For issues or questions:
1. Check TEAM_INVITATION_WORKFLOW.md for detailed docs
2. Review component code comments
3. Check API response examples above
4. Verify database migrations applied
