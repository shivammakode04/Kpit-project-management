import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, AlertCircle, Plus, Activity, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { projectsApi } from '@/api/projects';
import { cn, timeAgo, getErrorMessage, triggerDownload } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ActivityLog } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 1],
    queryFn: async () => { const { data } = await projectsApi.list(1); return data; },
  });

  const { isLoading: tasksLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      if (!projectsData?.results.length) return 0;
      return projectsData.results.length;
    },
    enabled: !!projectsData,
  });

  // Load activity feed with pagination
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', activityPage],
    queryFn: async () => {
      if (!projectsData?.results.length) return { results: [], count: 0, next: null };
      const firstProject = projectsData.results[0];
      const { data } = await projectsApi.getActivity(firstProject.id, activityPage);
      return data;
    },
    enabled: !!projectsData?.results.length,
  });

  useEffect(() => {
    if (activityData?.results) {
      setAllActivity((prev) =>
        activityPage === 1 ? activityData.results : [...prev, ...activityData.results],
      );
    }
  }, [activityData, activityPage]);

  // Infinite scroll for activity
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && activityData?.next) {
          setActivityPage((p) => p + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activityData?.next]);

  const projects = projectsData?.results ?? [];
  const activeProjects = projects.filter((p) => !p.is_archived);
  const archivedProjects = projects.filter((p) => p.is_archived);

  const handleExport = async (projectId: number) => {
    try {
      const { data } = await projectsApi.exportCsv(projectId);
      triggerDownload(data as Blob, `project-${projectId}.csv`);
      toast.success('Export started');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Good {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.username} 👋
          </h1>
          <p className="text-surface-500 text-sm mt-1">Here's what's happening in your workspace</p>
        </div>
        <button onClick={() => setShowCreateProject(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<FolderKanban className="w-5 h-5" />}
          label="My Projects"
          value={projectsLoading ? '—' : String(activeProjects.length)}
          color="from-brand-500 to-brand-600"
          loading={projectsLoading}
        />
        <MetricCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="Open Tasks"
          value={tasksLoading ? '—' : '—'}
          color="from-blue-500 to-blue-600"
          loading={tasksLoading}
        />
        <MetricCard
          icon={<AlertCircle className="w-5 h-5" />}
          label="Overdue Tasks"
          value="—"
          color="from-red-500 to-red-600"
          loading={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold">Active Projects</h2>
          {projectsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : activeProjects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="w-6 h-6" />}
              title="No projects yet"
              description="Create your first project to get started"
              action={
                <button onClick={() => setShowCreateProject(true)} className="btn-primary">
                  <Plus className="w-4 h-4" /> New Project
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-brand-600 transition-colors truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-surface-500 mt-0.5 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-surface-400 ml-3 shrink-0">{timeAgo(project.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                    <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport(project.id); }}
                      className="ml-auto text-brand-600 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      Export CSV
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Archived Projects */}
          {archivedProjects.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 text-sm text-surface-500 cursor-pointer list-none hover:text-surface-700 transition-colors">
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                {archivedProjects.length} archived project{archivedProjects.length !== 1 ? 's' : ''}
              </summary>
              <div className="space-y-2 mt-3">
                {archivedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="glass-card p-3 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <p className="text-sm font-medium line-through">{p.name}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent Activity
          </h2>
          {activityLoading && activityPage === 1 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : allActivity.length === 0 ? (
            <EmptyState title="No activity yet" description="Activity will appear here as your team works" />
          ) : (
            <div className="space-y-3">
              {allActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <Avatar name={log.user_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">
                      <span className="font-medium">{log.user_name}</span>{' '}
                      <span className="text-surface-500">{log.action}</span>
                    </p>
                    <p className="text-[10px] text-surface-400 mt-0.5">{timeAgo(log.created_at)}</p>
                  </div>
                </div>
              ))}
              {/* Infinite scroll sentinel */}
              <div ref={loaderRef} className="h-4" />
              {activityLoading && activityPage > 1 && (
                <div className="text-center text-xs text-surface-400 py-2">Loading more...</div>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal open={showCreateProject} onClose={() => setShowCreateProject(false)} />
    </div>
  );
}

function MetricCard({
  icon, label, value, color, loading,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br', color)}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-surface-500 font-medium">{label}</p>
          {loading ? (
            <Skeleton className="h-6 w-12 mt-0.5" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
