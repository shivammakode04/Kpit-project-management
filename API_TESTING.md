# API Testing Examples

## Authentication

### 1. Login
```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "admin_user",
  "password": "password123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Save the access token for subsequent requests!**

---

## Team Management

### 2. Create Team
```http
POST http://localhost:8000/api/teams/
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "name": "Development Team"
}

Response:
{
  "id": 1,
  "name": "Development Team",
  "owner": {
    "id": 1,
    "username": "admin_user",
    "email": "admin@test.com"
  },
  "members": [],
  "member_count": 0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 3. List My Teams
```http
GET http://localhost:8000/api/teams/
Authorization: Bearer <your_access_token>

Response:
[
  {
    "id": 1,
    "name": "Development Team",
    "owner": {...},
    "members": [...],
    "member_count": 3,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 4. Get All Users (for inviting)
```http
GET http://localhost:8000/api/teams/1/all_users/
Authorization: Bearer <your_access_token>

Response:
[
  {
    "id": 2,
    "username": "member1",
    "email": "member1@test.com",
    "full_name": "Member One",
    "role": "member"
  },
  {
    "id": 3,
    "username": "member2",
    "email": "member2@test.com",
    "full_name": "Member Two",
    "role": "member"
  }
]
```

### 5. Invite User to Team
```http
POST http://localhost:8000/api/teams/1/invite/
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "user_id": 2
}

Response:
{
  "id": 1,
  "team": {
    "id": 1,
    "name": "Development Team"
  },
  "inviter": {
    "id": 1,
    "username": "admin_user"
  },
  "invitee": {
    "id": 2,
    "username": "member1"
  },
  "status": "pending",
  "created_at": "2024-01-15T10:35:00Z"
}
```

---

## Team Invitations

### 6. List My Pending Invitations
```http
GET http://localhost:8000/api/invitations/
Authorization: Bearer <your_access_token>

Response:
[
  {
    "id": 1,
    "team": {
      "id": 1,
      "name": "Development Team"
    },
    "inviter": {
      "id": 1,
      "username": "admin_user"
    },
    "invitee": {
      "id": 2,
      "username": "member1"
    },
    "status": "pending",
    "created_at": "2024-01-15T10:35:00Z"
  }
]
```

### 7. Accept Invitation
```http
POST http://localhost:8000/api/invitations/1/accept/
Authorization: Bearer <your_access_token>

Response:
{
  "status": "accepted"
}
```

### 8. Reject Invitation
```http
POST http://localhost:8000/api/invitations/1/reject/
Authorization: Bearer <your_access_token>

Response:
{
  "status": "rejected"
}
```

---

## Task Management

### 9. Assign Task to Multiple Users
```http
POST http://localhost:8000/api/tasks/5/assign/
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "assigned_to": [2, 3, 4]
}

Response:
{
  "id": 5,
  "title": "Implement login feature",
  "assigned_to": [2, 3, 4],
  "assigned_to_names": ["member1", "member2", "viewer1"],
  "status": "in_progress",
  "priority": "high"
}
```

### 10. Get My Tasks
```http
GET http://localhost:8000/api/tasks/my-tasks/
Authorization: Bearer <your_access_token>

Response:
[
  {
    "id": 5,
    "story": 2,
    "story_title": "User Authentication",
    "project_id": 1,
    "title": "Implement login feature",
    "description": "Create login page with JWT authentication",
    "status": "in_progress",
    "priority": "high",
    "assigned_to": [2, 3, 4],
    "assigned_to_names": ["member1", "member2", "viewer1"],
    "due_date": "2024-01-20",
    "created_by": 1,
    "created_by_name": "admin_user",
    "comment_count": 3,
    "attachment_count": 1,
    "created_at": "2024-01-15T09:00:00Z"
  }
]
```

### 11. Update Task Status
```http
PATCH http://localhost:8000/api/tasks/5/status/
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "status": "done"
}

Response:
{
  "id": 5,
  "title": "Implement login feature",
  "status": "done",
  ...
}
```

### 12. Create Task
```http
POST http://localhost:8000/api/stories/2/tasks/
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "title": "Write unit tests",
  "description": "Add test coverage for authentication",
  "status": "todo",
  "priority": "medium",
  "assigned_to": [2, 3],
  "due_date": "2024-01-25"
}

Response:
{
  "id": 6,
  "story": 2,
  "title": "Write unit tests",
  "assigned_to": [2, 3],
  "assigned_to_names": ["member1", "member2"],
  ...
}
```

---

## Notifications

### 13. Get My Notifications
```http
GET http://localhost:8000/api/notifications/
Authorization: Bearer <your_access_token>

Response:
[
  {
    "id": 1,
    "type": "team_invitation",
    "message": "admin_user invited you to join team \"Development Team\"",
    "is_read": false,
    "created_at": "2024-01-15T10:35:00Z"
  },
  {
    "id": 2,
    "type": "team_invitation_accepted",
    "message": "member1 accepted your team invitation",
    "is_read": false,
    "created_at": "2024-01-15T10:40:00Z"
  }
]
```

### 14. Mark Notification as Read
```http
PATCH http://localhost:8000/api/notifications/1/
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "is_read": true
}
```

---

## Testing Workflow

### Complete Flow Example:

1. **Admin creates team**
   - POST /api/teams/ with name

2. **Admin views all users**
   - GET /api/teams/{id}/all_users/

3. **Admin invites users**
   - POST /api/teams/{id}/invite/ with user_id

4. **User receives notification**
   - GET /api/notifications/

5. **User accepts invitation**
   - POST /api/invitations/{id}/accept/

6. **Admin creates project and story**
   - Use existing endpoints

7. **Admin creates task and assigns to team members**
   - POST /api/stories/{id}/tasks/
   - POST /api/tasks/{id}/assign/ with multiple user IDs

8. **Users view their tasks**
   - GET /api/tasks/my-tasks/

9. **Users update task status**
   - PATCH /api/tasks/{id}/status/

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "Members and admins only."
}
```

### 400 Bad Request
```json
{
  "detail": "Some users are not project members."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

---

## Tips

1. **Always include Authorization header** with Bearer token
2. **Save access token** after login
3. **Refresh token** when it expires using refresh endpoint
4. **Check notifications** after invitations
5. **Verify team membership** before assigning tasks
6. **Use correct Content-Type** (application/json)

---

## Postman Collection

Import these requests into Postman:
1. Create new collection "FlowForge API"
2. Add environment variable: `base_url = http://localhost:8000`
3. Add environment variable: `token = <your_access_token>`
4. Use `{{base_url}}` and `{{token}}` in requests
5. Set Authorization to "Bearer Token" with `{{token}}`

---

## cURL Examples

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_user","password":"password123"}'
```

### Create Team
```bash
curl -X POST http://localhost:8000/api/teams/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Development Team"}'
```

### Assign Task
```bash
curl -X POST http://localhost:8000/api/tasks/5/assign/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assigned_to":[2,3,4]}'
```

### Get My Tasks
```bash
curl -X GET http://localhost:8000/api/tasks/my-tasks/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```
