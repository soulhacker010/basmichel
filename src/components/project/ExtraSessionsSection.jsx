import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Plus, Calendar, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig = {
  aanvraag: { label: 'Aanvraag', color: 'bg-gray-100 text-gray-700' },
  wachten_op_klant: { label: 'Wacht op klant', color: 'bg-yellow-100 text-yellow-700' },
  bevestigd: { label: 'Bevestigd', color: 'bg-green-100 text-green-700' },
  afgerond: { label: 'Afgerond', color: 'bg-blue-100 text-blue-700' },
  geannuleerd: { label: 'Geannuleerd', color: 'bg-red-100 text-red-700' },
};

export default function ExtraSessionsSection({ projectId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_datetime: '',
    end_datetime: '',
    location: '',
    notes: '',
    status: 'bevestigd',
  });

  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['extraSessions', projectId],
    queryFn: () => base44.entities.Session.filter({ project_id: projectId }, '-start_datetime'),
    enabled: !!projectId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
    enabled: !!projectId,
  });

  const { data: sessionTypes = [] } = useQuery({
    queryKey: ['sessionTypes'],
    queryFn: () => base44.entities.SessionType.list(),
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data) => {
      const session = await base44.entities.Session.create(data);

      try {
        const response = await base44.functions.invoke('calendarSession', {
          action: 'syncSessionEvent',
          sessionData: {
            session_type_id: data.session_type_id,
            client_id: data.client_id,
            start_datetime: data.start_datetime,
            end_datetime: data.end_datetime || null,
            location: data.location || '',
            notes: data.notes || '',
          },
          calendarEventId: null,
        });

        const calendarData = response?.data || response;
        if (calendarData?.calendarEventId) {
          await base44.entities.Session.update(session.id, {
            google_calendar_event_id: calendarData.calendarEventId,
          });
        }
      } catch (error) {
        console.error('Failed to sync extra session to calendar:', error);
      }

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraSessions', projectId] });
      setDialogOpen(false);
      setFormData({
        start_datetime: '',
        end_datetime: '',
        location: '',
        notes: '',
        status: 'bevestigd',
      });
      toast.success('Extra sessie toegevoegd');
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id) => {
      // Get session to check for calendar event ID
      const session = await base44.entities.Session.get(id);

      // Delete from Google Calendar first
      if (session?.google_calendar_event_id) {
        try {
          await base44.functions.invoke('calendarSession', {
            action: 'deleteSessionEvent',
            calendarEventId: session.google_calendar_event_id
          });
        } catch (error) {
          console.error('Failed to delete from calendar:', error);
        }
      }

      return await base44.entities.Session.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraSessions', projectId] });
      toast.success('Sessie verwijderd');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const sessionTypeId = sessionTypes.find(st => st.name === 'Extra Sessie')?.id || sessionTypes?.[0]?.id || null;

    createSessionMutation.mutate({
      ...formData,
      project_id: projectId,
      client_id: project?.client_id || null,
      session_type_id: sessionTypeId,
    });
  };

  return (
    <>
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="mb-4">Nog geen extra sessies gepland</p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Extra Sessie Toevoegen
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Extra Sessie Toevoegen
              </Button>
            </div>
            {sessions.map(session => (
              <div key={session.id} className="border border-gray-100 rounded-xl p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {session.start_datetime && format(new Date(session.start_datetime), 'd MMMM yyyy HH:mm', { locale: nl })}
                        {session.end_datetime && ` - ${format(new Date(session.end_datetime), 'HH:mm')}`}
                      </p>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusConfig[session.status]?.color)}>
                        {statusConfig[session.status]?.label}
                      </span>
                    </div>
                    {session.location && (
                      <p className="text-sm text-gray-600 mb-2">📍 {session.location}</p>
                    )}
                    {session.notes && (
                      <p className="text-sm text-gray-500 mt-2">{session.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Weet je zeker dat je deze sessie wilt verwijderen?')) {
                        deleteSessionMutation.mutate(session.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extra Sessie Toevoegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="start_datetime">Startdatum & tijd *</Label>
              <Input
                id="start_datetime"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="end_datetime">Einddatum & tijd</Label>
              <Input
                id="end_datetime"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="location">Locatie</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Adres of locatie"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Extra informatie..."
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#5C6B52] hover:bg-[#4A5641] text-white">
                Sessie Toevoegen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
