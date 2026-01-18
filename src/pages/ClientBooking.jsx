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
    queryKey: ['serviceTypes'],
    queryFn: () => base44.entities.ServiceType.filter({ is_active: true }, 'order'),
  });

  const { data: existingBookings = [] } = useQuery({
    queryKey: ['existingBookings'],
    queryFn: () => base44.entities.Booking.filter({ status: 'bevestigd' }),
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
      // Check if slot conflicts with existing bookings
      const slotEnd = addMinutes(currentTime, duration);
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.start_datetime);
        const bookingEnd = new Date(booking.end_datetime);
        return (
          (isAfter(currentTime, bookingStart) && isBefore(currentTime, bookingEnd)) ||
          (isAfter(slotEnd, bookingStart) && isBefore(slotEnd, bookingEnd)) ||
          (isBefore(currentTime, bookingStart) && isAfter(slotEnd, bookingEnd)) ||
          isSameDay(currentTime, bookingStart) && format(currentTime, 'HH:mm') === format(bookingStart, 'HH:mm')
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
    if (!clientId || !selectedService || !selectedDate || !selectedTime) {
      toast.error('Vul alle velden in');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDatetime = selectedTime;
      const endDatetime = addMinutes(startDatetime, selectedService.duration_minutes || 60);

      // Create project
      const project = await base44.entities.Project.create({
        title: formData.address || 'Nieuw Project',
        client_id: clientId,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        status: 'geboekt',
      });

      // Create booking
      const booking = await base44.entities.Booking.create({
        project_id: project.id,
        client_id: clientId,
        service_type: selectedService.slug,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        duration_minutes: selectedService.duration_minutes || 60,
        status: 'bevestigd',
        address: formData.address,
        city: formData.city,
        notes: formData.notes,
      });

      // Update project with booking id
      await base44.entities.Project.update(project.id, {
        booking_id: booking.id
      });

      // Create notification
      await base44.entities.Notification.create({
        client_id: clientId,
        user_id: user.id,
        type: 'boeking_bevestigd',
        title: 'Boeking bevestigd',
        message: `Uw shoot is bevestigd voor ${format(startDatetime, 'd MMMM yyyy', { locale: nl })} om ${format(startDatetime, 'HH:mm')}`,
        project_id: project.id,
      });

      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Boeking bevestigd - Basmichel',
        body: `
          Beste ${user.full_name || 'klant'},

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

      queryClient.invalidateQueries({ queryKey: ['clientProjects'] });
      queryClient.invalidateQueries({ queryKey: ['clientBookings'] });

      setStep(4); // Success step
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Er ging iets mis bij het boeken');
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDays = getWeekDays();
  const timeSlots = selectedDate ? getTimeSlots(selectedDate) : [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900">Shoot Boeken</h1>
        <p className="text-gray-500 mt-1">Plan uw volgende fotosessie</p>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Dienst', 'Datum & Tijd', 'Gegevens'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step > index + 1 ? "bg-[#A8B5A0] text-white" :
                  step === index + 1 ? "bg-[#5C6B52] text-white" :
                  "bg-gray-200 text-gray-500"
                )}>
                  {step > index + 1 ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </div>
                {index < 2 && (
                  <div className={cn(
                    "w-24 sm:w-32 h-0.5 mx-2",
                    step > index + 1 ? "bg-[#A8B5A0]" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Service Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Kies een dienst</h2>
          {serviceTypes.length === 0 ? (
            <p className="text-gray-500">Geen diensten beschikbaar</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map(service => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={cn(
                    "bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-md",
                    selectedService?.id === service.id 
                      ? "border-[#A8B5A0] bg-[#E8EDE5]/30" 
                      : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#E8EDE5] flex items-center justify-center">
                      <Camera className="w-6 h-6 text-[#5C6B52]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.duration_minutes || 60} min
                        </span>
                        {service.price && (
                          <span className="font-medium text-gray-900">
                            €{service.price?.toFixed(2)}
                          </span>
                        )}
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
            <h2 className="text-lg font-medium text-gray-900">Kies datum & tijd</h2>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Terug
            </Button>
          </div>

          {/* Week Navigation */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset(prev => prev - 1)}
                disabled={weekOffset === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium text-gray-900">
                {format(weekDays[0], 'd MMM', { locale: nl })} - {format(weekDays[6], 'd MMM yyyy', { locale: nl })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWeekOffset(prev => prev + 1)}
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
                      "p-3 rounded-lg text-center transition-colors",
                      isPast ? "opacity-50 cursor-not-allowed" :
                      isSelected ? "bg-[#5C6B52] text-white" :
                      isToday ? "bg-[#E8EDE5] text-[#5C6B52]" :
                      "hover:bg-gray-100"
                    )}
                  >
                    <p className="text-xs uppercase">{format(day, 'EEE', { locale: nl })}</p>
                    <p className="text-lg font-medium">{format(day, 'd')}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-4">
                Beschikbare tijden op {format(selectedDate, 'd MMMM', { locale: nl })}
              </h3>
              {timeSlots.length === 0 ? (
                <p className="text-gray-500">Geen beschikbare tijden op deze dag</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.toISOString()}
                      onClick={() => {
                        setSelectedTime(slot);
                        setStep(3);
                      }}
                      className={cn(
                        "py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                        selectedTime && isSameDay(slot, selectedTime) && format(slot, 'HH:mm') === format(selectedTime, 'HH:mm')
                          ? "bg-[#5C6B52] text-white"
                          : "bg-gray-100 hover:bg-[#E8EDE5] text-gray-700"
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
            <h2 className="text-lg font-medium text-gray-900">Locatie gegevens</h2>
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>
              Terug
            </Button>
          </div>

          {/* Summary */}
          <div className="bg-[#E8EDE5] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                <Camera className="w-6 h-6 text-[#5C6B52]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedService?.name}</p>
                <p className="text-sm text-[#5C6B52]">
                  {selectedTime && format(selectedTime, 'd MMMM yyyy', { locale: nl })} om {selectedTime && format(selectedTime, 'HH:mm')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <div>
              <Label htmlFor="address">Adres *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Straatnaam en huisnummer"
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postcode</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="1234 AB"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="city">Plaats *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Stad"
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Opmerkingen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Bijv. parkeerinstructies, sleuteloverdracht, etc."
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.address || !formData.city}
            className="w-full bg-[#A8B5A0] hover:bg-[#97A690] text-white h-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Bezig met boeken...
              </>
            ) : (
              'Bevestig Boeking'
            )}
          </Button>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Boeking Bevestigd!</h2>
          <p className="text-gray-500 mb-8">
            Uw fotoshoot is ingepland. U ontvangt een bevestiging per e-mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={createPageUrl('ClientDashboard')}>
              <Button variant="outline">
                Naar Dashboard
              </Button>
            </a>
            <a href={createPageUrl('ClientProjects')}>
              <Button className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                Bekijk Projecten
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}