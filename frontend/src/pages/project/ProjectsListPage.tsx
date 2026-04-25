import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Search, Archive, ArchiveRestore, Users, Calendar, BarChart3 } from 'lucide-react';
import { useProjects, useArchiveProject } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import { Skeleton } from '@/components/ui/Skeleton';

const CARD_GRADIENTS = [
  'from-brand-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
            <p className="text-sm text-surface-500">{active.length} active project{active.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name..."
            className="input-field pl-10 py-2.5"
          />
        </div>
      </div>

      {/* Active Projects */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title={search ? 'No projects match your search' : 'No projects yet'}
          description={search ? 'Try a different search term' : 'Create your first project to get started'}
          action={
            !search ? (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> New Project
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {active.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover group relative overflow-hidden"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* Top gradient accent bar */}
              <div className={cn('h-1.5 bg-gradient-to-r', CARD_GRADIENTS[i % CARD_GRADIENTS.length])} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md bg-gradient-to-br',
                    CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                  )}>
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>
                  {(user?.role === 'admin') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveMutation.mutate(project.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 btn-ghost p-1.5 rounded-lg transition-all duration-200"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-semibold text-lg group-hover:text-brand-600 transition-colors line-clamp-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-surface-500 mt-1.5 line-clamp-2 leading-relaxed">{project.description}</p>
                )}

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-surface-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold">{project.progress_percentage ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress_percentage ?? 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 + 0.2 }}
                      className={cn('h-full rounded-full bg-gradient-to-r', CARD_GRADIENTS[i % CARD_GRADIENTS.length])}
                    />
                  </div>
                </div>

                {/* Footer meta */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-surface-100 dark:border-surface-800">
                  <span className="flex items-center gap-1.5 text-xs text-surface-400">
                    <Users className="w-3.5 h-3.5" />
                    {project.member_count}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-surface-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {timeAgo(project.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-surface-400 ml-auto">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      project.is_archived ? 'bg-surface-400' : 'bg-emerald-500',
                    )} />
                    {project.is_archived ? 'Archived' : 'Active'}
                  </span>
                </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
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
