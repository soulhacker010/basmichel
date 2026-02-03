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
  Clock
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

  const [workingHours, setWorkingHours] = useState({
    1: { start_time: '09:00', end_time: '17:00', enabled: false },
    2: { start_time: '09:00', end_time: '17:00', enabled: false },
    3: { start_time: '09:00', end_time: '17:00', enabled: false },
    4: { start_time: '09:00', end_time: '17:00', enabled: false },
    5: { start_time: '09:00', end_time: '17:00', enabled: false },
    6: { start_time: '09:00', end_time: '17:00', enabled: false },
    0: { start_time: '09:00', end_time: '17:00', enabled: false },
  });

  useEffect(() => {
    if (availabilities.length > 0) {
      const newWorkingHours = { ...workingHours };
      availabilities.filter(a => a.type === 'werkdag').forEach(a => {
        newWorkingHours[a.day_of_week] = {
          start_time: a.start_time || '09:00',
          end_time: a.end_time || '17:00',
          enabled: true,
          id: a.id
        };
      });
      setWorkingHours(newWorkingHours);
    }
  }, [availabilities]);

  const handleSaveWorkingHours = async () => {
    try {
      // Delete all existing working hours
      const existingWorkDays = availabilities.filter(a => a.type === 'werkdag');
      await Promise.all(existingWorkDays.map(a => base44.entities.Availability.delete(a.id)));

      // Create new working hours for enabled days
      const promises = Object.entries(workingHours)
        .filter(([_, config]) => config.enabled)
        .map(([day, config]) => 
          base44.entities.Availability.create({
            type: 'werkdag',
            day_of_week: parseInt(day),
            start_time: config.start_time,
            end_time: config.end_time,
            is_active: true,
          })
        );
      
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
      toast.success('Werktijden opgeslagen');
    } catch (error) {
      toast.error('Er ging iets mis bij het opslaan');
    }
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Beschikbare Tijden voor Boekingen</h3>
              <p className="text-sm text-gray-500 mb-6">
                Stel je werktijden in. Klanten kunnen alleen binnen deze tijden boeken.
              </p>

              <div className="space-y-3">
                {daysOfWeek.map(day => (
                  <div key={day.value} className="bg-white border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-32">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={workingHours[day.value]?.enabled || false}
                              onChange={(e) => {
                                setWorkingHours({
                                  ...workingHours,
                                  [day.value]: {
                                    ...workingHours[day.value],
                                    enabled: e.target.checked
                                  }
                                });
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="font-medium text-gray-900">{day.label}</span>
                          </label>
                        </div>
                        
                        {workingHours[day.value]?.enabled && (
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1 max-w-[140px]">
                              <Label className="text-xs text-gray-500">Van</Label>
                              <Input
                                type="time"
                                value={workingHours[day.value]?.start_time || '09:00'}
                                onChange={(e) => {
                                  setWorkingHours({
                                    ...workingHours,
                                    [day.value]: {
                                      ...workingHours[day.value],
                                      start_time: e.target.value
                                    }
                                  });
                                }}
                                className="mt-1 h-9"
                              />
                            </div>
                            <div className="flex-1 max-w-[140px]">
                              <Label className="text-xs text-gray-500">Tot</Label>
                              <Input
                                type="time"
                                value={workingHours[day.value]?.end_time || '17:00'}
                                onChange={(e) => {
                                  setWorkingHours({
                                    ...workingHours,
                                    [day.value]: {
                                      ...workingHours[day.value],
                                      end_time: e.target.value
                                    }
                                  });
                                }}
                                className="mt-1 h-9"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                <Button 
                  onClick={handleSaveWorkingHours}
                  className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Werktijden opslaan
                </Button>
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