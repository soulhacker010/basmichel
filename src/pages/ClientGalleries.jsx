import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Images, 
  Calendar,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function ClientGalleries() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error('Error loading user:', e);
      }
    };
    loadUser();
  }, []);

  // Get client record for current user
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && clients.length > 0) {
      const client = clients.find(c => c.user_id === user.id);
      if (client) {
        setClientId(client.id);
      }
    }
  }, [user, clients]);

  // Get galleries for this client
  const { data: galleries = [], isLoading } = useQuery({
    queryKey: ['clientGalleries', clientId],
    queryFn: () => base44.entities.Gallery.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Mijn Galerijen" />
        <div className="text-center py-12 text-gray-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Mijn Galerijen"
        description="Bekijk je fotogalerijen"
      />

      {galleries.length === 0 ? (
        <EmptyState 
          icon={Images}
          title="Nog geen galerijen"
          description="Er zijn nog geen galerijen beschikbaar. Zodra je fotograaf een galerij publiceert, verschijnt deze hier."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map(gallery => (
            <Link
              key={gallery.id}
              to={createPageUrl(`GalleryView?slug=${gallery.slug}`)}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {gallery.cover_image_url ? (
                  <img 
                    src={gallery.cover_image_url} 
                    alt={gallery.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-3 shadow-lg">
                      <Eye className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-gray-900 mb-2 group-hover:text-[#5C6B52] transition-colors">
                    {gallery.title}
                  </h3>
                  {gallery.status && gallery.status !== 'gepubliceerd' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      Concept
                    </span>
                  )}
                </div>
                {gallery.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{gallery.description}</p>
                )}
                <div className="flex items-center text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  <span>
                    {gallery.created_date && format(new Date(gallery.created_date), 'd MMMM yyyy', { locale: nl })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
