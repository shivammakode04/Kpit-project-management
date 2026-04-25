import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationsApi } from '@/api/notifications';
import { useToast } from '@/hooks/use-toast';

export function NotificationDebug() {
  const [testMessage, setTestMessage] = useState('Test notification message');
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount } = useNotificationStore();
  const { toast } = useToast();

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ message: testMessage }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Test Notification Created',
          description: `Created notification for ${data.user}`,
        });
        
        // Force refresh after a short delay
        setTimeout(async () => {
          await fetchNotifications();
          await fetchUnreadCount();
        }, 1000);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test Failed',
        description: 'Check console for details',
        variant: 'destructive',
      });
    }
  };

  const handleForceRefresh = async () => {
    try {
      await fetchNotifications();
      await fetchUnreadCount();
      toast({
        title: 'Refreshed',
        description: `Found ${notifications.length} notifications, ${unreadCount} unread`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh notifications',
        variant: 'destructive',
      });
    }
  };

  const handleTestAPI = async () => {
    try {
      const response = await notificationsApi.list();
      console.log('API Response:', response.data);
      const data = response.data.results || response.data;
      toast({
        title: 'API Test',
        description: `API returned ${data.length} notifications`,
      });
    } catch (error) {
      console.error('API Error:', error);
      toast({
        title: 'API Error',
        description: 'Check console for details',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-yellow-50 dark:bg-yellow-900/20">
      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
        Notification Debug Panel
      </h3>
      
      <div className="space-y-2">
        <Input
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Test message"
          className="text-sm"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button onClick={handleForceRefresh} variant="outline" size="sm">
            Force Refresh ({unreadCount} unread)
          </Button>
          <Button onClick={handleTestAPI} variant="outline" size="sm">
            Test API Direct
          </Button>
          <Button onClick={handleTestNotification} variant="outline" size="sm">
            Create Test Notification
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-yellow-700 dark:text-yellow-300">
        <p>Total notifications: {notifications.length}</p>
        <p>Unread count: {unreadCount}</p>
        <p>Last 3 notifications:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          {notifications.slice(0, 3).map((n) => (
            <li key={n.id} className={n.is_read ? 'opacity-60' : 'font-medium'}>
              [{n.type}] {n.message.substring(0, 50)}...
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}