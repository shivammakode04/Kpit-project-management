import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { projectsApi } from '@/api/projects';
import type { User } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedMember {
  user_detail: User;
  role?: string;
}

interface TaskAssignmentSelectProps {
  projectId?: number;
  preloadedMembers?: User[];
  value?: number[];
  onChange: (userIds: number[]) => void;
}

export function TaskAssignmentSelect({
  projectId,
  preloadedMembers,
  value = [],
  onChange,
}: TaskAssignmentSelectProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<UnifiedMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadMembers();
    } else if (preloadedMembers) {
      setMembers(preloadedMembers.map(u => ({ user_detail: u })));
    }
  }, [projectId, preloadedMembers]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await projectsApi.getMembers(projectId!, 'accepted');
      setMembers(res.data);
    } catch (error) {
      console.error('Failed to load members', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.user_detail.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.user_detail.username.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMembers = members.filter((m) => value.includes(m.user_detail.id));

  const toggleMember = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={(e) => { e.preventDefault(); setOpen(!open); }}
        className="w-full justify-start text-left h-auto min-h-[44px] py-2 px-3 border-surface-200 dark:border-surface-700 hover:border-brand-400 dark:hover:border-brand-500 transition-colors bg-white dark:bg-surface-800"
        type="button"
      >
        {selectedMembers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedMembers.map((m) => (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={m.user_detail.id} 
                className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50 px-2 py-1 rounded-md text-xs font-medium"
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src={m.user_detail.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {m.user_detail.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{m.user_detail.full_name || m.user_detail.username}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <span className="text-surface-500 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Select assignees...
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-800 rounded-xl shadow-xl z-50 border border-surface-200 dark:border-surface-700 overflow-hidden"
            >
              <div className="p-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <Input
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 text-sm bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700"
                />
              </div>

              <ScrollArea className="h-56">
                {loading ? (
                  <div className="p-6 flex flex-col items-center justify-center text-sm text-surface-500 space-y-2">
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-6 text-center text-sm text-surface-500">
                    No members found
                  </div>
                ) : (
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onChange([]);
                        setOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors text-surface-500 font-medium"
                    >
                      Unassigned (Clear all)
                    </button>
                    {filteredMembers.map((member) => {
                      const isSelected = value.includes(member.user_detail.id);
                      return (
                        <button
                          type="button"
                          key={member.user_detail.id}
                          onClick={(e) => toggleMember(e, member.user_detail.id)}
                          className={cn(
                            'w-full px-3 py-2.5 text-left text-sm rounded-lg flex items-center gap-3 transition-colors group',
                            isSelected 
                              ? 'bg-brand-50 dark:bg-brand-900/20' 
                              : 'hover:bg-surface-100 dark:hover:bg-surface-700/50'
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200",
                            isSelected 
                              ? "bg-brand-500 border-brand-500 text-white scale-105" 
                              : "border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 group-hover:border-brand-400"
                          )}>
                            <Check className={cn("w-3 h-3 transition-transform duration-200", isSelected ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                          </div>
                          <Avatar className="h-7 w-7 border border-surface-200 dark:border-surface-700">
                            <AvatarImage src={member.user_detail.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-brand-500 to-brand-700 text-white font-medium">
                              {member.user_detail.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium text-sm truncate transition-colors",
                              isSelected ? "text-brand-900 dark:text-brand-100" : "text-surface-700 dark:text-surface-200"
                            )}>
                              {member.user_detail.full_name || member.user_detail.username}
                            </p>
                            {member.role && (
                              <p className="text-[11px] text-surface-500 dark:text-surface-400 capitalize truncate mt-0.5">
                                {member.role}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
