import { useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import PageShell from '@/components/layout/PageShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProjectsListPage from '@/pages/project/ProjectsListPage';
import ProjectPage from '@/pages/project/ProjectPage';
import StoryViewPage from '@/pages/story/StoryViewPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import AdminPanel from '@/pages/admin/AdminPanel';
import MembersPage from '@/pages/project/MembersPage';
import MyTasksPage from '@/pages/tasks/MyTasksPage';
import TeamPage from '@/pages/team/TeamPage';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppShell({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}

function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { loadUser, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (isAuthenticated) loadUser();
  }, [isAuthenticated, loadUser]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppShell>
              <PageTransition><DashboardPage /></PageTransition>
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <PrivateRoute>
            <AppShell>
              <PageTransition><MyTasksPage /></PageTransition>
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <AppShell>
              <PageTransition><ProjectsListPage /></PageTransition>
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PrivateRoute>
            <AppShell>
              <PageTransition><ProjectPage /></PageTransition>
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id/members"
        element={
          <PrivateRoute>
            <AppShell>
              <PageTransition><MembersPage /></PageTransition>
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/stories/:id"
        element={
          <PrivateRoute>
            <AppShell>
              <PageTransition><StoryViewPage /></PageTransition>
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/team"
        element={
          <AdminRoute>
            <AppShell>
              <PageTransition><TeamPage /></PageTransition>
            </AppShell>
          </AdminRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <AppShell>
              <PageTransition><ProfilePage /></PageTransition>
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppShell>
              <PageTransition><AdminPanel /></PageTransition>
            </AppShell>
          </AdminRoute>
        }
      />

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
