import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell, Upload, FileText, MessageSquare, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const notificationIcons = {
  raw_files_uploaded: Upload,
  project_status_changed: FileText,
  note_added: MessageSquare,
};

export default function EditorNotifications() {
  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('editorDarkMode') === 'true';
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem('editorDarkMode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData]);

  const { data: editors = [] } = useQuery({
    queryKey: ['editors'],
    queryFn: () => base44.entities.Editor.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && editors.length > 0) {
      const editorData = editors.find(e => e.user_id === user.id && e.status === 'active');
      if (editorData) setEditor(editorData);
    }
  }, [user, editors]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['editorNotifications', editor?.id],
    queryFn: () => base44.entities.EditorNotification.filter({ editor_id: editor.id }, '-created_date'),
    enabled: !!editor,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.EditorNotification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorNotifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifications.map(n => base44.entities.EditorNotification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorNotifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>Notifications</h1>
          <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(notification => {
          const project = projects.find(p => p.id === notification.project_id);
          const Icon = notificationIcons[notification.type] || Bell;
          
          return (
            <Link
              key={notification.id}
              to={`${createPageUrl('EditorProjects')}?id=${notification.project_id}`}
              onClick={() => !notification.is_read && markAsReadMutation.mutate(notification.id)}
              className={cn(
                "block rounded-xl p-4 transition-all",
                notification.is_read
                  ? darkMode ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-100"
                  : darkMode ? "bg-gray-800 border-2 border-purple-600" : "bg-white border-2 border-purple-200 shadow-sm"
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  notification.is_read
                    ? darkMode ? "bg-gray-700" : "bg-gray-200"
                    : darkMode ? "bg-purple-900/50" : "bg-purple-100"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    notification.is_read
                      ? darkMode ? "text-gray-500" : "text-gray-500"
                      : darkMode ? "text-purple-400" : "text-purple-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={cn(
                      "font-medium",
                      notification.is_read
                        ? darkMode ? "text-gray-400" : "text-gray-600"
                        : darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      {notification.title}
                    </h3>
                    <span className={cn(
                      "text-xs whitespace-nowrap",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      {format(new Date(notification.created_date), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm mb-2",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {notification.message}
                  </p>
                  {project && (
                    <div className={cn(
                      "text-xs",
                      darkMode ? "text-gray-500" : "text-gray-400"
                    )}>
                      Project: {project.title}
                    </div>
                  )}
                  {notification.metadata?.location && (
                    <div className={cn(
                      "text-xs mt-1",
                      darkMode ? "text-purple-400" : "text-purple-600"
                    )}>
                      Location: {notification.metadata.location}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <div className={cn("text-center py-12", darkMode ? "text-gray-500" : "text-gray-400")}>
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No notifications yet</p>
        </div>
      )}
    </div>
  );
}