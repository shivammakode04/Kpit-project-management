import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCreateProject } from '@/hooks/useProjects';

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(1000).optional(),
});
type FormValues = z.infer<typeof schema>;

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const { mutateAsync, isPending } = useCreateProject();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
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
                <h2 className="text-lg font-bold">New Project</h2>
                <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Project Name *</label>
                  <input {...register('name')} className="input-field" placeholder="My awesome project" />
                  {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="What is this project about?" />
                  {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isPending} className="btn-primary flex-1">
                    {isPending ? 'Creating...' : 'Create Project'}
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
