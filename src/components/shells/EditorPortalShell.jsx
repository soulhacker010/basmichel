import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Menu,
  X,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const editorPages = [
  { name: 'Dashboard', page: 'EditorDashboard', path: '/editor/dashboard', icon: LayoutDashboard },
  { name: 'Projects', page: 'EditorProjects', path: '/editor/projects', icon: FolderKanban },
];

export default function EditorPortalShell({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('editorDarkMode') === 'true';
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('editorDarkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl('AdminLogin');
          return;
        }
        
        const userData = await base44.auth.me();
        setUser(userData);

        // Check if user is an editor or admin
        const editors = await base44.entities.Editor.filter({ user_id: userData.id, status: 'active' });
        
        if (editors.length === 0) {
          // If admin, allow access without editor record
          if (userData.role === 'admin') {
            setEditor({
              id: 'admin_editor_' + userData.id,
              user_id: userData.id,
              name: userData.full_name || userData.email,
              email: userData.email,
              specialization: 'Admin',
              status: 'active'
            });
          } else {
            // Not an editor and not admin, redirect to client
            window.location.href = createPageUrl('ClientDashboard');
            return;
          }
        } else {
          setEditor(editors[0]);
        }
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
        <div className="animate-pulse text-[#A8B5A0]">Loading...</div>
      </div>
    );
  }

  if (!user || !editor) {
    return null;
  }

  return (
    <div className={cn("min-h-screen", darkMode ? "bg-gray-900" : "bg-[#FCFCFB]")}>
      {/* Mobile Header */}
      <div className={cn("lg:hidden fixed top-0 left-0 right-0 h-16 z-50 px-4 flex items-center justify-between", 
        darkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white border-b border-gray-100")}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <img 
          src={darkMode 
            ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/fefc16c37_BasMichel_K102.png"
            : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/9370b8342_BasMichel_K152.png"
          }
          alt="Basmichel Logo" 
          className="h-6"
        />
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
        "fixed top-0 left-0 h-full w-64 z-50 transition-transform duration-300 ease-out",
        darkMode ? "bg-gray-800" : "bg-white",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-6">
            <Link to={createPageUrl('Home')} className="hover:opacity-80 transition-opacity block py-8">
              <img 
                src={darkMode 
                  ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/fefc16c37_BasMichel_K102.png"
                  : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/9370b8342_BasMichel_K152.png"
                }
                alt="Basmichel Logo" 
                className="h-16"
              />
            </Link>
          </div>

          {/* Badge & Portal Switcher */}
          <div className="px-6 pb-6 space-y-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              Editor Portal
            </span>
            {user?.role === 'admin' && (
              <Link 
                to={createPageUrl('AdminDashboard')}
                className={cn("block text-xs transition-colors",
                  darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-900"
                )}
              >
                Switch to Studio Manager →
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {editorPages.map((item) => {
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
                      ? darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-700"
                      : darkMode ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && (darkMode ? "text-purple-400" : "text-purple-700"))} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 mt-auto">
            <div className={cn("rounded-xl p-4", darkMode ? "bg-gray-700" : "bg-[#F8FAF7]")}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center",
                  darkMode ? "bg-purple-900/50" : "bg-purple-100"
                )}>
                  <span className={cn("text-sm font-medium", darkMode ? "text-purple-300" : "text-purple-700")}>
                    {editor.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", darkMode ? "text-gray-200" : "text-gray-900")}>
                    {editor.name || user.email}
                  </p>
                  <p className={cn("text-xs truncate", darkMode ? "text-gray-500" : "text-gray-400")}>{editor.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={cn("flex items-center gap-2 flex-1 px-3 py-2 text-sm rounded-lg transition-colors",
                    darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{darkMode ? 'Light' : 'Dark'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
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