# FlowForge — Agile Project Management SaaS

A production-grade Agile project management tool inspired by Jira, Linear, and Notion.  
Built with React 18, Vite, TypeScript (strict), Tailwind CSS, and a Django REST Framework backend.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 + |
| npm | 9 + |
| Django backend | Running at `http://localhost:8000` |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Start development server
npm run dev
# → http://localhost:5173
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the Django backend |

The Vite dev server proxies all `/api` calls to `VITE_API_BASE_URL`, so CORS is never an issue in development.

---

## Project Structure

```
src/
├── api/            # Axios API layer — all HTTP calls live here
│   ├── client.ts   # Axios instance with JWT interceptors
│   ├── auth.ts     # Auth endpoints
│   ├── projects.ts # Project CRUD, members, activity, export
│   ├── stories.ts  # User story CRUD
│   ├── tasks.ts    # Task CRUD, comments, attachments
│   ├── notifications.ts
│   ├── search.ts   # Global search + background jobs
│   └── reports.ts  # Export (CSV/PDF)
│
├── components/
│   ├── common/     # PriorityBadge, StatusChip, Avatar, EmptyState
│   ├── kanban/     # KanbanBoard with dnd-kit drag & drop
│   ├── layout/     # PageShell (sidebar + topbar + content)
│   ├── modals/     # CreateProject/Story/Task, ConfirmDelete
│   └── ui/         # Skeleton variants
│
├── hooks/          # TanStack Query hooks (useProjects, useTasks, …)
├── pages/          # Auth, Dashboard, Project, Story, Profile, Admin
├── store/          # Zustand stores (auth, notifications, theme)
├── types/          # Shared TypeScript interfaces
└── lib/
    └── utils.ts    # cn(), getInitials(), timeAgo(), etc.
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/login` | JWT authentication |
| `/register` | New account creation |
| `/dashboard` | Overview: projects, activity feed, metrics |
| `/projects` | Project list with search and archive |
| `/projects/:id` | Kanban board with story panel and filters |
| `/stories/:id` | Story detail: tasks, comments, attachments |
| `/profile` | Avatar upload, profile edit, change password |
| `/admin` | Users, projects, background jobs (admin only) |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus global search |
| `Esc` | Close any open modal or dropdown |
| `?` | Open keyboard shortcuts help |
| `N` | Navigate to Projects list |
| `Cmd+K` / `Ctrl+K` | Focus global search (alternative) |

---

## Key Design Decisions

### Authentication
- JWT tokens stored in Zustand (in-memory, not localStorage)  
- Refresh token stored in `localStorage`  
- Axios interceptors auto-refresh on 401 and retry the original request

### State Management
- **Global state** (auth, notifications, theme): Zustand  
- **Server state** (projects, tasks, stories): TanStack Query v5  
- No prop drilling — all shared state via stores or query cache

### Real-time Updates
- Notifications polled every **30 seconds** via `setInterval` in a Zustand store  
- Kanban board refetched every **60 seconds** via TanStack Query `refetchInterval`  
- No WebSocket required

### Optimistic Updates
- Drag-and-drop status changes update the local cache immediately  
- Reverts automatically on API error with a toast notification

### Role-Based Access
| Role | Permissions |
|------|------------|
| `admin` | Full access: create, edit, delete, archive, manage members |
| `editor` | Create and edit tasks/stories |
| `viewer` | Read-only access |

### Dark Mode
- Tailwind `darkMode: 'class'` — toggled by adding/removing `dark` on `<html>`  
- Preference persisted in `localStorage`  
- Defaults to system `prefers-color-scheme`

---

## Future Improvements

1. **WebSocket support** — real-time collaborative editing
2. **Sprint planning view** — backlog + sprint board
3. **Burndown charts** — velocity tracking
4. **GitHub/GitLab integration** — link commits to tasks
5. **Offline support** — service worker + IndexedDB cache
6. **Mobile app** — React Native with shared API layer
7. **Email notifications** — digest emails via backend
8. **Advanced search** — full-text search with Elasticsearch
