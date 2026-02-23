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
  const { data: galleries = [], isLoading: galleriesLoading } = useQuery({
    queryKey: ['clientGalleries', clientId],
    queryFn: () => base44.entities.Gallery.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId,
  });

  // Get client projects with status klaar (for projects with files but no Gallery entity)
  const { data: klaarProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['clientProjectsKlaar', clientId],
    queryFn: () => base44.entities.Project.filter({ client_id: clientId, status: 'klaar' }, '-completed_date'),
    enabled: !!clientId,
  });

  // Fetch project files for klaar projects to find ones with delivery files but no Gallery
  const galleryProjectIds = new Set((galleries || []).map(g => g.project_id).filter(Boolean));

  const { data: projectsWithFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['clientProjectsWithFiles', clientId, klaarProjects?.length, [...galleryProjectIds]],
    queryFn: async () => {
      const projectsToCheck = (klaarProjects || []).filter(p => !galleryProjectIds.has(p.id));
      if (projectsToCheck.length === 0) return [];
      const results = [];
      for (const project of projectsToCheck) {
        const files = await base44.entities.ProjectFile.filter({ project_id: project.id });
        const deliveryFiles = files.filter(f =>
          ['bewerkte_fotos', 'bewerkte_videos', '360_matterport', 'meetrapport'].includes(f.category)
        );
        if (deliveryFiles.length > 0) {
          const firstImage = deliveryFiles.find(f => f.mime_type?.startsWith('image/'));
          results.push({
            project_id: project.id,
            title: project.title,
            cover_image_url: firstImage?.file_url,
            created_date: project.completed_date || project.updated_date || project.created_date,
          });
        }
      }
      return results;
    },
    enabled: !!clientId && klaarProjects.length > 0,
  });

  // Merge: galleries from DB + projects with files but no gallery
  const displayItems = [
    ...(galleries || []).map(g => ({
      project_id: g.project_id,
      title: g.title,
      cover_image_url: g.cover_image_url,
      created_date: g.created_date,
    })),
    ...(projectsWithFiles || []),
  ].filter(item => item.project_id).sort((a, b) => {
    const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
    const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
    return dateB - dateA;
  });

  const isLoading = galleriesLoading || (projectsLoading && galleries.length === 0);

  if (isLoading && displayItems.length === 0) {
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

      {displayItems.length === 0 ? (
        <EmptyState 
          icon={Images}
          title="Nog geen galerijen"
          description="Er zijn nog geen galerijen beschikbaar. Zodra je fotograaf een galerij publiceert, verschijnt deze hier."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item, index) => (
            <Link
              key={item.project_id || `item-${index}`}
              to={createPageUrl(`ProjectGalleryView?id=${item.project_id}`)}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {item.cover_image_url ? (
                  <img 
                    src={item.cover_image_url} 
                    alt={item.title}
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
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  <span>
                    {item.created_date && format(new Date(item.created_date), 'd MMMM yyyy', { locale: nl })}
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
