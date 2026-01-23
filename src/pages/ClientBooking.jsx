import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Calendar,
  Clock,
  MapPin,
  Camera,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, startOfWeek, addWeeks, isSameDay, setHours, setMinutes, addMinutes, isAfter, isBefore } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ClientBooking() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    postal_code: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && clients.length > 0) {
      const client = clients.find(c => c.user_id === user.id);
      if (client) setClientId(client.id);
    }
  }, [user, clients]);

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['sessionTypes'],
    queryFn: () => base44.entities.SessionType.filter({ is_active: true }),
  });

  const { data: existingSessions = [] } = useQuery({
    queryKey: ['existingSessions'],
    queryFn: () => base44.entities.Session.filter({ status: 'bevestigd' }),
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['availability'],
    queryFn: () => base44.entities.Availability.filter({ is_active: true }),
  });

  // Generate week days
  const getWeekDays = () => {
    const start = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  // Check Google Calendar availability
  const checkGoogleCalendarAvailability = async (startTime, endTime) => {
    try {
      const response = await base44.functions.invoke('checkCalendarAvailability', {
        start_datetime: startTime.toISOString(),
        end_datetime: endTime.toISOString()
      });
      return response.data.available;
    } catch (error) {
      console.warn('Calendar check failed:', error);
      return true; // Fallback to available if check fails
    }
  };

  // Generate available time slots for a date
  const getTimeSlots = (date) => {
    if (!date || !selectedService) return [];
    
    const dayOfWeek = date.getDay();
    const workdayConfig = availability.find(a => a.type === 'werkdag' && a.day_of_week === dayOfWeek);
    
    // Default to 9-17 if no config
    const startHour = workdayConfig?.start_time ? parseInt(workdayConfig.start_time.split(':')[0]) : 9;
    const endHour = workdayConfig?.end_time ? parseInt(workdayConfig.end_time.split(':')[0]) : 17;
    
    const slots = [];
    const duration = selectedService.duration_minutes || 60;
    const buffer = 30; // Buffer between sessions
    
    let currentTime = setMinutes(setHours(date, startHour), 0);
    const endTime = setMinutes(setHours(date, endHour), 0);
    
    while (isBefore(addMinutes(currentTime, duration), endTime) || isSameDay(addMinutes(currentTime, duration), endTime)) {
      // Check if slot conflicts with existing sessions
      const slotEnd = addMinutes(currentTime, duration);
      const hasConflict = existingSessions.some(session => {
        const sessionStart = new Date(session.start_datetime);
        const sessionEnd = new Date(session.end_datetime);
        return (
          (isAfter(currentTime, sessionStart) && isBefore(currentTime, sessionEnd)) ||
          (isAfter(slotEnd, sessionStart) && isBefore(slotEnd, sessionEnd)) ||
          (isBefore(currentTime, sessionStart) && isAfter(slotEnd, sessionEnd)) ||
          isSameDay(currentTime, sessionStart) && format(currentTime, 'HH:mm') === format(sessionStart, 'HH:mm')
        );
      });
      
      if (!hasConflict && isAfter(currentTime, new Date())) {
        slots.push(new Date(currentTime));
      }
      
      currentTime = addMinutes(currentTime, 30);
    }
    
    return slots;
  };

  const handleSubmit = async () => {
    if (!clientId || !selectedService || !selectedDate || !selectedTime || !formData.address || !formData.city) {
      toast.error('Vul alle velden in');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDatetime = selectedTime;
      const endDatetime = addMinutes(startDatetime, selectedService.duration_minutes || 60);

      // Check Google Calendar availability before booking
      const isAvailable = await checkGoogleCalendarAvailability(startDatetime, endDatetime);
      if (!isAvailable) {
        toast.error('Dit tijdslot is niet meer beschikbaar. Kies een ander tijdstip.');
        setIsSubmitting(false);
        return;
      }

      // Get or create counter for project number
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

      // Create project with all booking data
      const projectTitle = `${formData.address}${formData.city ? `, ${formData.city}` : ''}`;
      const project = await base44.entities.Project.create({
        project_number: nextNumber.toString(),
        title: projectTitle,
        client_id: clientId,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        shoot_date: format(selectedDate, 'yyyy-MM-dd'),
        shoot_time: format(selectedTime, 'HH:mm'),
        status: 'geboekt',
        notes: formData.notes || '',
      });

      // Create Dropbox folder for project
      try {
        const folderName = `${nextNumber} - ${projectTitle}`;
        await base44.functions.invoke('createDropboxFolder', { folderName });
      } catch (folderError) {
        console.warn('Dropbox folder creation failed:', folderError);
      }

      // Create booking (which will auto-sync to Google Calendar via automation)
      await base44.entities.Booking.create({
        project_id: project.id,
        client_id: clientId,
        service_type: selectedService.slug || selectedService.name.toLowerCase().replace(/\s+/g, '_'),
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        duration_minutes: selectedService.duration_minutes || 60,
        status: 'bevestigd',
        address: formData.address,
        city: formData.city,
        notes: formData.notes || '',
      });

      // Create session
      await base44.entities.Session.create({
        session_type_id: selectedService.id,
        client_id: clientId,
        project_id: project.id,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        status: 'bevestigd',
        location: `${formData.address}${formData.city ? `, ${formData.city}` : ''}`,
        notes: formData.notes || '',
      });

      // Create client notification
      await base44.entities.Notification.create({
        client_id: clientId,
        user_id: user.id,
        type: 'boeking_bevestigd',
        title: 'Boeking bevestigd',
        message: `Uw shoot is bevestigd voor ${format(startDatetime, 'd MMMM yyyy', { locale: nl })} om ${format(startDatetime, 'HH:mm')}`,
        project_id: project.id,
      });

      // Create admin notification
      await base44.entities.Notification.create({
        type: 'nieuwe_sessie',
        title: 'Nieuwe sessie geboekt',
        message: `${user.full_name || user.email.split('@')[0]} heeft een ${selectedService.name} geboekt voor ${format(startDatetime, 'd MMMM yyyy', { locale: nl })} om ${format(startDatetime, 'HH:mm')}`,
        project_id: project.id,
      });

      // Send confirmation email
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: 'Boeking bevestigd - Basmichel',
          body: `
Beste ${user.full_name || user.email.split('@')[0]},

Uw fotoshoot is bevestigd!

Details:
- Dienst: ${selectedService.name}
- Datum: ${format(startDatetime, 'd MMMM yyyy', { locale: nl })}
- Tijd: ${format(startDatetime, 'HH:mm')} - ${format(endDatetime, 'HH:mm')}
- Adres: ${formData.address}${formData.city ? `, ${formData.city}` : ''}

Met vriendelijke groet,
Basmichel
          `
        });
      } catch (emailError) {
        console.warn('Email verzenden mislukt:', emailError);
      }

      queryClient.invalidateQueries({ queryKey: ['clientProjects'] });
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
      queryClient.invalidateQueries({ queryKey: ['existingSessions'] });

      toast.success('Boeking succesvol bevestigd!');
      setStep(4); // Success step
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Er ging iets mis bij het boeken');
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDays = getWeekDays();
  const timeSlots = selectedDate ? getTimeSlots(selectedDate) : [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900">Shoot boeken</h1>
        <p className="text-gray-400 mt-2">Plan uw volgende fotosessie in enkele stappen</p>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div className="mb-10">
          <div className="flex items-center justify-center">
            {['Dienst kiezen', 'Datum & tijd', 'Gegevens'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    step > index + 1 ? "bg-[#5C6B52] text-white" :
                    step === index + 1 ? "bg-[#5C6B52] text-white ring-4 ring-[#E8EDE5]" :
                    "bg-gray-100 text-gray-400"
                  )}>
                    {step > index + 1 ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 font-medium hidden sm:block",
                    step >= index + 1 ? "text-gray-700" : "text-gray-400"
                  )}>
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={cn(
                    "w-16 sm:w-24 h-0.5 mx-3 mt-[-20px] sm:mt-0",
                    step > index + 1 ? "bg-[#5C6B52]" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <div className="space-y-6">
          {serviceTypes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-900 font-medium mb-1">Geen diensten beschikbaar</p>
              <p className="text-sm text-gray-400">Neem contact op voor meer informatie</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceTypes.map(service => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={cn(
                    "bg-white rounded-2xl border p-6 cursor-pointer transition-all hover:shadow-sm",
                    selectedService?.id === service.id 
                      ? "border-[#5C6B52] bg-[#F8FAF7]" 
                      : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl bg-[#E8EDE5] flex items-center justify-center flex-shrink-0">
                      <Camera className="w-7 h-7 text-[#5C6B52]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 text-lg">{service.name}</h3>
                          {service.description && (
                            <p className="text-gray-400 mt-1 text-sm leading-relaxed">{service.description}</p>
                          )}
                        </div>
                        {service.price && (
                          <span className="text-lg font-medium text-gray-900 flex-shrink-0">
                            €{service.price?.toFixed(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration_minutes || 60} minuten</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Date & Time Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Terug
            </button>
          </div>

          {/* Week Navigation */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset(prev => prev - 1)}
                disabled={weekOffset === 0}
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium text-gray-900">
                {format(weekDays[0], 'd MMM', { locale: nl })} – {format(weekDays[6], 'd MMM yyyy', { locale: nl })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isPast = isBefore(day, new Date()) && !isToday;
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedTime(null);
                    }}
                    disabled={isPast}
                    className={cn(
                      "py-4 px-2 rounded-xl text-center transition-all",
                      isPast ? "opacity-30 cursor-not-allowed" :
                      isSelected ? "bg-[#5C6B52] text-white shadow-sm" :
                      isToday ? "bg-[#F8FAF7] text-[#5C6B52] ring-1 ring-[#A8B5A0]" :
                      "hover:bg-gray-50"
                    )}
                  >
                    <p className="text-xs uppercase text-opacity-70 mb-1">{format(day, 'EEE', { locale: nl })}</p>
                    <p className="text-xl font-light">{format(day, 'd')}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-medium text-gray-900 mb-5">
                Beschikbare tijden op {format(selectedDate, 'd MMMM', { locale: nl })}
              </h3>
              {timeSlots.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400">Geen beschikbare tijden op deze dag</p>
                  <p className="text-sm text-gray-300 mt-1">Kies een andere datum</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.toISOString()}
                      onClick={() => {
                        setSelectedTime(slot);
                        setStep(3);
                      }}
                      className={cn(
                        "py-3 px-3 rounded-xl text-sm font-medium transition-all",
                        selectedTime && isSameDay(slot, selectedTime) && format(slot, 'HH:mm') === format(selectedTime, 'HH:mm')
                          ? "bg-[#5C6B52] text-white"
                          : "bg-[#F8FAF7] hover:bg-[#E8EDE5] text-gray-700"
                      )}
                    >
                      {format(slot, 'HH:mm')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setStep(2)}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Terug
            </button>
          </div>

          {/* Summary */}
          <div className="bg-[#F8FAF7] rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center">
                <Camera className="w-7 h-7 text-[#5C6B52]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedService?.name}</p>
                <p className="text-sm text-[#5C6B52] mt-0.5">
                  {selectedTime && format(selectedTime, 'EEEE d MMMM yyyy', { locale: nl })} om {selectedTime && format(selectedTime, 'HH:mm')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div>
              <Label htmlFor="address" className="text-gray-700">Adres *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Straatnaam en huisnummer"
                className="mt-2 h-12 rounded-xl border-gray-200"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code" className="text-gray-700">Postcode</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="1234 AB"
                  className="mt-2 h-12 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-gray-700">Plaats *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Stad"
                  className="mt-2 h-12 rounded-xl border-gray-200"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-gray-700">Opmerkingen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Bijv. parkeerinstructies, sleuteloverdracht, etc."
                className="mt-2 rounded-xl border-gray-200 resize-none"
                rows={3}
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedService || !selectedDate || !selectedTime || !formData.address || !formData.city}
            className="w-full bg-[#5C6B52] hover:bg-[#4A5A42] text-white h-14 rounded-full text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Bezig met boeken...
              </>
            ) : (
              'Bevestig boeking'
            )}
          </Button>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-[#E8EDE5] flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-[#5C6B52]" />
          </div>
          <h2 className="text-3xl font-light text-gray-900 mb-3">Boeking bevestigd</h2>
          <p className="text-gray-400 mb-10 max-w-md mx-auto">
            Uw fotoshoot is succesvol ingepland. U ontvangt binnen enkele minuten een bevestiging per e-mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={createPageUrl('ClientDashboard')}>
              <Button variant="outline" className="rounded-full px-8 h-12">
                Naar dashboard
              </Button>
            </a>
            <a href={createPageUrl('ClientProjects')}>
              <Button className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-8 h-12">
                Bekijk projecten
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}