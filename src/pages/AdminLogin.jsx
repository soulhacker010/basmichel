import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        if (user.role === 'admin') {
          window.location.href = createPageUrl('AdminDashboard');
        } else {
          window.location.href = createPageUrl('ClientDashboard');
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('AdminDashboard'));
  };

  return (
    <div className="min-h-screen bg-[#FCFCFB] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">Studio Manager</h1>
          <p className="text-gray-400">Log in met beheerdersrechten</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <Button 
            onClick={handleLogin}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full h-12 mb-6"
          >
            Inloggen als beheerder
          </Button>
          
          <div className="text-center">
            <a 
              href={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}