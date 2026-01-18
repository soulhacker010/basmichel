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
  shoot_uitgevoerd: { label: 'Shoot uitgevoerd', color: 'bg-amber-500', icon: CheckCircle2 },
  wordt_bewerkt: { label: 'Wordt bewerkt', color: 'bg-purple-500', icon: Clock },
  klaar: { label: 'Klaar', color: 'bg-green-500', icon: CheckCircle2 },
};

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

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

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: () => base44.entities.Project.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['clientBookings', clientId],
    queryFn: () => base44.entities.Booking.filter({ client_id: clientId }, '-start_datetime'),
    enabled: !!clientId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['clientInvoices', clientId],
    queryFn: () => base44.entities.Invoice.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['clientNotifications', clientId],
    queryFn: () => base44.entities.Notification.filter({ client_id: clientId, is_read: false }, '-created_date'),
    enabled: !!clientId,
  });

  const activeProjects = projects.filter(p => p.status !== 'klaar');
  const upcomingBookings = bookings.filter(b => b.status === 'bevestigd' && new Date(b.start_datetime) > new Date());
  const openInvoices = invoices.filter(i => i.status === 'verzonden');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900">
          Welkom terug{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Hier is een overzicht van uw projecten</p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-8 space-y-3">
          {notifications.slice(0, 3).map(notification => (
            <div 
              key={notification.id}
              className="bg-[#E8EDE5] border border-[#A8B5A0]/20 rounded-xl p-4 flex items-start gap-4"
            >
              <Bell className="w-5 h-5 text-[#5C6B52] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{notification.title}</p>
                <p className="text-sm text-gray-600">{notification.message}</p>
              </div>
              {notification.link && (
                <Link to={createPageUrl(notification.link)}>
                  <Button size="sm" variant="outline">Bekijk</Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{activeProjects.length}</p>
              <p className="text-sm text-gray-500">Actieve projecten</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{upcomingBookings.length}</p>
              <p className="text-sm text-gray-500">Komende shoots</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{openInvoices.length}</p>
              <p className="text-sm text-gray-500">Openstaande facturen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Link to={createPageUrl('ClientBooking')}>
          <Button size="lg" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
            <Calendar className="w-5 h-5 mr-2" />
            Nieuwe Shoot Boeken
          </Button>
        </Link>
      </div>

      {/* Projects */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Uw Projecten</h2>
          <Link 
            to={createPageUrl('ClientProjects')}
            className="text-sm text-[#5C6B52] hover:text-[#4A5A42] flex items-center gap-1"
          >
            Bekijk alle <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="py-12 text-center">
            <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nog geen projecten</p>
            <p className="text-sm text-gray-400">Boek een shoot om te beginnen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {projects.slice(0, 5).map(project => {
              const status = statusConfig[project.status];
              return (
                <Link
                  key={project.id}
                  to={createPageUrl(`ClientProjectDetail?id=${project.id}`)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2 h-2 rounded-full", status?.color)} />
                    <div>
                      <p className="font-medium text-gray-900">{project.title}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{project.address || 'Geen adres'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      project.status === 'klaar' ? "bg-green-50 text-green-700" :
                      project.status === 'geboekt' ? "bg-blue-50 text-blue-700" :
                      project.status === 'shoot_uitgevoerd' ? "bg-amber-50 text-amber-700" :
                      "bg-purple-50 text-purple-700"
                    )}>
                      {status?.label}
                    </span>
                    {project.delivery_datetime && project.status !== 'klaar' && (
                      <p className="text-xs text-gray-400 mt-1">
                        Levering: {format(new Date(project.delivery_datetime), 'd MMM', { locale: nl })}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Komende Shoots</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingBookings.slice(0, 3).map(booking => (
              <div
                key={booking.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#E8EDE5] flex flex-col items-center justify-center">
                    <span className="text-xs text-[#5C6B52] uppercase">
                      {format(new Date(booking.start_datetime), 'MMM', { locale: nl })}
                    </span>
                    <span className="text-xl font-medium text-[#5C6B52]">
                      {format(new Date(booking.start_datetime), 'd')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{booking.address || 'Geen adres'}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(new Date(booking.start_datetime), 'HH:mm')} - {booking.end_datetime && format(new Date(booking.end_datetime), 'HH:mm')}</span>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  Bevestigd
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}