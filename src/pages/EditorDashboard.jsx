import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FolderKanban, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  geboekt: { label: 'Booked', color: 'bg-blue-500' },
  shoot_uitgevoerd: { label: 'Shoot Done', color: 'bg-amber-500' },
  wordt_bewerkt: { label: 'In Editing', color: 'bg-purple-500' },
  klaar: { label: 'Completed', color: 'bg-green-500' },
};

export default function EditorDashboard() {
  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);

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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900">
          Welcome back, {editor?.name || user?.email}
        </h1>
        <p className="text-gray-500 mt-1">
          {editor?.specialization && `${editor.specialization.replace('_', ' ')} • `}
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Editing</p>
              <p className="text-3xl font-light text-gray-900 mt-2">{inEditingProjects.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-3xl font-light text-gray-900 mt-2">{projects.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-light text-gray-900 mt-2">
                {projects.filter(p => p.status === 'klaar').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentProjects.map(project => {
            const client = clients.find(c => c.id === project.client_id);
            const status = statusConfig[project.status];
            return (
              <Link
                key={project.id}
                to={`${createPageUrl('EditorProjects')}?id=${project.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
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
            <div className="p-12 text-center text-gray-400">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No projects yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}