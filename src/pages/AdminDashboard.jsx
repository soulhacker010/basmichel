import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FolderKanban, 
  Images
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 4),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: galleries = [] } = useQuery({
    queryKey: ['galleries'],
    queryFn: () => base44.entities.Gallery.list('-created_date', 4),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list(),
  });

  // Calculate revenue data for the last 12 months
  const getRevenueData = () => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthRevenue = invoices
        .filter(inv => {
          if (inv.status !== 'betaald' || !inv.paid_date) return false;
          const paidDate = new Date(inv.paid_date);
          return paidDate >= monthStart && paidDate <= monthEnd;
        })
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      return {
        month: format(month, 'MMM', { locale: nl }),
        revenue: monthRevenue
      };
    });
  };

  const revenueData = getRevenueData();
  const totalRevenue = invoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Pixieset style */}
      <div className="mb-10">
        <h1 className="text-2xl font-light text-gray-900">
          {greeting()}, {currentUser?.full_name?.split(' ')[0] || 'Bas'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border border-gray-100 p-8 mb-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Payments</p>
          <p className="text-3xl font-light text-gray-900">€{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">Last 12 months</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A8B5A0" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#A8B5A0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                formatter={(value) => [`€${value.toFixed(2)}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#A8B5A0" 
                strokeWidth={2}
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <Link 
          to={createPageUrl('AdminInvoices')}
          className="text-sm text-gray-500 hover:text-gray-700 mt-4 inline-block"
        >
          View invoices
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-900">Recent Projects</h2>
            <Link 
              to={createPageUrl('AdminProjects')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
              <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No projects yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-50">
              {projects.map(project => (
                <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-gray-900 text-sm">{project.title}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {project.created_date && format(new Date(project.created_date), 'd MMM yyyy', { locale: nl })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Galleries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-900">Recent Galleries</h2>
            <Link 
              to={createPageUrl('AdminGalleries')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View all
            </Link>
          </div>
          {galleries.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
              <Images className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No galleries yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-50">
              {galleries.map(gallery => (
                <div key={gallery.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-gray-900 text-sm">{gallery.title}</h3>
                    <StatusBadge status={gallery.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {gallery.created_date && format(new Date(gallery.created_date), 'd MMM yyyy', { locale: nl })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-gray-900">Upcoming Sessions</h2>
          <Link 
            to={createPageUrl('AdminBookings')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            View calendar
          </Link>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No upcoming sessions</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-50">
            {upcomingSessions.map(session => (
              <div key={session.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded bg-gray-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-400 uppercase">
                    {format(new Date(session.start_datetime), 'MMM', { locale: nl })}
                  </span>
                  <span className="text-xl font-light text-gray-900">
                    {format(new Date(session.start_datetime), 'd')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{session.location || 'Location TBD'}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(session.start_datetime), 'EEEE', { locale: nl })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(session.start_datetime), 'HH:mm')} - {format(new Date(session.end_datetime), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}