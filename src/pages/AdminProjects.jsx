import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  FolderKanban, 
  Search,
  MapPin,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  User
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AdminProjects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      setEditingProject(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      setEditingProject(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteId(null);
    },
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(search.toLowerCase()) ||
      project.address?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      client_id: formData.get('client_id'),
      status: formData.get('status'),
      description: formData.get('description'),
      address: formData.get('address'),
      scheduled_date: formData.get('scheduled_date'),
    };

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'Geen klant';
    const user = users.find(u => u.id === client.user_id);
    return user?.full_name || client.company_name || 'Onbekend';
  };

  const statusCounts = {
    all: projects.length,
    lead: projects.filter(p => p.status === 'lead').length,
    in_behandeling: projects.filter(p => p.status === 'in_behandeling').length,
    afgerond: projects.filter(p => p.status === 'afgerond').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Projecten"
        description="Beheer al je vastgoedprojecten"
        actions={
          <Button 
            onClick={() => {
              setEditingProject(null);
              setIsDialogOpen(true);
            }}
            className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Project
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Zoek op titel of adres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all">Alle ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="lead">Lead ({statusCounts.lead})</TabsTrigger>
            <TabsTrigger value="in_behandeling">In behandeling ({statusCounts.in_behandeling})</TabsTrigger>
            <TabsTrigger value="afgerond">Afgerond ({statusCounts.afgerond})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Projects */}
      {filteredProjects.length === 0 ? (
        <EmptyState 
          icon={FolderKanban}
          title={search || statusFilter !== 'all' ? "Geen resultaten" : "Nog geen projecten"}
          description={search || statusFilter !== 'all' ? "Probeer andere filters" : "Maak je eerste project aan"}
          action={
            !search && statusFilter === 'all' && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuw Project
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filteredProjects.map(project => (
              <div 
                key={project.id}
                className="p-6 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{project.title}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{getClientName(project.client_id)}</span>
                      </div>
                      {project.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{project.address}</span>
                        </div>
                      )}
                      {project.scheduled_date && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span>{format(new Date(project.scheduled_date), 'd MMMM yyyy', { locale: nl })}</span>
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingProject(project);
                        setIsDialogOpen(true);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(project.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Project Bewerken' : 'Nieuw Project'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingProject?.title || ''}
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Klant</Label>
                <select
                  id="client_id"
                  name="client_id"
                  defaultValue={editingProject?.client_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
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
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={editingProject?.status || 'lead'}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="lead">Lead</option>
                  <option value="in_behandeling">In behandeling</option>
                  <option value="afgerond">Afgerond</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                name="address"
                defaultValue={editingProject?.address || ''}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="scheduled_date">Geplande Datum</Label>
              <Input
                id="scheduled_date"
                name="scheduled_date"
                type="date"
                defaultValue={editingProject?.scheduled_date || ''}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingProject?.description || ''}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingProject ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Project Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit project wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
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