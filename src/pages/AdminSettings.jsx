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
  Save
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        </Tabs>
      </div>
    </div>
  );
}