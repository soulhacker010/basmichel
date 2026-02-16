import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FolderKanban, 
  Calendar,
  FileText,
  Bell,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  geboekt: { label: 'Geboekt', color: 'bg-blue-500', icon: Calendar },
  shoot_uitgevoerd: { label: 'Wordt bewerkt', color: 'bg-purple-500', icon: Clock },
  wordt_bewerkt: { label: 'Wordt bewerkt', color: 'bg-purple-500', icon: Clock },
  klaar: { label: 'Klaar', color: 'bg-green-500', icon: CheckCircle2 },
};

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);

  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: () => base44.entities.Client.filter({ user_id: user?.id }),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && clients.length > 0) {
      const client = clients[0];
      if (client) setClientId(client.id);
    }
  }, [user, clients]);

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: () => base44.entities.Project.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Calculate upcoming shoots from projects directly
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingProjects = projects.filter(p => {
    if (!p.shoot_date) return false;
    const shootDate = new Date(p.shoot_date);
    shootDate.setHours(0, 0, 0, 0);
    return shootDate >= today && (p.status === 'geboekt' || p.status === 'shoot_uitgevoerd');
  }).sort((a, b) => {
    const dateA = new Date(a.shoot_date);
    const dateB = new Date(b.shoot_date);
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
    return (a.shoot_time || '').localeCompare(b.shoot_time || '');
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['clientInvoices', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const primary = await base44.entities.ProjectInvoice.filter({ client_id: clientId }, '-created_date');
      const shared = await base44.entities.ProjectInvoice.filter({ recipient_client_ids: clientId }, '-created_date');
      const combined = [...(primary || []), ...(shared || [])];
      const seen = new Set();
      return combined.filter(inv => {
        if (seen.has(inv.id)) return false;
        seen.add(inv.id);
        return true;
      });
    },
    enabled: !!clientId,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['clientNotifications', clientId],
    queryFn: () => base44.entities.Notification.filter({ client_id: clientId, is_read: false }, '-created_date'),
    enabled: !!clientId,
  });

  const activeProjects = projects.filter(p => p.status !== 'klaar');
  const openInvoices = invoices.filter(i => i.status === 'verzonden');

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900">
          Welkom{user?.first_name ? `, ${user.first_name}` : user?.full_name ? `, ${user.full_name.split(' ')[0]}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-gray-400 mt-2">Uw projecten en boekingen op één plek</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Actieve projecten</p>
              <p className="text-3xl font-light text-gray-900">{activeProjects.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E8EDE5] flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-[#5C6B52]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Komende shoots</p>
              <p className="text-3xl font-light text-gray-900">{upcomingProjects.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E8EDE5] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#5C6B52]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Openstaand</p>
              <p className="text-3xl font-light text-gray-900">{openInvoices.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mb-10">
        <Link to={createPageUrl('ClientBooking')}>
          <Button size="lg" className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-8 h-12">
            <Calendar className="w-5 h-5 mr-2" />
            Nieuwe shoot boeken
          </Button>
        </Link>
      </div>

      {/* Projects */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Uw projecten</h2>
          <Link 
            to={createPageUrl('ClientProjects')}
            className="text-sm text-[#5C6B52] hover:text-[#4A5A42] flex items-center gap-1.5"
          >
            Bekijk alle <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium mb-1">Nog geen projecten</p>
            <p className="text-sm text-gray-400 mb-6">Boek een shoot om te beginnen</p>
            <Link to={createPageUrl('ClientBooking')}>
              <Button className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full">
                Shoot boeken
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {projects.slice(0, 5).map(project => {
              const status = statusConfig[project.status];
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-6 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2.5 h-2.5 rounded-full", status?.color)} />
                    <div>
                      <p className="font-medium text-gray-900">{project.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                      project.status === 'klaar' ? "bg-green-50 text-green-700" :
                      project.status === 'geboekt' ? "bg-blue-50 text-blue-700" :
                      "bg-purple-50 text-purple-700"
                    )}>
                      {status?.label}
                    </span>
                    {project.delivery_datetime && project.status !== 'klaar' && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        Levering: {format(new Date(project.delivery_datetime), 'd MMM', { locale: nl })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Shoots */}
      {upcomingProjects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Eerstvolgende shoots</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingProjects.slice(0, 3).map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between px-6 py-5"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-xl bg-[#F8FAF7] flex flex-col items-center justify-center">
                    <span className="text-xs text-[#5C6B52] uppercase font-medium">
                      {format(new Date(project.shoot_date), 'MMM', { locale: nl })}
                    </span>
                    <span className="text-2xl font-light text-[#5C6B52]">
                      {format(new Date(project.shoot_date), 'd')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{project.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{project.shoot_time || '-'}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {statusConfig[project.status]?.label || 'Geboekt'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
