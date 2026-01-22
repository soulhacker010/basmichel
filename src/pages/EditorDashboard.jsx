import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FolderKanban, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  geboekt: { label: 'Booked', color: 'bg-blue-500' },
  shoot_uitgevoerd: { label: 'Shoot Done', color: 'bg-amber-500' },
  wordt_bewerkt: { label: 'In Editing', color: 'bg-purple-500' },
  klaar: { label: 'Completed', color: 'bg-green-500' },
};

export default function EditorDashboard() {
  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('editorDarkMode') === 'true';
  });

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
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

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const inEditingProjects = projects.filter(p => p.status === 'wordt_bewerkt');
  const recentProjects = projects.slice(0, 10);

  // Amsterdam time
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const amsterdamTime = new Date().toLocaleString('en-US', { 
        timeZone: 'Europe/Amsterdam',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });
      setCurrentTime(amsterdamTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>
            Welcome back, {editor?.name || user?.email}
          </h1>
          <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>
            {editor?.specialization && `${editor.specialization.replace('_', ' ')} • `}
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className={cn("text-right", darkMode ? "text-gray-300" : "text-gray-700")}>
          <p className="text-xs uppercase tracking-wide mb-1">Amsterdam Time</p>
          <p className="text-2xl font-light font-mono">{currentTime}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={cn("rounded-xl p-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>In Editing</p>
              <p className={cn("text-3xl font-light mt-2", darkMode ? "text-gray-100" : "text-gray-900")}>{inEditingProjects.length}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", darkMode ? "bg-purple-900/50" : "bg-purple-100")}>
              <FileText className={cn("w-6 h-6", darkMode ? "text-purple-400" : "text-purple-600")} />
            </div>
          </div>
        </div>

        <div className={cn("rounded-xl p-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Total Projects</p>
              <p className={cn("text-3xl font-light mt-2", darkMode ? "text-gray-100" : "text-gray-900")}>{projects.length}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", darkMode ? "bg-blue-900/50" : "bg-blue-100")}>
              <FolderKanban className={cn("w-6 h-6", darkMode ? "text-blue-400" : "text-blue-600")} />
            </div>
          </div>
        </div>

        <div className={cn("rounded-xl p-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Completed</p>
              <p className={cn("text-3xl font-light mt-2", darkMode ? "text-gray-100" : "text-gray-900")}>
                {projects.filter(p => p.status === 'klaar').length}
              </p>
            </div>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", darkMode ? "bg-green-900/50" : "bg-green-100")}>
              <Calendar className={cn("w-6 h-6", darkMode ? "text-green-400" : "text-green-600")} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className={cn("rounded-xl overflow-hidden", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <div className={cn("p-6", darkMode ? "border-b border-gray-700" : "border-b border-gray-100")}>
          <h2 className={cn("text-lg font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>Recent Projects</h2>
        </div>
        <div className={cn(darkMode ? "divide-y divide-gray-700" : "divide-y divide-gray-100")}>
          {recentProjects.map(project => {
            const client = clients.find(c => c.id === project.client_id);
            const status = statusConfig[project.status];
            return (
              <Link
                key={project.id}
                to={`${createPageUrl('EditorProjects')}?id=${project.id}`}
                className={cn("block p-6 transition-colors", darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{project.title}</h3>
                    <div className={cn("flex items-center gap-3 mt-1 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                      <span>{client?.company_name || 'Unknown Client'}</span>
                      {project.shoot_date && (
                        <>
                          <span>•</span>
                          <span>{format(new Date(project.shoot_date), 'MMM d, yyyy')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${status?.color}`}>
                    {status?.label}
                  </span>
                </div>
              </Link>
            );
          })}
          {recentProjects.length === 0 && (
            <div className={cn("p-12 text-center", darkMode ? "text-gray-500" : "text-gray-400")}>
              <FolderKanban className={cn("w-12 h-12 mx-auto mb-3", darkMode ? "text-gray-600" : "text-gray-300")} />
              <p>No projects yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}