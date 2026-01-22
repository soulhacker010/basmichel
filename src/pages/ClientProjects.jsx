import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FolderKanban, 
  Search,
  MapPin,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  geboekt: { label: 'Geboekt', color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
  shoot_uitgevoerd: { label: 'Shoot uitgevoerd', color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
  wordt_bewerkt: { label: 'Wordt bewerkt', color: 'bg-purple-500', bgLight: 'bg-purple-50', textColor: 'text-purple-700' },
  klaar: { label: 'Klaar', color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-700' },
};

export default function ClientProjects() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
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
    refetchInterval: false,
    staleTime: 0, // Always fetch fresh data
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title?.toLowerCase().includes(search.toLowerCase()) ||
      project.address?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: projects.length,
    geboekt: projects.filter(p => p.status === 'geboekt').length,
    shoot_uitgevoerd: projects.filter(p => p.status === 'shoot_uitgevoerd').length,
    wordt_bewerkt: projects.filter(p => p.status === 'wordt_bewerkt').length,
    klaar: projects.filter(p => p.status === 'klaar').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Mijn Projecten</h1>
          <p className="text-gray-500 mt-1">Bekijk al uw projecten en hun status</p>
        </div>
        <Link to={createPageUrl('ClientBooking')}>
          <Button className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Nieuwe Shoot Boeken
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Zoek op adres of titel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Alle ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="geboekt">Geboekt ({statusCounts.geboekt})</TabsTrigger>
            <TabsTrigger value="wordt_bewerkt">In bewerking ({statusCounts.wordt_bewerkt})</TabsTrigger>
            <TabsTrigger value="klaar">Klaar ({statusCounts.klaar})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {search || statusFilter !== 'all' ? 'Geen projecten gevonden' : 'Nog geen projecten'}
          </h2>
          <p className="text-gray-500 mb-6">
            {search || statusFilter !== 'all' 
              ? 'Probeer een andere zoekopdracht of filter'
              : 'Boek uw eerste shoot om te beginnen'
            }
          </p>
          {!search && statusFilter === 'all' && (
            <Link to={createPageUrl('ClientBooking')}>
              <Button className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                Shoot Boeken
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const status = statusConfig[project.status];
            return (
              <Link
                key={project.id}
                to={`${createPageUrl('ClientProjectDetail2')}?id=${project.id}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Status Bar */}
                <div className="h-2 w-full">
                  <div 
                    className={cn("h-full transition-all", status?.color)}
                    style={{ 
                      width: project.status === 'geboekt' ? '25%' :
                             project.status === 'shoot_uitgevoerd' ? '50%' :
                             project.status === 'wordt_bewerkt' ? '75%' : '100%'
                    }}
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-[#5C6B52] transition-colors">
                        {project.title}
                      </h3>
                      {(() => {
                        const clientData = clients.find(c => c.id === project.client_id);
                        return clientData?.company_name && (
                          <div className="text-xs text-gray-400 mt-1">
                            {clientData.company_name}
                          </div>
                        );
                      })()}
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      status?.bgLight,
                      status?.textColor
                    )}>
                      {status?.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {project.created_date && format(new Date(project.created_date), 'd MMMM yyyy', { locale: nl })}
                    </span>
                    <span className="text-[#5C6B52] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Bekijk <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}