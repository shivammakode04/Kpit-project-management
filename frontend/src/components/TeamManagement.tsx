import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { teamsApi } from '@/api/teams';
import type { User, ProjectMember } from '@/types';
import { cn } from '@/lib/utils';

interface TeamManagementProps {
  projectId: number;
}

export function TeamManagement({ projectId }: TeamManagementProps) {
  const [activeTab, setActiveTab] = useState<'all-users' | 'my-team'>('all-users');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, membersRes] = await Promise.all([
        teamsApi.getAllUsers(projectId),
        teamsApi.getTeamMembers(projectId),
      ]);
      setAllUsers(usersRes.data);
      setTeamMembers(membersRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load team data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      const res = await teamsApi.getAllUsers(projectId);
      setAllUsers(res.data);
      return;
    }
    try {
      const res = await teamsApi.getAllUsers(projectId, query);
      setAllUsers(res.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Search failed',
        variant: 'destructive',
      });
    }
  };

  const handleInvite = async (userId: number) => {
    try {
      await teamsApi.inviteUser(projectId, userId);
      setInvitedUsers(new Set([...invitedUsers, userId]));
      toast({
        title: 'Success',
        description: 'Invitation sent successfully! The user will receive a notification.',
      });
      // Refresh data to remove invited user from all users list
      loadData();
      
      // Force refresh notifications after a short delay
      setTimeout(() => {
        // Trigger notification refresh if available
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 1000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full">
      {/* Tab List */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl mb-4">
        {(['all-users', 'my-team'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300',
            )}
          >
            {tab === 'all-users' ? 'All Users' : 'My Team'}
          </button>
        ))}
      </div>

      {/* All Users Tab */}
      {activeTab === 'all-users' && (
        <div className="space-y-4">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {loading ? (
              <div className="text-center text-sm text-surface-500 py-8">Loading...</div>
            ) : allUsers.length === 0 ? (
              <div className="text-center text-sm text-surface-500 py-8">
                No users available to invite
              </div>
            ) : (
              <div className="space-y-3">
                {allUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name || user.username}</p>
                        <p className="text-xs text-surface-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInvite(user.id)}
                      disabled={invitedUsers.has(user.id)}
                    >
                      {invitedUsers.has(user.id) ? 'Invited' : 'Send Invite'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* My Team Tab */}
      {activeTab === 'my-team' && (
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {loading ? (
            <div className="text-center text-sm text-surface-500 py-8">Loading...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center text-sm text-surface-500 py-8">No team members yet</div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-surface-700"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user_detail.avatar_url || undefined} />
                      <AvatarFallback>{member.user_detail.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.user_detail.full_name || member.user_detail.username}
                      </p>
                      <p className="text-xs text-surface-500 truncate">{member.user_detail.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                    <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
