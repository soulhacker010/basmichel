import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function EditorUpcoming() {
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
    queryKey: ['upcomingProjects'],
    queryFn: () => base44.entities.Project.filter({ status: 'shoot_uitgevoerd' }, '-shoot_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>Upcoming Projects</h1>
        <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>Projects waiting to be edited</p>
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
          return (
            <Link
              key={project.id}
              to={`${createPageUrl('EditorProjects')}?id=${project.id}`}
              className={cn("rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group",
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
              )}
            >
              <div className="h-2 w-full bg-amber-500" />
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                    Shoot Done
                  </span>
                </div>
                <div className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>
                  {project.shoot_date && format(new Date(project.shoot_date), 'MMM d, yyyy')}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className={cn("text-center py-12", darkMode ? "text-gray-500" : "text-gray-400")}>
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No upcoming projects</p>
        </div>
      )}
    </div>
  );
}