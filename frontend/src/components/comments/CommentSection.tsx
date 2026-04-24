import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Reply, Trash2, Edit, MoreVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/api/comments';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@/types';

interface CommentSectionProps {
  taskId: number;
  className?: string;
}

export function CommentSection({ taskId, className }: CommentSectionProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [isReplying, setIsReplying] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => (await commentsApi.list(taskId)).data.results,
    enabled: !!taskId,
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      return (await commentsApi.create(taskId, content)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      return (await commentsApi.update(commentId, content)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      setEditingComment(null);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => {
      return (await commentsApi.delete(commentId)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const handleReply = (commentId: number) => {
    setIsReplying(commentId);
  };

  const handleEdit = (commentId: number) => {
    setEditingComment(commentId);
    setIsReplying(null);
  };

  const handleDelete = (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment.mutate(commentId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-800">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({comments?.length || 0})
          </h3>

          {/* Comment Form */}
          <div className="mb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const content = formData.get('content') as string;
                if (content?.trim()) {
                  createComment.mutate(content);
                  e.currentTarget.reset();
                }
              }}
              className="space-y-4"
            >
              <textarea
                name="content"
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={createComment.isPending}
                className="btn-primary w-full"
              >
                {createComment.isPending ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            <AnimatePresence>
              {comments?.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.user_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {comment.user === user?.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(comment.id)}
                              className="btn-ghost p-1"
                              title="Edit comment"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="btn-ghost p-1 text-danger"
                              title="Delete comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {editingComment === comment.id ? (
                          <textarea
                            defaultValue={comment.content}
                            rows={3}
                            className="w-full px-2 py-1 border border-surface-200 dark:border-surface-700 rounded bg-white dark:bg-surface-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
