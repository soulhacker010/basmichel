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
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(localStorage.getItem('adminDarkMode') === 'true');
    };
    checkDarkMode();
    window.addEventListener('storage', checkDarkMode);
    const interval = setInterval(checkDarkMode, 100);
    return () => {
      window.removeEventListener('storage', checkDarkMode);
      clearInterval(interval);
    };
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
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Pixieset style */}
      <div className="mb-10">
        <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>
          {greeting()}, {currentUser?.full_name?.split(' ')[0] || 'Bas'}
        </h1>
        <p className={cn("text-sm mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Revenue Chart */}
      <div className={cn("rounded-lg p-8 mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <div className="mb-6">
          <p className={cn("text-xs uppercase tracking-wide mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Betalingen</p>
          <p className={cn("text-3xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>€{totalRevenue.toFixed(2)}</p>
          <p className={cn("text-xs mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>Laatste 12 maanden</p>
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
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#f0f0f0"} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: darkMode ? '#9ca3af' : '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: darkMode ? '#9ca3af' : '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1f2937' : 'white', 
                  border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: darkMode ? '#f3f4f6' : '#000'
                }}
                formatter={(value) => [`€${value.toFixed(2)}`, 'Omzet']}
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
          className={cn("text-sm mt-4 inline-block", darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")}
        >
          Bekijk facturen
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn("text-base font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>Recente Projecten</h2>
            <Link 
              to={createPageUrl('AdminProjects')}
              className={cn("text-sm", darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")}
            >
              Bekijk alle
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className={cn("rounded-lg p-12 text-center", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
              <FolderKanban className={cn("w-10 h-10 mx-auto mb-3", darkMode ? "text-gray-600" : "text-gray-300")} />
              <p className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>Nog geen projecten</p>
            </div>
          ) : (
            <div className={cn("rounded-lg", darkMode ? "bg-gray-800 border border-gray-700 divide-y divide-gray-700" : "bg-white border border-gray-100 divide-y divide-gray-50")}>
              {projects.map(project => (
                <div key={project.id} className={cn("p-4 transition-colors", darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={cn("font-medium text-sm", darkMode ? "text-gray-100" : "text-gray-900")}>{project.title}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
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
            <h2 className={cn("text-base font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>Recente Galerijen</h2>
            <Link 
              to={createPageUrl('AdminGalleries')}
              className={cn("text-sm", darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")}
            >
              Bekijk alle
            </Link>
          </div>
          {galleries.length === 0 ? (
            <div className={cn("rounded-lg p-12 text-center", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
              <Images className={cn("w-10 h-10 mx-auto mb-3", darkMode ? "text-gray-600" : "text-gray-300")} />
              <p className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>Nog geen galerijen</p>
            </div>
          ) : (
            <div className={cn("rounded-lg", darkMode ? "bg-gray-800 border border-gray-700 divide-y divide-gray-700" : "bg-white border border-gray-100 divide-y divide-gray-50")}>
              {galleries.map(gallery => (
                <div key={gallery.id} className={cn("p-4 transition-colors", darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={cn("font-medium text-sm", darkMode ? "text-gray-100" : "text-gray-900")}>{gallery.title}</h3>
                    <StatusBadge status={gallery.status} />
                  </div>
                  <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
                    {gallery.created_date && format(new Date(gallery.created_date), 'd MMM yyyy', { locale: nl })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}