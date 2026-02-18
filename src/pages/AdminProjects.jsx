import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function AdminProjects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const queryClient = useQueryClient();

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

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    staleTime: 0, // Always fetch fresh data
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: sessionTypes = [] } = useQuery({
    queryKey: ['sessionTypes'],
    queryFn: () => base44.entities.SessionType.filter({ is_active: true }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Get or create counter
      const counters = await base44.entities.ProjectCounter.list();
      let nextNumber = 202700;
      let counterId = null;

      if (counters.length > 0) {
        nextNumber = counters[0].last_number + 1;
        counterId = counters[0].id;
      }

      // Update or create counter
      if (counterId) {
        await base44.entities.ProjectCounter.update(counterId, { last_number: nextNumber });
      } else {
        await base44.entities.ProjectCounter.create({ last_number: nextNumber });
      }

      const projectData = {
        ...data,
        project_number: nextNumber.toString(),
        title: `${data.address}${data.city ? ', ' + data.city : ''}`, // Title = Full Address (street + city)
      };

      const project = await base44.entities.Project.create(projectData);

      // Create session with session type
      if (data.shoot_date && data.shoot_time && data.session_type_id) {
        const sessionType = await base44.entities.SessionType.get(data.session_type_id);
        const duration = sessionType?.duration_minutes || 60;
        
        const startDateTime = new Date(`${data.shoot_date}T${data.shoot_time}`);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
        
        const session = await base44.entities.Session.create({
          session_type_id: data.session_type_id,
          client_id: data.client_id,
          project_id: project.id,
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          status: 'bevestigd',
          location: projectData.title,
          notes: data.notes,
        });

        // Auto-sync to Google Calendar
        try {
          const { data: calendarResponse } = await base44.functions.invoke('calendarSession', {
            action: 'syncSessionEvent',
            sessionData: {
              session_type_id: data.session_type_id,
              start_datetime: startDateTime.toISOString(),
              end_datetime: endDateTime.toISOString(),
              location: projectData.title,
            },
            calendarEventId: null,
          });

          // Save the calendar event ID to the session
          if (calendarResponse?.calendarEventId) {
            await base44.entities.Session.update(session.id, {
              google_calendar_event_id: calendarResponse.calendarEventId,
            });
          }
        } catch (calendarError) {
          console.error('Auto calendar sync failed:', calendarError);
          // Don't fail project creation if calendar sync fails
        }
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['clientProjects'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
      setIsDialogOpen(false);
      setEditingProject(null);
      toast.success('Project aangemaakt');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['clientProjects'] });
      setIsDialogOpen(false);
      setEditingProject(null);
      toast.success('Project bijgewerkt');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // First get the project to check for calendar event ID
      const project = projects.find(p => p.id === id);

      // Delete associated sessions and calendar events
      const sessions = await base44.entities.Session.filter({ project_id: id });
      for (const session of sessions) {
        if (session.google_calendar_event_id) {
          try {
            await base44.functions.invoke('calendarSession', {
              action: 'deleteSessionEvent',
              calendarEventId: session.google_calendar_event_id,
            });
          } catch (calendarError) {
            console.error('Failed to delete session calendar event:', calendarError);
          }
        }
        await base44.entities.Session.delete(session.id);
      }

      // Delete calendar event if it exists
      if (project?.calendar_event_id) {
        try {
          await base44.functions.invoke('calendar', {
            action: 'deleteEvent',
            calendarEventId: project.calendar_event_id,
          });
        } catch (calendarError) {
          console.error('Failed to delete calendar event:', calendarError);
          // Continue with project deletion even if calendar delete fails
        }
      }

      // Delete related bookings first
      const relatedBookings = await base44.entities.Booking.filter({ project_id: id });
      for (const booking of relatedBookings) {
        await base44.entities.Booking.delete(booking.id);
      }

      // Delete related invoices
      const relatedInvoices = await base44.entities.ProjectInvoice.filter({ project_id: id });
      for (const invoice of relatedInvoices) {
        await base44.entities.ProjectInvoice.delete(invoice.id);
      }

      // Delete related files
      const relatedFiles = await base44.entities.ProjectFile.filter({ project_id: id });
      for (const file of relatedFiles) {
        await base44.entities.ProjectFile.delete(file.id);
      }

      // Finally delete the project itself
      await base44.entities.Project.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['clientProjects'] });
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['clientInvoices'] });
      setDeleteId(null);
      toast.success('Project verwijderd');
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

    const address = formData.get('address');
    const city = formData.get('city');
    const shoot_date = formData.get('shoot_date');
    const shoot_time = formData.get('shoot_time');
    const client_id = formData.get('client_id');
    const session_type_id = formData.get('session_type_id');

    // Validation for create
    if (!editingProject) {
      if (!address || !city || !shoot_date || !shoot_time || !client_id || !session_type_id) {
        toast.error('Vul alle verplichte velden in');
        return;
      }
    }

    const data = {
      address,
      city,
      shoot_date,
      shoot_time,
      client_id,
      session_type_id,
      status: formData.get('status'),
      notes: formData.get('notes'),
    };

    if (editingProject) {
      data.title = formData.get('title');
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return '-';
    const user = users.find(u => u.id === client.user_id);
    const fullName = user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.full_name;
    return fullName || client.company_name || '-';
  };

  const statusCounts = {
    all: projects.length,
    geboekt: projects.filter(p => p.status === 'geboekt').length,
    shoot_uitgevoerd: projects.filter(p => p.status === 'shoot_uitgevoerd').length,
    wordt_bewerkt: projects.filter(p => p.status === 'wordt_bewerkt').length,
    klaar: projects.filter(p => p.status === 'klaar').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Pixieset style */}
      <div className="flex items-center justify-between mb-8">
        <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>Projecten</h1>
        <Button
          onClick={() => {
            setEditingProject(null);
            setIsDialogOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white rounded px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuw Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
          <Input
            placeholder="Zoek project of contactnaam"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded border-gray-200"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="shrink-0">
          <TabsList className={cn("h-10 border", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
            <TabsTrigger value="all" className="text-sm">Alle Projecten</TabsTrigger>
            <TabsTrigger value="geboekt" className="text-sm">Geboekt</TabsTrigger>
            <TabsTrigger value="shoot_uitgevoerd" className="text-sm">Shoot uitgevoerd</TabsTrigger>
            <TabsTrigger value="wordt_bewerkt" className="text-sm">Wordt bewerkt</TabsTrigger>
            <TabsTrigger value="klaar" className="text-sm">Klaar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className={cn("rounded-lg p-16 text-center border", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <FolderKanban className={cn("w-12 h-12 mx-auto mb-4", darkMode ? "text-gray-600" : "text-gray-300")} />
          <p className={cn("font-medium mb-1", darkMode ? "text-gray-100" : "text-gray-900")}>Geen projecten gevonden</p>
          <p className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>Probeer je filters aan te passen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <Link
              key={project.id}
              to={`${createPageUrl('AdminProjectDetail')}?id=${project.id}`}
              className={cn("rounded-lg border p-5 hover:shadow-sm transition-all group block",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-medium truncate", darkMode ? "text-gray-100" : "text-gray-900")}>{project.title}</h3>
                  <p className={cn("text-sm truncate", darkMode ? "text-gray-400" : "text-gray-500")}>{getClientName(project.client_id)}</p>
                  {(() => {
                    const client = clients.find(c => c.id === project.client_id);
                    return client?.company_name && (
                      <p className={cn("text-xs truncate", darkMode ? "text-gray-500" : "text-gray-400")}>{client.company_name}</p>
                    );
                  })()}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      setEditingProject(project);
                      setIsDialogOpen(true);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Bewerken
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteId(project.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Verwijderen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <StatusBadge status={project.status} />
                {project.shoot_date && (
                  <span className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
                    {format(new Date(project.shoot_date), 'd MMM yyyy', { locale: nl })}
                    {project.shoot_time && ` • ${project.shoot_time}`}
                  </span>
                )}
              </div>


            </Link>
          ))}
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
            {/* Address and City Fields - Required for new projects */}
            {!editingProject && (
              <>
                <div>
                  <Label htmlFor="address">Straat + Huisnummer *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Straatnaam huisnummer"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Plaats *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Plaatsnaam"
                    className="mt-1.5"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Dit wordt samen de projecttitel</p>
                </div>
              </>
            )}

            {/* Title - Only for editing */}
            {editingProject && (
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
            )}

            {/* Session Type - Only for new projects */}
            {!editingProject && (
              <div>
                <Label htmlFor="session_type_id">Sessietype *</Label>
                <select
                  id="session_type_id"
                  name="session_type_id"
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecteer sessietype</option>
                  {sessionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.duration_minutes || 60} min)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Shoot Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shoot_date">Shootdatum {!editingProject && '*'}</Label>
                <Input
                  id="shoot_date"
                  name="shoot_date"
                  type="date"
                  defaultValue={editingProject?.shoot_date || ''}
                  className="mt-1.5"
                  required={!editingProject}
                />
              </div>
              <div>
                <Label htmlFor="shoot_time">Starttijd {!editingProject && '*'}</Label>
                <Input
                  id="shoot_time"
                  name="shoot_time"
                  type="time"
                  defaultValue={editingProject?.shoot_time || ''}
                  className="mt-1.5"
                  required={!editingProject}
                />
              </div>
            </div>

            {/* Client */}
            <div>
              <Label htmlFor="client_id">Klant *</Label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={editingProject?.client_id || ''}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecteer klant</option>
                {clients.map(client => {
                  const user = users.find(u => u.id === client.user_id);
                  const fullName = user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.full_name;
                  return (
                    <option key={client.id} value={client.id}>
                      {fullName || client.company_name || 'Onbekend'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={editingProject?.status || 'geboekt'}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="geboekt">Geboekt</option>
                <option value="shoot_uitgevoerd">Shoot uitgevoerd</option>
                <option value="wordt_bewerkt">Wordt bewerkt</option>
                <option value="klaar">Klaar</option>
              </select>
            </div>

            {/* Address and City - For editing only */}
            {editingProject && (
              <>
                <div>
                  <Label htmlFor="address">Straat + Huisnummer</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingProject?.address || ''}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Plaats</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={editingProject?.city || ''}
                    className="mt-1.5"
                  />
                </div>
              </>
            )}

            {/* Internal Notes */}
            <div>
              <Label htmlFor="notes">Interne notities</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingProject?.notes || ''}
                className="mt-1.5"
                rows={3}
                placeholder="Notities voor intern gebruik..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
