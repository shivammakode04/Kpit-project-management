# 🚀 QUICK REFERENCE CARD

## Start Server
```bash
cd backend
python manage.py runserver
```

## Admin Panel
**URL**: http://localhost:8000/admin/

## Create Superuser
```bash
python manage.py createsuperuser
```

## Create Test Users
```bash
python manage.py create_test_users
```
Creates: admin_user, member1, member2, viewer1 (password: password123)

---

## 📍 Key Admin Sections

| Section | URL | What You Can Do |
|---------|-----|-----------------|
| Users | `/admin/users/customuser/` | Manage users, assign roles |
| Teams | `/admin/teams/team/` | Create teams, add members |
| Invitations | `/admin/teams/teaminvitation/` | Track invitations |
| Projects | `/admin/projects/project/` | Manage projects |
| Tasks | `/admin/tasks/task/` | Assign to multiple users |
| Stories | `/admin/stories/userstory/` | Manage user stories |
| Notifications | `/admin/notifications/notification/` | View notifications |

---

## 🔑 Key API Endpoints

### Teams
```
GET    /api/teams/                      List teams
POST   /api/teams/                      Create team
GET    /api/teams/{id}/all_users/       Get all users
POST   /api/teams/{id}/invite/          Invite user
```

### Invitations
```
GET    /api/invitations/                List invitations
POST   /api/invitations/{id}/accept/    Accept
POST   /api/invitations/{id}/reject/    Reject
```

### Tasks
```
POST   /api/tasks/{id}/assign/          Assign to multiple
GET    /api/tasks/my-tasks/             Get my tasks
```

---

## 💡 Quick Actions

### Invite User to Team
1. Go to Teams in admin
2. Click team name
3. Use API: `POST /api/teams/{id}/invite/` with `{"user_id": 2}`

### Assign Task to Multiple Users
1. Go to Tasks in admin
2. Select task
3. In "Assigned to" field, select multiple users
4. Or use API: `POST /api/tasks/{id}/assign/` with `{"assigned_to": [1,2,3]}`

### Accept Invitation
1. User logs in
2. Checks notifications
3. Uses API: `POST /api/invitations/{id}/accept/`

---

## 🎯 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to everything |
| **Member** | Create/edit tasks, assign to team |
| **Viewer** | Read-only access |

---

## 📱 Test Flow

1. **Create superuser** → Access admin panel
2. **Create users** → Different roles
3. **Create team** → Add owner
4. **Invite users** → Send invitations
5. **Accept invites** → Users join team
6. **Create project** → Add members
7. **Create story** → Link to project
8. **Create task** → Assign to multiple users
9. **Check "My Tasks"** → Users see their tasks

---

## ⚡ Common Commands

```bash
# Check system
python manage.py check

# Show migrations
python manage.py showmigrations

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Create test users
python manage.py create_test_users

# Run server
python manage.py runserver
```

---

## 🔍 Troubleshooting

**Can't login to admin?**
→ Create superuser: `python manage.py createsuperuser`

**Team members not showing in task assignment?**
→ Ensure users accepted team invitation

**API returns 401?**
→ Include Authorization header: `Bearer <token>`

**Warning about requests library?**
→ Ignore it, doesn't affect functionality

---

## 📖 Documentation

- `ADMIN_GUIDE.md` - Full admin panel guide
- `SETUP_GUIDE.md` - Setup instructions
- `API_TESTING.md` - API examples
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `PROJECT_STATUS.md` - Current status

---

## ✅ Status

**ALL FEATURES WORKING**
- ✅ Admin panel configured
- ✅ Team management ready
- ✅ Multi-user task assignment ready
- ✅ Invitation system ready
- ✅ Notifications working
- ✅ All APIs functional

**Ready to use!** 🎉
