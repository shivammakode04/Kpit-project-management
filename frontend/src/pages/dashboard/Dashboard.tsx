import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import type { Task } from '@/types';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    try {
      setLoading(true);
      const res = await tasksApi.getMyTasks();
      setTasks(res.data.results);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const groupTasksByDueDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue: Task[] = [];
    const dueSoon: Task[] = [];
    const later: Task[] = [];
    const noDueDate: Task[] = [];

    tasks.forEach((task) => {
      if (!task.due_date) {
        noDueDate.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue < 0) {
        overdue.push(task);
      } else if (daysUntilDue <= 3) {
        dueSoon.push(task);
      } else {
        later.push(task);
      }
    });

    return { overdue, dueSoon, later, noDueDate };
  };

  const { overdue, dueSoon, later, noDueDate } = groupTasksByDueDate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <p className="text-xs text-gray-500 mt-1">{task.story_title}</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              {task.due_date && (
                <span className="text-xs text-gray-600">
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusIcon(task.status)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TaskSection = ({ title, tasks: sectionTasks, icon: Icon, color }: any) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary">{sectionTasks.length}</Badge>
      </div>
      <ScrollArea className="h-[300px] rounded-lg border p-4">
        {sectionTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No tasks</p>
        ) : (
          <div className="space-y-3">
            {sectionTasks.map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your tasks across all projects</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No tasks assigned to you yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TaskSection
            title="Overdue"
            tasks={overdue}
            icon={AlertCircle}
            color="text-red-600"
          />
          <TaskSection
            title="Due Soon (Next 3 Days)"
            tasks={dueSoon}
            icon={Clock}
            color="text-amber-600"
          />
          <TaskSection
            title="Later"
            tasks={later}
            icon={CheckCircle2}
            color="text-blue-600"
          />
          {noDueDate.length > 0 && (
            <div className="lg:col-span-3">
              <TaskSection
                title="No Due Date"
                tasks={noDueDate}
                icon={AlertCircle}
                color="text-gray-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
