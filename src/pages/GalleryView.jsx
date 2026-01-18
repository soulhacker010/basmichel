import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Images, 
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function GalleryView() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

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

  const { data: galleries = [] } = useQuery({
    queryKey: ['galleries'],
    queryFn: () => base44.entities.Gallery.list(),
    enabled: !loading,
  });

  const gallery = galleries.find(g => g.slug === slug);

  const { data: mediaItems = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['mediaItems', gallery?.id],
    queryFn: () => base44.entities.MediaItem.filter({ gallery_id: gallery.id }, 'order'),
    enabled: !!gallery,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user,
  });

  // Check if user has access
  const hasAccess = () => {
    if (!gallery) return false;
    if (!user) return false;
    
    // Admin always has access
    if (user.role === 'admin') return true;
    
    // Check if user is the client
    const client = clients.find(c => c.user_id === user.id);
    if (client && gallery.client_id === client.id) return true;
    
    return false;
  };

  const handleKeyDown = (e) => {
    if (selectedIndex === null) return;
    if (e.key === 'ArrowRight') {
      setSelectedIndex(prev => (prev + 1) % mediaItems.length);
    } else if (e.key === 'ArrowLeft') {
      setSelectedIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length);
    } else if (e.key === 'Escape') {
      setSelectedIndex(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, mediaItems.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="animate-pulse text-[#A8B5A0]">Laden...</div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <Images className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-gray-900 mb-2">Galerij niet gevonden</h1>
          <p className="text-gray-500">Deze galerij bestaat niet of is niet meer beschikbaar.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess()) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full mx-4 text-center">
          <Images className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-gray-900 mb-2">Toegang vereist</h1>
          <p className="text-gray-500 mb-6">Log in om deze galerij te bekijken.</p>
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

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="font-medium text-gray-900">{gallery.title}</h1>
                <p className="text-xs text-gray-500">{mediaItems.length} foto's</p>
              </div>
            </div>
            <span className="text-sm font-light text-gray-500">Basmichel</span>
          </div>
        </div>
      </header>

      {/* Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mediaItems.length === 0 ? (
          <div className="text-center py-16">
            <Images className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Nog geen foto's</h2>
            <p className="text-gray-500">Deze galerij bevat nog geen media.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setSelectedIndex(index)}
              >
                <img 
                  src={item.thumbnail_url || item.file_url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/70 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length);
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/70 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(prev => (prev + 1) % mediaItems.length);
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img 
                src={mediaItems[selectedIndex]?.file_url}
                alt=""
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {selectedIndex + 1} / {mediaItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}