import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { projectsApi } from '@/api/projects';
import type { ProjectMember } from '@/types';
import { cn } from '@/lib/utils';

interface TaskAssignmentSelectProps {
  projectId: number;
  value?: number | null;
  onChange: (userId: number | null) => void;
}

export function TaskAssignmentSelect({
  projectId,
  value,
  onChange,
}: TaskAssignmentSelectProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      // Only load accepted members for task assignment
      const res = await projectsApi.getMembers(projectId, 'accepted');
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

  const selectedMember = members.find((m) => m.user_detail.id === value);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-start text-left"
      >
        {selectedMember ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={selectedMember.user_detail.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {selectedMember.user_detail.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{selectedMember.user_detail.full_name || selectedMember.user_detail.username}</span>
          </div>
        ) : (
          <span className="text-gray-500">Select assignee...</span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <ScrollArea className="h-48">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No accepted members found
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  <button
                    onClick={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="text-gray-500">Unassigned</span>
                  </button>
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        onChange(member.user_detail.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2',
                        value === member.user_detail.id && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.user_detail.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {member.user_detail.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {member.user_detail.full_name || member.user_detail.username}
                        </p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
