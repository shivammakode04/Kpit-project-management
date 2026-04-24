import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isPending?: boolean;
}

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = 'Delete Item',
  description = 'This action cannot be undone. Are you sure you want to delete this item?',
  isPending = false,
}: ConfirmDeleteModalProps) {
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
            <div className="glass-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold">{title}</h2>
                  <p className="text-sm text-surface-500 mt-1">{description}</p>
                </div>
                <button onClick={onClose} className="btn-ghost p-1 rounded-lg shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isPending}
                  className="btn-danger flex-1"
                >
                  {isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
