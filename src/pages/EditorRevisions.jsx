import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function EditorRevisions() {
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('editorDarkMode') === 'true';
  });

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

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list('-updated_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: editorNotes = [] } = useQuery({
    queryKey: ['allEditorNotes'],
    queryFn: () => base44.entities.EditorNote.list('-created_date'),
  });

  // Projects with editor notes indicating revisions needed
  const revisionProjects = projects.filter(project => {
    const hasNotes = editorNotes.some(note => note.project_id === project.id);
    return hasNotes && (project.status === 'wordt_bewerkt' || project.status === 'shoot_uitgevoerd');
  });

  const filteredProjects = revisionProjects.filter(project =>
    project.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>Revisions</h1>
        <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>Projects requiring revisions</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => {
          const client = clients.find(c => c.id === project.client_id);
          const projectNotes = editorNotes.filter(n => n.project_id === project.id);
          return (
            <Link
              key={project.id}
              to={`${createPageUrl('EditorProjects')}?id=${project.id}`}
              className={cn("rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group",
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
              )}
            >
              <div className="h-2 w-full bg-orange-500" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={cn("font-medium group-hover:text-purple-600 transition-colors",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      {project.title}
                    </h3>
                    {client?.company_name && (
                      <div className={cn("text-xs mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>{client.company_name}</div>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                    {projectNotes.length} note{projectNotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>
                  Last note: {projectNotes[0] && format(new Date(projectNotes[0].created_date), 'MMM d, yyyy')}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className={cn("text-center py-12", darkMode ? "text-gray-500" : "text-gray-400")}>
          <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No projects requiring revisions</p>
        </div>
      )}
    </div>
  );
}