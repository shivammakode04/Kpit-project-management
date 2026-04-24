# Team Invitation & Notification Workflow Implementation

## Overview
This document describes the complete implementation of the Team Invitation & Notification Workflow for the FlowForge project management application.

## Backend Implementation

### 1. Database Models

#### Updated: Notification Model
```python
# apps/notifications/models.py
class Notification(models.Model):
    user = ForeignKey(CustomUser)
    type = CharField()  # 'project_invite', 'member_added', etc.
    message = TextField()
    is_read = BooleanField(default=False)
    project = ForeignKey(Project, null=True, blank=True)  # NEW
    related_object_id = IntegerField(null=True, blank=True)  # NEW
    created_at = DateTimeField(auto_now_add=True)
```

#### Existing: ProjectMember Model
```python
# apps/projects/models.py
class ProjectMember(models.Model):
    project = ForeignKey(Project)
    user = ForeignKey(CustomUser)
    role = CharField(choices=['admin', 'member', 'viewer'])
    status = CharField(choices=['pending', 'accepted'], default='pending')  # Already exists
    joined_at = DateTimeField(auto_now_add=True)
```

### 2. API Endpoints

#### GET `/api/projects/{id}/users-directory/`
Returns all users NOT in the project (for inviting).

**Query Parameters:**
- `q`: Search by username, email, or full_name

**Response:**
```json
[
  {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "avatar_url": "...",
    "role": "member"
  }
]
```

#### GET `/api/projects/{id}/members/`
Returns project members with filtering.

**Query Parameters:**
- `status`: Filter by 'pending' or 'accepted'

**Response:**
```json
[
  {
    "id": 1,
    "project": 1,
    "user": 2,
    "user_detail": { ... },
    "role": "member",
    "status": "pending",
    "joined_at": "2024-01-15T10:00:00Z"
  }
]
```

#### POST `/api/projects/{id}/invite/`
Send an invitation to a user.

**Request:**
```json
{
  "user_id": 2
}
```

**Response:**
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

**Side Effects:**
- Creates a Notification with type='project_invite'
- Notification includes project_id and related_object_id (member.id)

#### POST `/api/projects/invites/{member_id}/accept/`
Accept a project invitation.

**Response:**
```json
{
  "id": 1,
  "project": 1,
  "user": 2,
  "user_detail": { ... },
  "role": "member",
  "status": "accepted",
  "joined_at": "2024-01-15T10:00:00Z"
}
```

**Side Effects:**
- Changes ProjectMember.status to 'accepted'
- Marks related notification as read

### 3. Utility Functions

#### Updated: create_notification()
```python
def create_notification(user_id, notification_type, message, project_id=None, related_object_id=None):
    Notification.objects.create(
        user_id=user_id,
        type=notification_type,
        message=message,
        project_id=project_id,
        related_object_id=related_object_id,
    )
```

### 4. Migrations
```bash
python manage.py makemigrations notifications
python manage.py migrate
```

Creates:
- `notification.project` ForeignKey field
- `notification.related_object_id` IntegerField

## Frontend Implementation

### 1. Updated Types

```typescript
// src/types/index.ts
interface Notification {
  id: number;
  user: number;
  type: string;
  message: string;
  is_read: boolean;
  project?: number;           // NEW
  project_name?: string;      // NEW
  related_object_id?: number; // NEW
  created_at: string;
}
```

### 2. API Service Functions

```typescript
// src/api/projects.ts
export const projectsApi = {
  // NEW: Get all users not in project
  getUsersDirectory: (id: number, query?: string) =>
    api.get<User[]>(`/projects/${id}/users-directory/`, 
      { params: query ? { q: query } : {} }),

  // UPDATED: Get members with status filter
  getMembers: (id: number, status?: string) =>
    api.get<ProjectMember[]>(`/projects/${id}/members/`, 
      { params: status ? { status } : {} }),

  // NEW: Invite user
  inviteMember: (projectId: number, userId: number) =>
    api.post<ProjectMember>(`/projects/${projectId}/invite/`, 
      { user_id: userId }),

  // NEW: Accept invitation
  acceptInvite: (memberId: number) =>
    api.post<ProjectMember>(`/projects/invites/${memberId}/accept/`),
};
```

### 3. React Components

#### TeamManagement Component
**Location:** `src/components/TeamManagement.tsx`

**Features:**
- Two tabs: "All Users" and "My Team"
- Search functionality for finding users
- Send invite button for each user
- Display team members with status badges
- Real-time updates after invitations

**Usage:**
```tsx
<TeamManagement projectId={projectId} />
```

#### NotificationBell Component
**Location:** `src/components/NotificationBell.tsx`

**Features:**
- Bell icon with unread count badge
- Dropdown menu showing all notifications
- Accept/Decline buttons for project invites
- Auto-refresh every 30 seconds
- Callback on successful acceptance

**Usage:**
```tsx
<NotificationBell onInviteAccepted={() => reloadProjects()} />
```

#### TaskAssignmentSelect Component
**Location:** `src/components/TaskAssignmentSelect.tsx`

**Features:**
- Dropdown select for task assignment
- Only shows members with 'accepted' status
- Displays user avatar and name
- Unassigned option available

**Usage:**
```tsx
<TaskAssignmentSelect
  projectId={projectId}
  value={assignedUserId}
  onChange={(userId) => setAssignedUserId(userId)}
/>
```

### 4. Integration Points

#### In Project Settings/Admin Panel
```tsx
import { TeamManagement } from '@/components/TeamManagement';

export function ProjectSettings({ projectId }) {
  return (
    <div>
      <h2>Team Management</h2>
      <TeamManagement projectId={projectId} />
    </div>
  );
}
```

#### In Topbar/Header
```tsx
import { NotificationBell } from '@/components/NotificationBell';

export function Topbar() {
  return (
    <div className="flex items-center gap-4">
      <NotificationBell onInviteAccepted={() => {
        // Refresh projects list
        queryClient.invalidateQueries(['projects']);
      }} />
    </div>
  );
}
```

#### In Task Creation/Edit Modal
```tsx
import { TaskAssignmentSelect } from '@/components/TaskAssignmentSelect';

export function TaskModal({ projectId }) {
  const [assignedTo, setAssignedTo] = useState<number | null>(null);

  return (
    <div>
      <label>Assign To</label>
      <TaskAssignmentSelect
        projectId={projectId}
        value={assignedTo}
        onChange={setAssignedTo}
      />
    </div>
  );
}
```

## Workflow Diagram

```
1. Admin invites user
   ↓
2. POST /api/projects/{id}/invite/
   ├─ Creates ProjectMember (status='pending')
   └─ Creates Notification (type='project_invite')
   ↓
3. User sees notification in bell icon
   ↓
4. User clicks "Accept" button
   ↓
5. POST /api/projects/invites/{member_id}/accept/
   ├─ Updates ProjectMember (status='accepted')
   ├─ Marks Notification as read
   └─ Triggers onInviteAccepted callback
   ↓
6. User now appears in "My Team" tab
   ↓
7. User can be assigned to tasks
   ├─ Only accepted members shown in dropdown
   └─ Task assignment uses 1-to-1 FK relationship
```

## Key Features

### 1. Search & Discovery
- Search users by name, email, or username
- Real-time filtering
- Excludes already-invited users

### 2. Invitation Management
- Send invitations with one click
- Track pending vs accepted invitations
- Visual status indicators (badges)

### 3. Notification System
- Real-time notifications
- Accept/Decline actions
- Auto-refresh every 30 seconds
- Unread count badge

### 4. Task Assignment Constraints
- Only accepted members can be assigned
- 1-to-1 assignment (single user per task)
- Dropdown shows member avatars and names
- Unassigned option available

### 5. Status Tracking
- Pending: Amber badge
- Accepted: Green badge
- Role display: Secondary badge

## Database Schema

```
Notification
├── id (PK)
├── user_id (FK → CustomUser)
├── type (CharField)
├── message (TextField)
├── is_read (BooleanField)
├── project_id (FK → Project) [NEW]
├── related_object_id (IntegerField) [NEW]
└── created_at (DateTimeField)

ProjectMember
├── id (PK)
├── project_id (FK → Project)
├── user_id (FK → CustomUser)
├── role (CharField)
├── status (CharField) [pending/accepted]
└── joined_at (DateTimeField)
```

## Error Handling

### Backend
- 403: User not project admin
- 400: User already invited/member
- 404: User/project not found

### Frontend
- Toast notifications for errors
- Disabled buttons during loading
- Graceful fallbacks for missing data

## Performance Considerations

1. **Pagination**: Users directory supports pagination (future)
2. **Caching**: Notification list cached with 30s refresh
3. **Lazy Loading**: Members loaded on tab click
4. **Optimistic Updates**: UI updates before server confirmation

## Security

1. **Authentication**: All endpoints require login
2. **Authorization**: Only project admins can invite
3. **Validation**: User existence verified before invitation
4. **Constraints**: Unique constraint on (project, user) pair

## Testing Checklist

- [ ] Search users by name
- [ ] Search users by email
- [ ] Send invitation to user
- [ ] Receive notification
- [ ] Accept invitation
- [ ] User appears in "My Team"
- [ ] Assign task to accepted member only
- [ ] Unassigned option works
- [ ] Notification badge updates
- [ ] Status badges display correctly
- [ ] Error handling works

## Future Enhancements

1. Bulk invitations
2. Invitation expiration
3. Resend invitation option
4. Decline invitation with reason
5. Role assignment during invitation
6. Email notifications
7. Invitation history/audit log
