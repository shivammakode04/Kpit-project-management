import { useState, useEffect } from 'react';
import { TeamManagement } from '@/components/TeamManagement';
import { projectsApi } from '@/api/projects';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TeamPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await projectsApi.list();
      const userProjects = res.data.results;
      setProjects(userProjects);
      
      // Auto-select first project if available
      if (userProjects.length > 0) {
        setSelectedProjectId(userProjects[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-surface-500">No projects found</p>
        <p className="text-sm text-surface-400">Create a project first to manage team members</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Team Management
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Manage your project team members and send invitations
          </p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select
            value={selectedProject?.name || ''}
            onValueChange={(projectName) => {
              const project = projects.find(p => p.name === projectName);
              if (project) setSelectedProjectId(project.id);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.name}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedProject && (
        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-lg text-surface-900 dark:text-surface-100">
            {selectedProject.name}
          </h2>
          <p className="text-surface-600 dark:text-surface-400 text-sm mt-1">
            {selectedProject.description || 'No description provided'}
          </p>
        </div>
      )}
      
      {selectedProjectId && <TeamManagement projectId={selectedProjectId} />}
    </div>
  );
}