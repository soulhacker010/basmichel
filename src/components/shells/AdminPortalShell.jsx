import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Images, 
  CreditCard, 
  Calendar, 
  FileText, 
  FileCode, 
  Settings,
  Menu,
  X,
  LogOut,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminPages = [
  { name: 'Overzicht', page: 'AdminDashboard', path: '/admin/overzicht', icon: LayoutDashboard },
  { name: 'Projecten', page: 'AdminProjects', path: '/admin/projecten', icon: FolderKanban },
  { name: 'Klanten', page: 'AdminClients', path: '/admin/klanten', icon: Users },
  { name: 'Galerijen', page: 'AdminGalleries', path: '/admin/galerijen', icon: Images },
  { name: 'Boekingen', page: 'AdminBookings', path: '/admin/boekingen', icon: Calendar },
  { name: 'Facturen', page: 'AdminInvoices', path: '/admin/facturen', icon: CreditCard },
  { name: 'Documenten', page: 'AdminDocuments', path: '/admin/documenten', icon: FileText },
  { name: 'Sjablonen', page: 'AdminTemplates', path: '/admin/sjablonen', icon: FileCode },
  { name: 'Kortingen', page: 'AdminDiscounts', path: '/admin/kortingen', icon: Tag },
  { name: 'Instellingen', page: 'AdminSettings', path: '/admin/instellingen', icon: Settings },
];

export default function AdminPortalShell({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('AdminLogin');
          return;
        }
        
        const userData = await base44.auth.me();
        
        // Block non-admin users from admin portal
        if (userData.role !== 'admin') {
          window.location.href = createPageUrl('ClientDashboard');
          return;
        }
        
        setUser(userData);
      } catch (e) {
        window.location.href = createPageUrl('AdminLogin');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center">
        <div className="animate-pulse text-[#A8B5A0]">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FCFCFB]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-4 flex items-center justify-between">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-light text-gray-900 tracking-wide">Basmichel</span>
        <div className="w-9" />
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white z-50 transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-6">
            <Link to={createPageUrl('Home')} className="text-lg font-light text-gray-900 tracking-wide hover:text-[#5C6B52] transition-colors">
              Basmichel
            </Link>
          </div>

          {/* Badge */}
          <div className="px-6 pb-6">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 text-white">
              Studio Manager
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {adminPages.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;

              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-[#F8FAF7] text-[#5C6B52]" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "text-[#5C6B52]")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 mt-auto">
            <div className="bg-[#F8FAF7] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#E8EDE5] flex items-center justify-center">
                  <span className="text-sm font-medium text-[#5C6B52]">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || 'Gebruiker'}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Uitloggen</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-64",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-6 lg:p-10 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}