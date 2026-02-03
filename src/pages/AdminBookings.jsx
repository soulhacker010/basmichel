import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  Settings
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function AdminBookings() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false);
  const [isDayOverviewOpen, setIsDayOverviewOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
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

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list(),
  });

  const { data: sessionTypes = [] } = useQuery({
    queryKey: ['sessionTypes'],
    queryFn: () => base44.entities.SessionType.list(),
  });

  const { data: blockedTimes = [] } = useQuery({
    queryKey: ['blockedTimes'],
    queryFn: () => base44.entities.BlockedTime.list(),
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

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Session.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsSessionDialogOpen(false);
      setEditingSession(null);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.Session.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setDeleteSessionId(null);
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.SessionType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionTypes'] });
      setIsTypeDialogOpen(false);
      setEditingType(null);
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SessionType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionTypes'] });
      setIsTypeDialogOpen(false);
      setEditingType(null);
    },
  });

  const createBlockedMutation = useMutation({
    mutationFn: (data) => base44.entities.BlockedTime.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedTimes'] });
      setIsBlockedDialogOpen(false);
    },
  });

  // Calendar calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDay = (day) => {
    return sessions.filter(session => 
      session.start_datetime && isSameDay(new Date(session.start_datetime), day)
    );
  };

  const getBlockedForDay = (day) => {
    return blockedTimes.filter(blocked => 
      blocked.start_datetime && isSameDay(new Date(blocked.start_datetime), day)
    );
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'Geen klant';
    const user = users.find(u => u.id === client.user_id);
    return user?.full_name || client.company_name || 'Onbekend';
  };

  const getSessionTypeName = (typeId) => {
    const type = sessionTypes.find(t => t.id === typeId);
    return type?.name || 'Onbekend';
  };

  const handleSessionSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const startDate = formData.get('start_date');
    const startTime = formData.get('start_time');
    const endTime = formData.get('end_time');
    
    const data = {
      session_type_id: formData.get('session_type_id'),
      client_id: formData.get('client_id'),
      project_id: formData.get('project_id'),
      start_datetime: `${startDate}T${startTime}:00`,
      end_datetime: `${startDate}T${endTime}:00`,
      status: formData.get('status'),
      location: formData.get('location'),
      notes: formData.get('notes'),
    };

    if (editingSession) {
      updateSessionMutation.mutate({ id: editingSession.id, data });
    } else {
      createSessionMutation.mutate(data);
    }
  };

  const handleTypeSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      duration_minutes: parseInt(formData.get('duration_minutes')) || 60,
      is_public: formData.get('is_public') === 'on',
      is_active: formData.get('is_active') === 'on',
      color: formData.get('color'),
    };

    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate(data);
    }
  };

  const handleBlockedSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      start_datetime: `${formData.get('date')}T${formData.get('start_time')}:00`,
      end_datetime: `${formData.get('date')}T${formData.get('end_time')}:00`,
      reason: formData.get('reason'),
    };
    createBlockedMutation.mutate(data);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Boekingen"
        description="Beheer je sessies en kalender"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setEditingType(null);
                setIsTypeDialogOpen(true);
              }}
              className="border-[#A8B5A0] text-[#5C6B52] hover:bg-[#E8EDE5]"
            >
              <Settings className="w-4 h-4 mr-2" />
              Sessietypes
            </Button>
            <Button 
              onClick={() => {
                setEditingSession(null);
                setIsSessionDialogOpen(true);
              }}
              className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Sessie
            </Button>
          </div>
        }
      />

      {/* Calendar Navigation */}
      <div className={cn("rounded-xl mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <div className={cn("p-4 flex items-center justify-between border-b", darkMode ? "border-gray-700" : "border-gray-50")}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h2 className={cn("text-lg font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
              {format(currentDate, 'MMMM yyyy', { locale: nl })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Vandaag
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsBlockedDialogOpen(true)}
            >
              Tijd Blokkeren
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
              <div key={day} className={cn("text-center text-xs font-medium py-2", darkMode ? "text-gray-400" : "text-gray-500")}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const daySessions = getSessionsForDay(day);
              const dayBlocked = getBlockedForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsDayOverviewOpen(true);
                  }}
                  className={cn(
                    "min-h-24 p-1.5 rounded-lg border cursor-pointer transition-colors",
                    darkMode 
                      ? isCurrentMonth 
                        ? "bg-gray-700 border-gray-600" 
                        : "bg-gray-800 border-gray-700"
                      : isCurrentMonth 
                        ? "bg-white border-gray-100" 
                        : "bg-gray-50 border-gray-50",
                    isToday && "ring-2 ring-[#A8B5A0]",
                    "hover:border-[#A8B5A0]"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    darkMode 
                      ? isCurrentMonth ? "text-gray-100" : "text-gray-600"
                      : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {daySessions.slice(0, 2).map(session => {
                      const type = sessionTypes.find(t => t.id === session.session_type_id);
                      return (
                        <div
                          key={session.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate"
                          style={{ backgroundColor: type?.color || '#E8EDE5', color: '#5C6B52' }}
                        >
                          {session.start_datetime && format(new Date(session.start_datetime), 'HH:mm')} {session.location || 'Sessie'}
                        </div>
                      );
                    })}
                    {daySessions.length > 2 && (
                      <div className={cn("text-xs px-1.5", darkMode ? "text-gray-500" : "text-gray-400")}>
                        +{daySessions.length - 2} meer
                      </div>
                    )}
                    {dayBlocked.map(blocked => (
                      <div
                        key={blocked.id}
                        className={cn("text-xs px-1.5 py-0.5 rounded truncate", 
                          darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"
                        )}
                      >
                        Geblokkeerd
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Session Types List */}
      <div className={cn("rounded-xl p-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("text-lg font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>Sessietypes</h3>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingType(null);
              setIsTypeDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Toevoegen
          </Button>
        </div>
        {sessionTypes.length === 0 ? (
          <p className={cn("text-sm text-center py-8", darkMode ? "text-gray-400" : "text-gray-500")}>
            Nog geen sessietypes aangemaakt
          </p>
        ) : (
          <div className="space-y-2">
            {sessionTypes.map(type => (
              <div 
                key={type.id}
                className={cn("flex items-center justify-between p-3 rounded-lg border",
                  darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color || '#A8B5A0' }}
                  />
                  <div>
                    <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{type.name}</p>
                    <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>{type.duration_minutes} minuten</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!type.is_active && (
                    <span className={cn("text-xs px-2 py-0.5 rounded",
                      darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                    )}>Inactief</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingType(type);
                      setIsTypeDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Sessie Bewerken' : 'Nieuwe Sessie'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSessionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="session_type_id">Sessietype</Label>
              <select
                id="session_type_id"
                name="session_type_id"
                defaultValue={editingSession?.session_type_id || ''}
                className={cn("w-full mt-1.5 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]",
                  darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                )}
              >
                <option value="" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Selecteer type</option>
                {sessionTypes.map(type => (
                  <option key={type.id} value={type.id} className={darkMode ? "bg-gray-700 text-gray-100" : ""}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Klant</Label>
                <select
                  id="client_id"
                  name="client_id"
                  defaultValue={editingSession?.client_id || ''}
                  className={cn("w-full mt-1.5 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]",
                    darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                  )}
                >
                  <option value="" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Selecteer klant</option>
                  {clients.map(client => {
                    const user = users.find(u => u.id === client.user_id);
                    return (
                      <option key={client.id} value={client.id} className={darkMode ? "bg-gray-700 text-gray-100" : ""}>
                        {user?.full_name || client.company_name || 'Onbekend'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="project_id">Project</Label>
                <select
                  id="project_id"
                  name="project_id"
                  defaultValue={editingSession?.project_id || ''}
                  className={cn("w-full mt-1.5 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]",
                    darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                  )}
                >
                  <option value="" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Selecteer project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id} className={darkMode ? "bg-gray-700 text-gray-100" : ""}>{project.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_date">Datum</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={
                    editingSession?.start_datetime 
                      ? format(new Date(editingSession.start_datetime), 'yyyy-MM-dd')
                      : selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
                  }
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="start_time">Starttijd</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  defaultValue={
                    editingSession?.start_datetime 
                      ? format(new Date(editingSession.start_datetime), 'HH:mm')
                      : '09:00'
                  }
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">Eindtijd</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  defaultValue={
                    editingSession?.end_datetime 
                      ? format(new Date(editingSession.end_datetime), 'HH:mm')
                      : '10:00'
                  }
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Locatie</Label>
              <Input
                id="location"
                name="location"
                defaultValue={editingSession?.location || ''}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={editingSession?.status || 'aanvraag'}
                className={cn("w-full mt-1.5 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]",
                  darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                )}
              >
                <option value="aanvraag" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Aanvraag</option>
                <option value="wachten_op_klant" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Wachten op klant</option>
                <option value="bevestigd" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Bevestigd</option>
                <option value="afgerond" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Afgerond</option>
                <option value="geannuleerd" className={darkMode ? "bg-gray-700 text-gray-100" : ""}>Geannuleerd</option>
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingSession?.notes || ''}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex justify-between pt-4">
              <div>
                {editingSession && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => {
                      setDeleteSessionId(editingSession.id);
                      setIsSessionDialogOpen(false);
                    }}
                  >
                    Verwijderen
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsSessionDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                  {editingSession ? 'Opslaan' : 'Aanmaken'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Sessietype Bewerken' : 'Nieuw Sessietype'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTypeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingType?.name || ''}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingType?.description || ''}
                className="mt-1.5"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_minutes">Duur (minuten)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  defaultValue={editingType?.duration_minutes || 60}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="color">Kleur</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue={editingType?.color || '#A8B5A0'}
                  className={cn("mt-1.5 h-10", darkMode && "bg-gray-700 border-gray-600")}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editingType?.is_active !== false}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Actief</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_public"
                  defaultChecked={editingType?.is_public === true}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Openbaar</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTypeDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingType ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Blocked Time Dialog */}
      <Dialog open={isBlockedDialogOpen} onOpenChange={setIsBlockedDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tijd Blokkeren</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBlockedSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                name="date"
                type="date"
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Starttijd</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  defaultValue="09:00"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">Eindtijd</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  defaultValue="17:00"
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reden</Label>
              <Input
                id="reason"
                name="reason"
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsBlockedDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                Blokkeren
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Day Overview Dialog */}
      <Dialog open={isDayOverviewOpen} onOpenChange={setIsDayOverviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {selectedDate && getSessionsForDay(selectedDate)
              .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
              .map(session => {
                const type = sessionTypes.find(t => t.id === session.session_type_id);
                const client = clients.find(c => c.id === session.client_id);
                const user = users.find(u => u.id === client?.user_id);
                return (
                  <div 
                    key={session.id}
                    className={cn("p-4 rounded-lg border",
                      darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type?.color || '#A8B5A0' }}
                          />
                          <span className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
                            {format(new Date(session.start_datetime), 'HH:mm')} - {format(new Date(session.end_datetime), 'HH:mm')}
                          </span>
                          <span className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                            ({type?.duration_minutes || 60} min)
                          </span>
                        </div>
                        <p className={cn("text-sm font-medium mb-1", darkMode ? "text-gray-200" : "text-gray-700")}>
                          {type?.name || 'Onbekend type'}
                        </p>
                        {session.location && (
                          <div className={cn("flex items-center gap-1.5 text-sm mb-1", darkMode ? "text-gray-400" : "text-gray-600")}>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{session.location}</span>
                          </div>
                        )}
                        {client && (
                          <div className={cn("flex items-center gap-1.5 text-sm", darkMode ? "text-gray-400" : "text-gray-600")}>
                            <User className="w-3.5 h-3.5" />
                            <span>{client.contact_name || user?.full_name || client.company_name || 'Onbekend'}</span>
                          </div>
                        )}
                        {session.notes && (
                          <p className={cn("text-sm mt-2", darkMode ? "text-gray-400" : "text-gray-500")}>
                            {session.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={session.status} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingSession(session);
                            setIsDayOverviewOpen(false);
                            setIsSessionDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            {selectedDate && getBlockedForDay(selectedDate).map(blocked => (
              <div 
                key={blocked.id}
                className={cn("p-4 rounded-lg border",
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
                    {format(new Date(blocked.start_datetime), 'HH:mm')} - {format(new Date(blocked.end_datetime), 'HH:mm')}
                  </span>
                  <span className={cn("text-sm px-2 py-0.5 rounded",
                    darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"
                  )}>
                    Geblokkeerd
                  </span>
                </div>
                {blocked.reason && (
                  <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                    {blocked.reason}
                  </p>
                )}
              </div>
            ))}
            {selectedDate && getSessionsForDay(selectedDate).length === 0 && getBlockedForDay(selectedDate).length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className={cn("w-12 h-12 mx-auto mb-3", darkMode ? "text-gray-600" : "text-gray-300")} />
                <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                  Geen sessies of blokkades op deze dag
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDayOverviewOpen(false)}>
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Session Confirmation */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessie Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze sessie wilt verwijderen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteSessionMutation.mutate(deleteSessionId)}
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