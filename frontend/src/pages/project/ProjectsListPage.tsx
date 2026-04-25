import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Search, Archive, ArchiveRestore } from 'lucide-react';
import { useProjects, useArchiveProject } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProjectsListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data, isLoading } = useProjects();
  const archiveMutation = useArchiveProject();

  const projects = data?.results ?? [];
  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const active = filtered.filter((p) => !p.is_archived);
  const archived = filtered.filter((p) => p.is_archived);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Active Projects */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title={search ? 'No projects match your search' : 'No projects yet'}
          description={search ? 'Try a different search term' : 'Create your first project to get started'}
          action={
            !search ? (
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <Plus className="w-4 h-4" /> New Project
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 cursor-pointer hover:shadow-lg transition-all group relative"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {project.name[0].toUpperCase()}
                </div>
                {(user?.role === 'admin') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveMutation.mutate(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 rounded-lg transition-opacity"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="font-semibold group-hover:text-brand-600 transition-colors">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-surface-500 mt-1 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3 text-xs text-surface-400">
                <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{timeAgo(project.created_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Archived Section */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn('flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors')}
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Hide' : 'Show'} {archived.length} archived project{archived.length !== 1 ? 's' : ''}
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {archived.map((project) => (
                <div
                  key={project.id}
                  className="glass-card p-5 opacity-60 cursor-pointer hover:opacity-80 transition-opacity group relative"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-surface-300 dark:bg-surface-700 rounded-xl flex items-center justify-center text-surface-500 font-bold text-sm">
                      {project.name[0].toUpperCase()}
                    </div>
                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveMutation.mutate(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 rounded-lg"
                        title="Restore"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold line-through text-surface-500">{project.name}</h3>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
