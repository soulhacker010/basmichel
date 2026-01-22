import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Settings,
  User,
  Building2,
  Globe,
  Bell,
  Shield,
  Palette,
  Save,
  Clock,
  Plus,
  Trash2
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditorsTab from '@/components/admin/EditorsTab';

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: availabilities = [] } = useQuery({
    queryKey: ['availabilities'],
    queryFn: () => base44.entities.Availability.list(),
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: (data) => base44.entities.Availability.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
      toast.success('Werktijd toegevoegd');
    },
  });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: (id) => base44.entities.Availability.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
      toast.success('Werktijd verwijderd');
    },
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error('Error loading user:', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.target);
      await base44.auth.updateMe({
        // Note: full_name is read-only, but we can save custom fields
        business_name: formData.get('business_name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        website: formData.get('website'),
      });
      toast.success('Instellingen opgeslagen');
    } catch (error) {
      toast.error('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWorkingHours = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    createAvailabilityMutation.mutate({
      type: 'werkdag',
      day_of_week: parseInt(formData.get('day_of_week')),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      break_start: formData.get('break_start') || null,
      break_end: formData.get('break_end') || null,
      is_active: true,
    });
    e.target.reset();
  };

  const daysOfWeek = [
    { value: 1, label: 'Maandag' },
    { value: 2, label: 'Dinsdag' },
    { value: 3, label: 'Woensdag' },
    { value: 4, label: 'Donderdag' },
    { value: 5, label: 'Vrijdag' },
    { value: 6, label: 'Zaterdag' },
    { value: 0, label: 'Zondag' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Instellingen" />
        <div className="text-center py-12 text-gray-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Instellingen"
        description="Beheer je account en studio-instellingen"
      />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Tabs defaultValue="profile">
          <div className="border-b border-gray-100 px-4">
            <TabsList className="bg-transparent h-14">
              <TabsTrigger value="profile" className="data-[state=active]:bg-[#E8EDE5]">
                <User className="w-4 h-4 mr-2" />
                Profiel
              </TabsTrigger>
              <TabsTrigger value="business" className="data-[state=active]:bg-[#E8EDE5]">
                <Building2 className="w-4 h-4 mr-2" />
                Bedrijf
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-[#E8EDE5]" disabled>
                <Bell className="w-4 h-4 mr-2" />
                Meldingen
              </TabsTrigger>
              <TabsTrigger value="hours" className="data-[state=active]:bg-[#E8EDE5]">
                <Clock className="w-4 h-4 mr-2" />
                Werktijden
              </TabsTrigger>
              <TabsTrigger value="editors" className="data-[state=active]:bg-[#E8EDE5]">
                <User className="w-4 h-4 mr-2" />
                Editors
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full bg-[#E8EDE5] flex items-center justify-center">
                  <span className="text-2xl font-medium text-[#5C6B52]">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user?.full_name || 'Gebruiker'}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-xs text-[#5C6B52] mt-1 bg-[#E8EDE5] px-2 py-0.5 rounded inline-block">
                    {user?.role === 'admin' ? 'Beheerder' : 'Klant'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="full_name">Naam</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={user?.full_name || ''}
                    className="mt-1.5"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Naam kan niet worden gewijzigd</p>
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    defaultValue={user?.email || ''}
                    className="mt-1.5"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">E-mail kan niet worden gewijzigd</p>
                </div>
                <div>
                  <Label htmlFor="phone">Telefoonnummer</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={user?.phone || ''}
                    className="mt-1.5"
                    placeholder="+31 6 12345678"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="business" className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <Label htmlFor="business_name">Bedrijfsnaam</Label>
                <Input
                  id="business_name"
                  name="business_name"
                  defaultValue={user?.business_name || 'Basmichel'}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  name="address"
                  defaultValue={user?.address || ''}
                  className="mt-1.5"
                  rows={3}
                  placeholder="Straatnaam 123&#10;1234 AB Plaats"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  defaultValue={user?.website || 'https://basmichel.nl'}
                  className="mt-1.5"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notifications" className="p-6">
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>Meldingsinstellingen komen binnenkort beschikbaar</p>
            </div>
          </TabsContent>

          <TabsContent value="hours" className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Beschikbare Tijden voor Boekingen</h3>
              <p className="text-sm text-gray-500 mb-6">
                Stel je werktijden in. Deze tijden worden weergegeven in het boekingssysteem voor klanten.
              </p>

              <form onSubmit={handleAddWorkingHours} className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="day_of_week">Dag</Label>
                    <select
                      id="day_of_week"
                      name="day_of_week"
                      className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
                      required
                    >
                      {daysOfWeek.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="start_time">Van</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Tot</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full bg-[#5C6B52] hover:bg-[#4A5641] text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Toevoegen
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="break_start">Pauze Van (optioneel)</Label>
                    <Input
                      id="break_start"
                      name="break_start"
                      type="time"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="break_end">Pauze Tot (optioneel)</Label>
                    <Input
                      id="break_end"
                      name="break_end"
                      type="time"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                {availabilities
                  .filter(a => a.type === 'werkdag')
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map(availability => {
                    const day = daysOfWeek.find(d => d.value === availability.day_of_week);
                    return (
                      <div 
                        key={availability.id}
                        className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-4">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{day?.label}</p>
                            <p className="text-sm text-gray-500">
                              {availability.start_time} - {availability.end_time}
                              {availability.break_start && availability.break_end && (
                                <span className="ml-2 text-xs">
                                  (Pauze: {availability.break_start} - {availability.break_end})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAvailabilityMutation.mutate(availability.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                {availabilities.filter(a => a.type === 'werkdag').length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Nog geen werktijden ingesteld</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="editors" className="p-6">
            <EditorsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}