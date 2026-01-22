import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  Images, 
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Eye,
  Globe,
  Lock,
  Archive,
  ExternalLink,
  X,
  Image as ImageIcon
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createPageUrl } from '@/utils';

export default function AdminGalleries() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const queryClient = useQueryClient();

  const { data: galleries = [] } = useQuery({
    queryKey: ['galleries'],
    queryFn: () => base44.entities.Gallery.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: mediaItems = [] } = useQuery({
    queryKey: ['mediaItems', selectedGallery?.id],
    queryFn: () => selectedGallery ? base44.entities.MediaItem.filter({ gallery_id: selectedGallery.id }, 'order') : [],
    enabled: !!selectedGallery,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Gallery.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      setIsDialogOpen(false);
      setEditingGallery(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Gallery.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      setIsDialogOpen(false);
      setEditingGallery(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Gallery.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      setDeleteId(null);
    },
  });

  const createMediaMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems', selectedGallery?.id] });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id) => base44.entities.MediaItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems', selectedGallery?.id] });
    },
  });

  const filteredGalleries = galleries.filter(gallery => {
    const matchesSearch = gallery.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gallery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const projectId = formData.get('project_id');
    const project = projects.find(p => p.id === projectId);
    const title = project?.title || 'Galerij';
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const data = {
      title,
      slug,
      client_id: formData.get('client_id'),
      project_id: projectId,
      status: formData.get('status'),
    };

    if (editingGallery) {
      updateMutation.mutate({ id: editingGallery.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedGallery) return;

    setUploading(true);
    
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await createMediaMutation.mutateAsync({
          gallery_id: selectedGallery.id,
          type: 'afbeelding',
          file_url,
          thumbnail_url: file_url,
          filename: file.name,
          order: mediaItems.length,
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setUploading(false);
    fileInputRef.current.value = '';
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'Geen klant';
    const user = users.find(u => u.id === client.user_id);
    return user?.full_name || client.company_name || 'Onbekend';
  };

  const getMediaCount = (galleryId) => {
    // This would need to be fetched separately for each gallery in a real scenario
    return '—';
  };

  const statusCounts = {
    all: galleries.length,
    concept: galleries.filter(g => g.status === 'concept').length,
    gepubliceerd: galleries.filter(g => g.status === 'gepubliceerd').length,
    gearchiveerd: galleries.filter(g => g.status === 'gearchiveerd').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Galerijen"
        description="Beheer je fotogalerijen"
        actions={
          <Button 
            onClick={() => {
              setEditingGallery(null);
              setIsDialogOpen(true);
            }}
            className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Galerij
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Zoek op titel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all">Alle ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="concept">Concept ({statusCounts.concept})</TabsTrigger>
            <TabsTrigger value="gepubliceerd">Gepubliceerd ({statusCounts.gepubliceerd})</TabsTrigger>
            <TabsTrigger value="gearchiveerd">Gearchiveerd ({statusCounts.gearchiveerd})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Galleries */}
      {filteredGalleries.length === 0 ? (
        <EmptyState 
          icon={Images}
          title={search || statusFilter !== 'all' ? "Geen resultaten" : "Nog geen galerijen"}
          description={search || statusFilter !== 'all' ? "Probeer andere filters" : "Maak je eerste galerij aan"}
          action={
            !search && statusFilter === 'all' && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Galerij
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGalleries.map(gallery => (
            <div 
              key={gallery.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow"
            >
              {/* Cover Image */}
              <div className="aspect-video bg-gray-100 relative">
                {gallery.cover_image_url ? (
                  <img 
                    src={gallery.cover_image_url} 
                    alt={gallery.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={gallery.status} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{gallery.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedGallery(gallery);
                        setIsUploadDialogOpen(true);
                      }}>
                        <Upload className="w-4 h-4 mr-2" />
                        Media Uploaden
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        window.open(createPageUrl(`GalleryView?slug=${gallery.slug}`), '_blank');
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        Bekijken
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setEditingGallery(gallery);
                        setIsDialogOpen(true);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(gallery.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {getClientName(gallery.client_id)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {gallery.created_date && format(new Date(gallery.created_date), 'd MMM yyyy', { locale: nl })}
                  </span>
                  {gallery.status === 'gepubliceerd' ? (
                    <Globe className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGallery ? 'Galerij Bewerken' : 'Nieuwe Galerij'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Klant *</Label>
                <select
                  id="client_id"
                  name="client_id"
                  defaultValue={editingGallery?.client_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                  required
                >
                  <option value="">Selecteer klant</option>
                  {clients.map(client => {
                    const user = users.find(u => u.id === client.user_id);
                    return (
                      <option key={client.id} value={client.id}>
                        {user?.full_name || client.company_name || 'Onbekend'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="project_id">Project *</Label>
                <select
                  id="project_id"
                  name="project_id"
                  defaultValue={editingGallery?.project_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                  required
                >
                  <option value="">Selecteer project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                name="status"
                defaultValue={editingGallery?.status || 'concept'}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
              >
                <option value="concept">Concept</option>
                <option value="gepubliceerd">Gepubliceerd</option>
                <option value="gearchiveerd">Gearchiveerd</option>
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Let op:</strong> De titel en URL-slug worden automatisch gegenereerd op basis van de projecttitel.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingGallery ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Uploaden - {selectedGallery?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#A8B5A0] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">Klik om bestanden te selecteren</p>
              <p className="text-sm text-gray-400">of sleep ze hierheen</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploading && (
              <div className="text-center text-sm text-gray-500">
                Uploaden...
              </div>
            )}

            {/* Media Grid */}
            {mediaItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Geüploade media ({mediaItems.length})
                </h4>
                <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                  {mediaItems.map(item => (
                    <div key={item.id} className="relative group aspect-square">
                      <img 
                        src={item.thumbnail_url || item.file_url} 
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => deleteMediaMutation.mutate(item.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Galerij Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze galerij wilt verwijderen? Alle media in deze galerij wordt ook verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}