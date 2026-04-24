# Core Features Implementation Guide

## Overview
This document covers the implementation of 5 core features for FlowForge:
1. 24-Hour Deadline Notification (Backend Async)
2. My Dashboard Landing Page
3. Drag & Drop Kanban Board
4. Color-Coded Priority Badges
5. Aesthetic Profile Page

---

## Feature 1: 24-Hour Deadline Notification (Backend)

### Implementation Details

**File:** `backend/apps/jobs/tasks.py`

The `deadline_reminder()` function:
- Runs every hour via APScheduler
- Queries tasks where `due_date = tomorrow` AND `status != 'done'` AND `assigned_to != null`
- Creates a Notification for each task's assignee
- Message format: `"Reminder: Task '{task.title}' is due in 24 hours!"`
- Includes robust error handling with try-catch blocks
- Logs all operations for debugging

**Key Features:**
- ✅ Runs automatically when Django server starts
- ✅ Catches exceptions per task (doesn't fail entire job)
- ✅ Tracks job execution in BackgroundJob model
- ✅ Retries with exponential backoff on failure
- ✅ Logs all activities

**Setup:**
```bash
# Already configured in apps.py ready() method
# Scheduler starts automatically on server startup
python manage.py runserver
```

**Testing:**
```python
# Manual trigger in Django shell
from apps.jobs.scheduler import trigger_job
trigger_job('deadline_reminder')
```

---

## Feature 2: My Dashboard Landing Page

### Component: `Dashboard.tsx`

**Location:** `src/pages/dashboard/Dashboard.tsx`

**Features:**
- Fetches tasks assigned to logged-in user via `GET /api/tasks/my/`
- Groups tasks into 4 categories:
  - **Overdue**: due_date < today
  - **Due Soon**: due_date within next 3 days
  - **Later**: due_date > 3 days away
  - **No Due Date**: tasks without due_date

**UI Elements:**
- Task cards with title, story name, priority badge, due date
- Status icons (To Do, In Progress, Done)
- Color-coded priority badges
- Unread count badges for each section
- ScrollArea for long task lists
- Loading state

**Usage:**
```tsx
import { Dashboard } from '@/pages/dashboard/Dashboard';

// In your router
<Route path="/dashboard" element={<Dashboard />} />
```

**API Endpoint Required:**
```
GET /api/tasks/my/
Response: PaginatedResponse<Task>
```

---

## Feature 3: Drag & Drop Kanban Board

### Components:
1. **KanbanBoard.tsx** - Main container with DndContext
2. **KanbanColumn.tsx** - Droppable column
3. **KanbanCard.tsx** - Draggable task card

**Location:** `src/components/kanban/`

**Features:**
- Uses `@dnd-kit/core` for drag and drop
- Three columns: To Do, In Progress, Done
- Drag tasks between columns
- Optimistic UI updates
- Immediate PATCH request on drop
- Loading states during update
- Smooth animations

**Usage:**
```tsx
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

<KanbanBoard projectId={projectId} />
```

**API Endpoints Required:**
```
GET /projects/{id}/tasks/
PATCH /tasks/{id}/status/
```

**Dependencies:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Feature 4: Color-Coded Priority Badges

### Implementation in KanbanCard.tsx

**Priority Colors:**
- **High**: Red background (#dc2626) with Flame icon
- **Medium**: Amber background (#d97706) with Zap icon
- **Low**: Blue background (#2563eb) with AlertCircle icon

**Badge Component:**
```tsx
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return (
        <Badge className="bg-red-600 hover:bg-red-700 gap-1">
          <Flame className="h-3 w-3" />
          High
        </Badge>
      );
    // ... other cases
  }
};
```

**Features:**
- Icon + text display
- Hover effects
- Consistent styling across app
- Used in Dashboard and Kanban

---

## Feature 5: Aesthetic Profile Page

### Component: `Profile.tsx`

**Location:** `src/pages/profile/Profile.tsx`

**Sections:**

1. **Account Card**
   - User avatar
   - Full name and role badge
   - Username, email, join date
   - Icons for each field

2. **Edit Profile Card**
   - Full name input
   - Email input
   - Save button with loading state
   - Uses `authApi.updateProfile()`

3. **Stats Cards** (3 columns)
   - Tasks Completed: 42
   - Projects Contributed: 3
   - Streak: 12 days
   - Icons and trend indicators

4. **Charts**
   - **Bar Chart**: Task distribution (Completed, In Progress, Pending)
   - **Pie Chart**: Project contribution breakdown
   - Uses Recharts library

5. **Activity Timeline**
   - Recent actions
   - Project names
   - Timestamps
   - Dividers between items

**Dependencies:**
```bash
npm install recharts
```

**Usage:**
```tsx
import { Profile } from '@/pages/profile/Profile';

<Route path="/profile" element={<Profile />} />
```

---

## API Endpoints Summary

### Required Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks/my/` | Get user's assigned tasks |
| GET | `/projects/{id}/tasks/` | Get project tasks for Kanban |
| PATCH | `/tasks/{id}/status/` | Update task status |
| GET | `/auth/profile/` | Get user profile |
| PATCH | `/auth/profile/` | Update user profile |

### Backend Implementation Needed

If not already implemented, add these endpoints:

**GET /api/tasks/my/**
```python
class MyTasksView(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Task.objects.filter(
            assigned_to=self.request.user
        ).select_related('story', 'created_by')
```

**GET /projects/{id}/tasks/**
```python
class ProjectTasksView(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        project_id = self.kwargs['project_id']
        return Task.objects.filter(
            story__project_id=project_id
        ).select_related('story', 'assigned_to')
```

---

## Integration Checklist

### Backend
- [x] Scheduler configured in `apps.py`
- [x] `deadline_reminder()` implemented
- [x] Error handling with try-catch
- [x] Logging configured
- [ ] API endpoints implemented (if needed)
- [ ] Migrations applied

### Frontend
- [x] Dashboard component created
- [x] Kanban board components created
- [x] Profile page created
- [x] Priority badges implemented
- [ ] Install dnd-kit: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [ ] Install recharts: `npm install recharts`
- [ ] Add routes to router
- [ ] Test all features

---

## File Structure

```
backend/
├── apps/jobs/
│   ├── tasks.py (UPDATED)
│   ├── scheduler.py (EXISTING)
│   └── apps.py (EXISTING)

frontend/
├── src/
│   ├── pages/
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx (NEW)
│   │   └── profile/
│   │       └── Profile.tsx (NEW)
│   ├── components/
│   │   └── kanban/
│   │       ├── KanbanBoard.tsx (NEW)
│   │       ├── KanbanColumn.tsx (NEW)
│   │       └── KanbanCard.tsx (NEW)
│   └── api/
│       └── tasks.ts (UPDATED)
```

---

## Testing Guide

### Feature 1: Deadline Reminder
```bash
# In Django shell
from apps.jobs.scheduler import trigger_job
result = trigger_job('deadline_reminder')
print(result)  # Should show "Sent X deadline reminders"

# Check notifications created
from apps.notifications.models import Notification
Notification.objects.filter(type='deadline_reminder').count()
```

### Feature 2: Dashboard
1. Login as user with assigned tasks
2. Navigate to `/dashboard`
3. Verify tasks grouped correctly
4. Check priority badges display
5. Verify due dates calculated correctly

### Feature 3: Kanban Board
1. Navigate to project page
2. Drag task from "To Do" to "In Progress"
3. Verify API call made
4. Verify UI updates immediately
5. Refresh page to confirm persistence

### Feature 4: Priority Badges
1. Check Dashboard - badges visible
2. Check Kanban cards - badges with icons
3. Verify colors match specification
4. Test all three priority levels

### Feature 5: Profile Page
1. Navigate to `/profile`
2. Verify user data displays
3. Edit full name and save
4. Verify charts render
5. Check activity timeline

---

## Performance Considerations

1. **Dashboard**: Paginate tasks if user has 100+
2. **Kanban**: Use React.memo for KanbanCard
3. **Profile**: Cache user stats (could be computed)
4. **Scheduler**: Runs hourly, adjust if needed

---

## Future Enhancements

1. Add task filtering to Dashboard
2. Add task search to Kanban
3. Add team member avatars to Kanban cards
4. Add real activity log to Profile
5. Add export functionality
6. Add notifications for deadline reminders

---

## Troubleshooting

### Scheduler not running
- Check `apps.py` ready() method
- Verify APScheduler installed
- Check Django logs for errors

### Kanban drag not working
- Verify dnd-kit installed
- Check browser console for errors
- Ensure task IDs are unique

### Profile not updating
- Check auth API endpoint
- Verify user is authenticated
- Check network tab for errors

### Dashboard empty
- Verify user has assigned tasks
- Check API endpoint returns data
- Check browser console for errors

---

## Dependencies

### Backend
- APScheduler (already installed)
- Django 4.2
- DRF

### Frontend
- React 18+
- TypeScript
- Tailwind CSS
- shadcn/ui
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- recharts

---

## Support

For issues or questions, refer to:
1. Component code comments
2. API endpoint documentation
3. Django logs
4. Browser console
