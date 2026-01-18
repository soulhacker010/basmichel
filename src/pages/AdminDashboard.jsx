import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FolderKanban, 
  Users, 
  Images, 
  Calendar,
  ArrowRight,
  Clock
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AdminDashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 5),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: galleries = [] } = useQuery({
    queryKey: ['galleries'],
    queryFn: () => base44.entities.Gallery.list('-created_date', 5),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-start_datetime', 5),
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: allGalleries = [] } = useQuery({
    queryKey: ['allGalleries'],
    queryFn: () => base44.entities.Gallery.list(),
  });

  const activeProjects = allProjects.filter(p => p.status === 'in_behandeling').length;
  const publishedGalleries = allGalleries.filter(g => g.status === 'gepubliceerd').length;
  const upcomingSessions = sessions.filter(s => 
    s.status === 'bevestigd' && new Date(s.start_datetime) > new Date()
  ).length;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Overzicht"
        description="Welkom terug bij Basmichel Studio"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Totaal Klanten"
          value={clients.length}
          icon={Users}
        />
        <StatsCard 
          title="Actieve Projecten"
          value={activeProjects}
          icon={FolderKanban}
        />
        <StatsCard 
          title="Gepubliceerde Galerijen"
          value={publishedGalleries}
          icon={Images}
        />
        <StatsCard 
          title="Komende Sessies"
          value={upcomingSessions}
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recente Projecten</h2>
            <Link 
              to={createPageUrl('AdminProjects')}
              className="text-sm text-[#5C6B52] hover:text-[#4A5A42] flex items-center gap-1"
            >
              Bekijk alle <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {projects.length === 0 ? (
            <EmptyState 
              icon={FolderKanban}
              title="Geen projecten"
              description="Maak je eerste project aan om te beginnen"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {projects.map(project => (
                <Link
                  key={project.id}
                  to={createPageUrl(`AdminProjects?id=${project.id}`)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{project.title}</p>
                    <p className="text-sm text-gray-500">
                      {project.created_date && format(new Date(project.created_date), 'd MMM yyyy', { locale: nl })}
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Galleries */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recente Galerijen</h2>
            <Link 
              to={createPageUrl('AdminGalleries')}
              className="text-sm text-[#5C6B52] hover:text-[#4A5A42] flex items-center gap-1"
            >
              Bekijk alle <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {galleries.length === 0 ? (
            <EmptyState 
              icon={Images}
              title="Geen galerijen"
              description="Maak je eerste galerij aan"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {galleries.map(gallery => (
                <Link
                  key={gallery.id}
                  to={createPageUrl(`AdminGalleries?id=${gallery.id}`)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{gallery.title}</p>
                    <p className="text-sm text-gray-500">
                      {gallery.created_date && format(new Date(gallery.created_date), 'd MMM yyyy', { locale: nl })}
                    </p>
                  </div>
                  <StatusBadge status={gallery.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Komende Sessies</h2>
            <Link 
              to={createPageUrl('AdminBookings')}
              className="text-sm text-[#5C6B52] hover:text-[#4A5A42] flex items-center gap-1"
            >
              Bekijk kalender <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {sessions.filter(s => new Date(s.start_datetime) > new Date()).length === 0 ? (
            <EmptyState 
              icon={Calendar}
              title="Geen komende sessies"
              description="Er zijn momenteel geen sessies gepland"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions
                .filter(s => new Date(s.start_datetime) > new Date())
                .slice(0, 5)
                .map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#E8EDE5] flex flex-col items-center justify-center">
                      <span className="text-xs text-[#5C6B52] uppercase">
                        {session.start_datetime && format(new Date(session.start_datetime), 'MMM', { locale: nl })}
                      </span>
                      <span className="text-lg font-medium text-[#5C6B52]">
                        {session.start_datetime && format(new Date(session.start_datetime), 'd')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{session.location || 'Geen locatie'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {session.start_datetime && format(new Date(session.start_datetime), 'HH:mm')} - 
                          {session.end_datetime && format(new Date(session.end_datetime), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}