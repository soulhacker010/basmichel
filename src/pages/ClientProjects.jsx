import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Search,
  Calendar,
  ChevronRight,
  MapPin,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  geboekt: { label: 'Geboekt', dot: 'bg-blue-400', pill: 'bg-blue-50 text-blue-600' },
  shoot_uitgevoerd: { label: 'Wordt bewerkt', dot: 'bg-purple-400', pill: 'bg-purple-50 text-purple-600' },
  wordt_bewerkt: { label: 'Wordt bewerkt', dot: 'bg-purple-400', pill: 'bg-purple-50 text-purple-600' },
  klaar: { label: 'Klaar', dot: 'bg-green-400', pill: 'bg-green-50 text-green-600' },
};

const filterTabs = [
  { value: 'all', label: 'Alle' },
  { value: 'geboekt', label: 'Geboekt' },
  { value: 'wordt_bewerkt', label: 'Bewerking' },
  { value: 'klaar', label: 'Klaar' },
];

export default function ClientProjects() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortAsc, setSortAsc] = useState(true);

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && clients.length > 0) {
      const client = clients.find(c => c.user_id === user.id);
      if (client) setClientId(client.id);
    }
  }, [user, clients]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: () => base44.entities.Project.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch =
        project.title?.toLowerCase().includes(search.toLowerCase()) ||
        project.address?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = a.shoot_date ? new Date(a.shoot_date) : null;
      const dateB = b.shoot_date ? new Date(b.shoot_date) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Projecten</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortAsc(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium active:scale-95 transition-transform"
            title={sortAsc ? 'Eerstvolgende bovenaan' : 'Laatste bovenaan'}
          >
            <Calendar className="w-3.5 h-3.5" />
            {sortAsc ? '↑ Vroegst eerst' : '↓ Laatste eerst'}
          </button>
          <Link to={createPageUrl('ClientBooking')}>
            <button className="w-9 h-9 rounded-full bg-[#5C6B52] flex items-center justify-center shadow-sm active:scale-95 transition-transform">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Zoeken..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-gray-100 border-0 focus-visible:ring-1 text-sm"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              statusFilter === tab.value
                ? "bg-[#5C6B52] text-white shadow-sm"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400 text-sm">
            {search || statusFilter !== 'all' ? 'Geen projecten gevonden' : 'Nog geen projecten'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link to={createPageUrl('ClientBooking')}>
              <button className="mt-4 px-5 py-2.5 bg-[#5C6B52] text-white text-sm font-medium rounded-full">
                Shoot boeken
              </button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: list view */}
          <div className="block md:hidden bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
            {filteredProjects.map((project) => {
              const status = statusConfig[project.status];
              const dateValue = project.shoot_date || project.created_date;
              return (
                <Link
                  key={project.id}
                  to={`${createPageUrl('ClientProjectDetail2')}?id=${project.id}`}
                  className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#F0F3EE] flex flex-col items-center justify-center flex-shrink-0">
                    {dateValue ? (
                      <>
                        <span className="text-[10px] font-semibold text-[#5C6B52] uppercase leading-none">
                          {format(new Date(dateValue), 'MMM', { locale: nl })}
                        </span>
                        <span className="text-lg font-bold text-[#3D4D35] leading-tight">
                          {format(new Date(dateValue), 'd')}
                        </span>
                      </>
                    ) : (
                      <Calendar className="w-5 h-5 text-[#5C6B52]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{project.title}</p>
                    {project.address && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-400 truncate">{project.address}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", status?.dot)} />
                      <span className="text-xs text-gray-500">{status?.label}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Desktop: card grid */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-4xl">
            {filteredProjects.map((project) => {
              const status = statusConfig[project.status];
              const dateValue = project.shoot_date || project.created_date;
              return (
                <Link
                  key={project.id}
                  to={`${createPageUrl('ClientProjectDetail2')}?id=${project.id}`}
                  className="bg-white rounded-lg border border-gray-100 p-5 hover:shadow-sm transition-all block"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F0F3EE] flex flex-col items-center justify-center flex-shrink-0">
                      {dateValue ? (
                        <>
                          <span className="text-[9px] font-semibold text-[#5C6B52] uppercase leading-none">
                            {format(new Date(dateValue), 'MMM', { locale: nl })}
                          </span>
                          <span className="text-base font-bold text-[#3D4D35] leading-tight">
                            {format(new Date(dateValue), 'd')}
                          </span>
                        </>
                      ) : (
                        <Calendar className="w-4 h-4 text-[#5C6B52]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{project.title}</p>
                      {project.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-400 truncate">{project.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", status?.dot)} />
                      <span className="text-xs text-gray-500">{status?.label}</span>
                    </div>
                    {project.shoot_date && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(project.shoot_date), 'd MMM yyyy', { locale: nl })}
                        {project.shoot_time && ` • ${project.shoot_time}`}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}