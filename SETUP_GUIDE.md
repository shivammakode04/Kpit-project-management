# Quick Setup Commands

## 1. Create Superuser (Admin Panel Access)
```bash
cd backend
python manage.py createsuperuser
```

## 2. Create Test Users (Optional)
```bash
python manage.py create_test_users
```
This creates:
- admin_user (password: password123)
- member1 (password: password123)
- member2 (password: password123)
- viewer1 (password: password123)

## 3. Run Server
```bash
python manage.py runserver
```

## 4. Access Admin Panel
Open browser: http://localhost:8000/admin/
Login with superuser credentials

## 5. Test Team Management

### Via Admin Panel:
1. Go to Teams section
2. Click "Add Team"
3. Create a team and add members
4. Go to Team Invitations to manage invites

### Via API:
```bash
# Login first to get token
POST http://localhost:8000/api/auth/login/
{
  "username": "your_username",
  "password": "your_password"
}

# Create Team
POST http://localhost:8000/api/teams/
Headers: Authorization: Bearer <your_token>
{
  "name": "Development Team"
}

# Get all users (for inviting)
GET http://localhost:8000/api/teams/{team_id}/all_users/

# Invite user to team
POST http://localhost:8000/api/teams/{team_id}/invite/
{
  "user_id": 2
}

# Accept invitation (as invited user)
POST http://localhost:8000/api/invitations/{invitation_id}/accept/
```

## 6. Test Task Assignment

```bash
# Assign task to multiple users
POST http://localhost:8000/api/tasks/{task_id}/assign/
{
  "assigned_to": [1, 2, 3]
}

# Get my tasks
GET http://localhost:8000/api/tasks/my-tasks/
```

## Admin Panel Features

### Users Management
- Path: /admin/users/customuser/
- Manage all users, roles, and permissions

### Teams Management
- Path: /admin/teams/team/
- Create teams, add members
- View team statistics

### Team Invitations
- Path: /admin/teams/teaminvitation/
- Monitor all invitations
- See pending/accepted/rejected status

### Tasks Management
- Path: /admin/tasks/task/
- Assign tasks to multiple users
- Filter by status, priority
- View all assignees

### Projects Management
- Path: /admin/projects/project/
- Manage projects and members
- Set member roles and status

### Notifications
- Path: /admin/notifications/notification/
- View all system notifications
- Monitor invitation notifications

## Key Features Summary

✅ Django Admin Panel fully configured
✅ User role management (Admin, Member, Viewer)
✅ Team creation and management
✅ User invitation system with notifications
✅ Multi-user task assignment
✅ My Tasks view for each user
✅ All Users section for team invites
✅ My Team section showing team members
✅ Task assignment only to team members
✅ Story and task tracking per user
✅ Update task details functionality

## Database Schema

- **users**: CustomUser with roles
- **teams**: Team model with owner and members
- **team_invitations**: Invitation tracking
- **tasks**: Updated with ManyToMany assigned_to
- **projects**: Project with members
- **stories**: User stories
- **notifications**: System notifications

All migrations have been applied successfully!
