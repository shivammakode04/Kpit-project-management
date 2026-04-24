# Admin Panel & Team Management Guide

## Overview
This Django project now includes a comprehensive admin panel with team management, user roles, and multi-user task assignment capabilities.

## Features Implemented

### 1. Django Admin Panel
Access the admin panel at: `http://localhost:8000/admin/`

**Superuser can manage:**
- All users and their roles (Admin, Member, Viewer)
- Projects and project members
- Teams and team invitations
- User stories
- Tasks with multiple assignees
- Comments and attachments
- Activity logs
- Notifications

### 2. Team Management System

#### Team Structure
- **Owner**: User who creates the team
- **Members**: Users who accept team invitations

#### Team Features

**All Users Section:**
- View all users in the database
- Search and filter users
- Invite users to your team

**My Team Section:**
- View all members in your team
- See team member details
- Remove members (owner only)

**Invitation System:**
- Send invitations to users
- Users receive notifications
- Accept/Reject invitations
- Automatic team membership on acceptance

### 3. Task Assignment

**Multi-User Assignment:**
- Assign tasks to multiple team members
- Only team members visible in assignment dropdown
- View all assigned users on task details

**User Task View:**
- Users can see their assigned tasks
- Filter by status, priority
- Update task details
- View stories related to tasks

## API Endpoints

### Team Management
```
GET    /api/teams/                    - List user's teams
POST   /api/teams/                    - Create new team
GET    /api/teams/{id}/               - Get team details
PUT    /api/teams/{id}/               - Update team
DELETE /api/teams/{id}/               - Delete team
GET    /api/teams/{id}/all_users/     - Get all users (for inviting)
POST   /api/teams/{id}/invite/        - Invite user to team
```

### Team Invitations
```
GET    /api/invitations/              - List pending invitations
POST   /api/invitations/{id}/accept/  - Accept invitation
POST   /api/invitations/{id}/reject/  - Reject invitation
```

### Task Assignment
```
POST   /api/tasks/{id}/assign/        - Assign task to multiple users
Body: {"assigned_to": [user_id1, user_id2, ...]}
```

## Admin Panel Configuration

### User Management
- **List Display**: username, email, full_name, role, is_staff, created_at
- **Filters**: role, is_staff, is_superuser, created_at
- **Search**: username, email, full_name

### Team Management
- **List Display**: name, owner, member_count, created_at
- **Search**: name, owner username
- **Inline Members**: Add/remove members directly

### Task Management
- **List Display**: title, story, status, priority, assignees, due_date
- **Filters**: status, priority, created_at
- **Multi-select**: Assign to multiple users
- **Inline Comments**: View/add comments

### Project Management
- **List Display**: name, owner, is_archived, created_at
- **Inline Members**: Manage project members with roles

## User Roles

### Admin
- Full access to all features
- Can manage all projects and teams
- Can assign/unassign any user

### Member
- Can create and edit tasks
- Can assign tasks to team members
- Can comment and upload attachments

### Viewer
- Read-only access
- Can view projects and tasks
- Cannot modify anything

## How to Use

### Creating a Superuser
```bash
cd backend
python manage.py createsuperuser
```

### Creating a Team
1. Login to admin panel or use API
2. Navigate to Teams section
3. Click "Add Team"
4. Enter team name
5. Add members or send invitations

### Inviting Users to Team
1. Go to team detail page
2. Click "Invite User"
3. Search for user in "All Users" list
4. Click invite button
5. User receives notification
6. User accepts/rejects from their panel

### Assigning Tasks
1. Create or edit a task
2. In "Assigned to" field, select multiple users
3. Only team members appear in the list
4. Save task
5. All assigned users can see the task

### Viewing My Tasks
- Users can access `/api/tasks/my-tasks/` endpoint
- Shows all tasks assigned to the logged-in user
- Can filter by status and priority

## Database Models

### Team
- name: CharField
- owner: ForeignKey(User)
- members: ManyToManyField(User)
- created_at: DateTimeField

### TeamInvitation
- team: ForeignKey(Team)
- inviter: ForeignKey(User)
- invitee: ForeignKey(User)
- status: CharField (pending/accepted/rejected)
- created_at: DateTimeField

### Task (Updated)
- assigned_to: ManyToManyField(User) - Changed from ForeignKey
- All other fields remain the same

## Notifications

Users receive notifications for:
- Team invitations
- Invitation acceptance
- Task assignments
- Task updates
- Comments on their tasks

## Security

- All endpoints require authentication
- Role-based access control
- Project membership verification
- Team ownership validation
- Only team members can be assigned to tasks

## Next Steps

1. Create a superuser account
2. Login to admin panel
3. Create some users with different roles
4. Create teams and send invitations
5. Create projects and add members
6. Create stories and tasks
7. Assign tasks to multiple team members
8. Test the notification system

## Troubleshooting

**Issue**: Can't see team members in task assignment
**Solution**: Ensure users have accepted team invitation

**Issue**: User can't create tasks
**Solution**: Check user role (must be Member or Admin)

**Issue**: Notifications not appearing
**Solution**: Check notification model in admin panel

## Support

For issues or questions, check the Django admin logs or contact the development team.
