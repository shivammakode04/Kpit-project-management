import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';
import { TaskAssignmentSelect } from '@/components/TaskAssignmentSelect';
import { projectsApi } from '@/api/projects';
import type { User } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  storyId: number;
  projectId?: number;
  members?: User[];
}

export default function CreateTaskModal({ open, onClose, storyId, projectId, members = [] }: CreateTaskModalProps) {
  const { mutateAsync, isPending } = useCreateTask(storyId);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const onSubmit = async (data: FormValues) => {
    await mutateAsync({
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigned_to: assignedTo,
      due_date: data.due_date || null,
    });
    setAssignedTo(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">New Task</h2>
                <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Title *</label>
                  <input {...register('title')} className="input-field" placeholder="Task title" />
                  {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Task details..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Priority</label>
                    <select {...register('priority')} className="input-field">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Due Date</label>
                    <input type="date" {...register('due_date')} className="input-field" />
                  </div>
                </div>
                {projectId && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Assign To</label>
                    <TaskAssignmentSelect
                      projectId={projectId}
                      value={assignedTo}
                      onChange={setAssignedTo}
                    />
                  </div>
                )}
                {!projectId && members.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Assign To</label>
                    <select value={assignedTo || ''} onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)} className="input-field">
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.full_name || m.username}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isPending} className="btn-primary flex-1">
                    {isPending ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
