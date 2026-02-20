import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function NotificationCenter({ userId, clientId, isAdmin = false }) {
  const queryClient = useQueryClient();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(localStorage.getItem('adminDarkMode') === 'true');
    };
    checkDarkMode();
    window.addEventListener('storage', checkDarkMode);
    const interval = setInterval(checkDarkMode, 100);
    return () => {
      window.removeEventListener('storage', checkDarkMode);
      clearInterval(interval);
    };
  }, []);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId, clientId],
    queryFn: async () => {
      if (isAdmin) {
        // Admin sees only admin notifications (without client_id)
        const allNotifications = await base44.entities.Notification.list('-created_date', 50);
        return allNotifications.filter(n => !n.client_id);
      } else {
        // Client sees their own notifications by user_id or client_id
        if (clientId) {
          return base44.entities.Notification.filter({ client_id: clientId }, '-created_date', 50);
        } else {
          return base44.entities.Notification.filter({ user_id: userId }, '-created_date', 50);
        }
      }
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    const iconMap = {
      'boeking_bevestigd': '📅',
      'project_klaar': '✅',
      'nieuwe_factuur': '💰',
      'betaling_ontvangen': '💳',
      'nieuwe_sessie': '🎯',
      'revision_request': '✏️',
    };
    return iconMap[type] || '📢';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("relative p-2 rounded-lg transition-colors",
          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
        )}>
          <Bell className={cn("w-5 h-5", darkMode ? "text-gray-400" : "text-gray-600")} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-96 p-0", darkMode && "bg-gray-800 border-gray-700")} align="end">
        <div className={cn("flex items-center justify-between p-4 border-b", darkMode ? "border-gray-700" : "border-gray-200")}>
          <h3 className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>Meldingen</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs h-7"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Alles markeren
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className={cn("w-12 h-12 mx-auto mb-3", darkMode ? "text-gray-700" : "text-gray-200")} />
              <p className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>Geen meldingen</p>
            </div>
          ) : (
            <div className={cn("divide-y", darkMode ? "divide-gray-700" : "divide-gray-200")}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors cursor-pointer",
                    darkMode 
                      ? "hover:bg-gray-700" + (!notification.is_read ? " bg-gray-700/50" : "")
                      : "hover:bg-gray-50" + (!notification.is_read ? " bg-blue-50/30" : "")
                  )}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsReadMutation.mutate(notification.id);
                    }
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium",
                          darkMode ? "text-gray-100" : "text-gray-900",
                          !notification.is_read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className={cn("text-sm mt-1 line-clamp-2", darkMode ? "text-gray-400" : "text-gray-600")}>
                        {notification.message}
                      </p>
                      <p className={cn("text-xs mt-2", darkMode ? "text-gray-500" : "text-gray-400")}>
                        {format(new Date(notification.created_date), 'd MMM yyyy HH:mm', { locale: nl })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
