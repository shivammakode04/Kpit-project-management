import { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, User, Shield, Search,
  Bell, Moon, Sun, Menu, X, LogOut, ChevronLeft, Keyboard, Users, Layers,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useThemeStore } from '@/store/themeStore';
import { cn, getInitials, timeAgo, getErrorMessage } from '@/lib/utils';
import { searchApi } from '@/api/search';
import { projectsApi } from '@/api/projects';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { SearchResults } from '@/types';

interface PageShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/my-tasks', label: 'My Tasks', icon: Layers },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
];

export default function PageShell({ children }: PageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();

  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { unreadCount, notifications, isOpen: notifOpen, togglePanel, closePanel, markRead, markAllRead, fetchNotifications, fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleAcceptInvite = async (memberId: number, notifId: number) => {
    try {
      await projectsApi.acceptInvite(memberId);
      toast.success('Invitation accepted!');
      markRead(notifId);
      closePanel();
      fetchNotifications();
      fetchUnreadCount();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-members'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Apply dark class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Poll notifications every 30s
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchNotifications]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/' && !searchOpen) { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); closePanel(); setShortcutsOpen(false); }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); navigate('/projects'); }
      if (e.key === '?') { e.preventDefault(); setShortcutsOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, closePanel, navigate]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 z-30"
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-surface-200 dark:border-surface-800">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FF</span>
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                  FlowForge
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost p-1.5 rounded-lg">
            <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS
            .filter(({ adminOnly }) => !adminOnly || user?.role === 'admin')
            .map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  active
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-surface-200 dark:border-surface-800">
          <button onClick={handleLogout} className={cn(
            'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl',
            'text-surface-600 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-danger transition-all duration-200',
          )}>
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-surface-900 border-r z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-surface-200 dark:border-surface-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">FF</span>
                  </div>
                  <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                    FlowForge
                  </span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 space-y-1">
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                      location.pathname.startsWith(path)
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden btn-ghost p-1.5">
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 transition-all w-48 md:w-64"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search...</span>
              <kbd className="hidden md:inline ml-auto text-xs bg-surface-200 dark:bg-surface-700 px-1.5 py-0.5 rounded">/</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShortcutsOpen(true)} className="btn-ghost p-2 rounded-xl hidden md:flex">
              <Keyboard className="w-4 h-4" />
            </button>
            <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button onClick={togglePanel} className="btn-ghost p-2 rounded-xl relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 md:w-96 glass-card shadow-xl overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                      <h3 className="font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={() => markAllRead()} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-surface-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => { if (!n.is_read) markRead(n.id); }}
                            className={cn(
                              'px-4 py-3 border-b border-surface-100 dark:border-surface-800 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors',
                              !n.is_read && 'bg-brand-50/50 dark:bg-brand-900/10',
                            )}
                          >
                            <p className="text-sm">{n.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-surface-500">{timeAgo(n.created_at)}</p>
                              {n.type === 'project_invite' && n.related_object_id && !n.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptInvite(n.related_object_id!, n.id);
                                  }}
                                  className="text-[10px] px-2 py-1 bg-brand-500 text-white rounded-md font-medium hover:bg-brand-600 transition-colors"
                                >
                                  Accept
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar */}
            <Link to="/profile" className="flex items-center gap-2 ml-1">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-200 dark:ring-surface-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-surface-200 dark:ring-surface-700">
                  {user ? getInitials(user.full_name || user.username) : '?'}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {shortcutsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShortcutsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="glass-card p-6 w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
                <div className="space-y-3">
                  {[
                    ['/', 'Open search'],
                    ['N', 'Go to projects'],
                    ['Esc', 'Close modal/panel'],
                    ['?', 'Show this help'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-surface-600 dark:text-surface-400">{desc}</span>
                      <kbd className="px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded text-xs font-mono">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchApi.search({ q: query });
        setResults(data);
      } catch { /* ignore */ }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!open) { setQuery(''); setResults(null); }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4"
      >
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 border-b border-surface-200 dark:border-surface-700">
            <Search className="w-5 h-5 text-surface-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, stories, tasks..."
              className="w-full py-4 bg-transparent outline-none text-surface-900 dark:text-surface-100 placeholder:text-surface-400"
            />
            <kbd className="text-xs bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">Esc</kbd>
          </div>

          {loading && <div className="p-4 text-center text-sm text-surface-500">Searching...</div>}

          {results && !loading && (
            <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
              {results.projects.length === 0 && results.stories.length === 0 && results.tasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-surface-500">No results found</div>
              ) : (
                <>
                  {results.projects.length > 0 && (
                    <div className="mb-2">
                      <p className="px-3 py-1 text-xs font-semibold text-surface-500 uppercase">Projects</p>
                      {results.projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { navigate(`/projects/${p.id}`); onClose(); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <p className="text-sm font-medium">{p.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.stories.length > 0 && (
                    <div className="mb-2">
                      <p className="px-3 py-1 text-xs font-semibold text-surface-500 uppercase">Stories</p>
                      {results.stories.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { navigate(`/stories/${s.id}`); onClose(); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-surface-500">{s.status} · {s.priority}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.tasks.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-surface-500 uppercase">Tasks</p>
                      {results.tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { navigate(`/stories/${t.story}`); onClose(); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-surface-500">{t.assigned_to_name || 'Unassigned'} · {t.status}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
