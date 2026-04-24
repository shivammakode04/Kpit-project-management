import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCreateStory } from '@/hooks/useStories';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
});
type FormValues = z.infer<typeof schema>;

interface CreateStoryModalProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
}

export default function CreateStoryModal({ open, onClose, projectId }: CreateStoryModalProps) {
  const { mutateAsync, isPending } = useCreateStory(projectId);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const onSubmit = async (data: FormValues) => {
    await mutateAsync(data);
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
                <h2 className="text-lg font-bold">New Story</h2>
                <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Title *</label>
                  <input {...register('title')} className="input-field" placeholder="As a user, I want to..." />
                  {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Acceptance criteria, details..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Priority</label>
                  <select {...register('priority')} className="input-field">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isPending} className="btn-primary flex-1">
                    {isPending ? 'Creating...' : 'Create Story'}
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
