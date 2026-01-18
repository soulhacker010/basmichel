import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Images, 
  Mail, 
  CreditCard, 
  Calendar, 
  FileText, 
  FileCode, 
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Admin pagina's
const adminPages = [
  { name: 'Overzicht', page: 'AdminDashboard', icon: LayoutDashboard },
  { name: 'Projecten', page: 'AdminProjects', icon: FolderKanban },
  { name: 'Klanten', page: 'AdminClients', icon: Users },
  { name: 'Galerijen', page: 'AdminGalleries', icon: Images },
  { name: 'Inbox', page: 'AdminInbox', icon: Mail },
  { name: 'Betalingen', page: 'AdminPayments', icon: CreditCard, disabled: true },
  { name: 'Boekingen', page: 'AdminBookings', icon: Calendar },
  { name: 'Documenten', page: 'AdminDocuments', icon: FileText },
  { name: 'Sjablonen', page: 'AdminTemplates', icon: FileCode },
  { name: 'Kortingen', page: 'AdminDiscounts', icon: CreditCard },
  { name: 'Instellingen', page: 'AdminSettings', icon: Settings },
];

// Klant pagina's
const clientPages = [
  { name: 'Mijn Galerijen', page: 'ClientGalleries', icon: Images },
];

// Publieke pagina's (geen layout)
const publicPages = ['BookingPage', 'GalleryView'];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Publieke pagina - geen layout
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // Laadstatus
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="animate-pulse text-[#A8B5A0]">Laden...</div>
      </div>
    );
  }

  // Niet ingelogd - redirect naar login
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <h1 className="text-2xl font-light text-gray-900 mb-2 text-center">Basmichel Studio</h1>
          <p className="text-gray-500 text-center mb-6">Log in om door te gaan</p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="w-full bg-[#A8B5A0] hover:bg-[#97A690] text-white"
          >
            Inloggen
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const navigation = isAdmin ? adminPages : clientPages;

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <style>{`
        :root {
          --sage: #A8B5A0;
          --sage-dark: #97A690;
          --sage-light: #E8EDE5;
        }
      `}</style>

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
        "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-50 transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-center border-b border-gray-50">
            <span className="text-xl font-light text-gray-900 tracking-wide">Basmichel</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              
              if (item.disabled) {
                return (
                  <div
                    key={item.page}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 cursor-not-allowed"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.name}</span>
                    <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">Binnenkort</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-[#E8EDE5] text-[#5C6B52]" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#E8EDE5] flex items-center justify-center">
                <span className="text-sm font-medium text-[#5C6B52]">
                  {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || 'Gebruiker'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-64",
        "pt-16 lg:pt-0"
      )}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}