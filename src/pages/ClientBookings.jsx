import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';

export default function ClientBookings() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDayOverviewOpen, setIsDayOverviewOpen] = useState(false);
  const [clientId, setClientId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: base44.auth.me,
  });

  const { data: client } = useQuery({
    queryKey: ['currentClient', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const clients = await base44.entities.Client.filter({ user_id: user.id });
      return clients[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (client) {
      setClientId(client.id);
    }
  }, [client]);

  const { data: sessions = [] } = useQuery({
    queryKey: ['clientSessions', clientId],
    queryFn: () => base44.entities.Session.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const { data: sessionTypes = [] } = useQuery({
    queryKey: ['sessionTypes'],
    queryFn: () => base44.entities.SessionType.list(),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getSessionsForDay = (day) => {
    return sessions.filter(session => {
      if (!session.start_datetime) return false;
      return isSameDay(new Date(session.start_datetime), day);
    });
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setIsDayOverviewOpen(true);
  };

  const selectedDaySessions = selectedDate ? getSessionsForDay(selectedDate) : [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Mijn Agenda"
        description="Bekijk al je geplande sessies en afspraken"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Vandaag
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
            <div key={day} className="bg-gray-50 px-3 py-2 text-center">
              <span className="text-xs font-medium text-gray-500">{day}</span>
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, idx) => {
            const daySessions = getSessionsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`bg-white min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'opacity-30' : ''
                }`}
              >
                <div className={`text-sm mb-1 ${isToday ? 'font-bold text-[#5C6B52]' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
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
                    <div className="text-xs text-gray-400 px-1.5">
                      +{daySessions.length - 2} meer
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Sessietypes</h3>
          <div className="flex flex-wrap gap-3">
            {sessionTypes.map(type => (
              <div key={type.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm text-gray-600">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day Overview Dialog */}
      <Dialog open={isDayOverviewOpen} onOpenChange={setIsDayOverviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDaySessions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Geen sessies op deze dag</p>
            ) : (
              selectedDaySessions
                .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
                .map(session => {
                  const type = sessionTypes.find(t => t.id === session.session_type_id);
                  return (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type?.color || '#E8EDE5' }}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{type?.name || 'Sessie'}</h4>
                            <p className="text-sm text-gray-500">
                              {session.start_datetime && format(new Date(session.start_datetime), 'HH:mm')} - 
                              {session.end_datetime && format(new Date(session.end_datetime), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={session.status} />
                      </div>

                      {session.location && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Locatie:</span> {session.location}
                        </div>
                      )}

                      {session.notes && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Notities:</span> {session.notes}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}