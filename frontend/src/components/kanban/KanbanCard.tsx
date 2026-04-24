import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, AlertCircle, Zap } from 'lucide-react';
import type { Task } from '@/types';

interface KanbanCardProps {
  task: Task;
  isUpdating?: boolean;
}

export function KanbanCard({ task, isUpdating }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge className="bg-red-600 hover:bg-red-700 gap-1">
            <Flame className="h-3 w-3" />
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 gap-1">
            <Zap className="h-3 w-3" />
            Medium
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 gap-1">
            <AlertCircle className="h-3 w-3" />
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className={`hover:shadow-lg transition-all ${isUpdating ? 'opacity-50' : ''}`}>
        <CardContent className="p-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <p className="text-xs text-gray-600">{task.story_title}</p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex-1">
                {getPriorityBadge(task.priority)}
              </div>
              {/* Show all assigned users */}
            {(task.assigned_to_details?.length || task.assigned_to_names?.length) > 0 && (
              <div className="flex -space-x-1">
                {(task.assigned_to_details || task.assigned_to_names?.map((name, index) => ({
                  id: index,
                  username: name,
                  full_name: name,
                  avatar_url: null
                })) || []).slice(0, 3).map((user) => (
                  <div 
                    key={user.id} 
                    title={user.full_name || user.username}
                    className="h-6 w-6 flex-shrink-0 ring-1 ring-white dark:ring-surface-900 inline-block"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(user.full_name || user.username)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))}
                {task.assigned_to_details && task.assigned_to_details.length > 3 && (
                  <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium ring-1 ring-white dark:ring-surface-900">
                    +{task.assigned_to_details.length - 3}
                  </div>
                )}
              </div>
            )}
            </div>

            {task.due_date && (
              <div className="text-xs text-gray-500 pt-1">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
