import { ChevronRight, Home, Folder, FileText, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  return (
    <nav className={cn("flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400", className)}>
      <Link
        to="/dashboard"
        className="flex items-center space-x-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Dashboard</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link
              to={item.href}
              className={cn(
                "flex items-center space-x-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors",
                location.pathname === item.href && "text-gray-900 dark:text-gray-200 font-medium"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-200 font-medium">
              {item.icon}
              <span>{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export function useProjectBreadcrumbs(projectId: number) {
  const location = useLocation();
  
  const items: BreadcrumbItem[] = [
    {
      label: 'Projects',
      href: '/projects',
      icon: <Folder className="w-4 h-4" />
    }
  ];

  if (location.pathname.includes('/projects/')) {
    // Add project-specific breadcrumbs
    if (location.pathname.includes('/dashboard')) {
      items.push({
        label: 'Project Dashboard',
        href: `/projects/${projectId}/dashboard`,
        icon: <Target className="w-4 h-4" />
      });
    } else if (location.pathname.includes('/members')) {
      items.push({
        label: 'Team Members',
        href: `/projects/${projectId}/members`,
        icon: <Target className="w-4 h-4" />
      });
    } else if (location.pathname.includes('/stories/')) {
      const storyId = location.pathname.split('/').pop();
      items.push({
        label: 'Stories',
        href: `/projects/${projectId}/stories`,
        icon: <FileText className="w-4 h-4" />
      });
      if (storyId && storyId !== 'stories') {
        items.push({
          label: `Story #${storyId}`,
          icon: <FileText className="w-4 h-4" />
        });
      }
    } else if (location.pathname.includes('/tasks/')) {
      const taskId = location.pathname.split('/').pop();
      items.push({
        label: 'Tasks',
        href: `/projects/${projectId}/tasks`,
        icon: <Target className="w-4 h-4" />
      });
      if (taskId && taskId !== 'tasks') {
        items.push({
          label: `Task #${taskId}`,
          icon: <Target className="w-4 h-4" />
        });
      }
    } else {
      items.push({
        label: 'Board',
        href: `/projects/${projectId}`,
        icon: <Target className="w-4 h-4" />
      });
    }
  }

  return { items };
}
