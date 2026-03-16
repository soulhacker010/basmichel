import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Building2, Phone, MapPin, Save, Camera, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function ClientProfile() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [clientData, setClientData] = useState({
    company_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    invoice_admin_email: ''
  });

  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || ''
      });
    }
  }, [userData]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', userData?.email],
    queryFn: () => base44.entities.Client.filter({ user_id: userData?.id }),
    enabled: !!userData,
    initialData: []
  });

  useEffect(() => {
    if (clients.length > 0) {
      const client = clients[0];
      setClientData({
        company_name: client.company_name || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        postal_code: client.postal_code || '',
        invoice_admin_email: client.invoice_admin_email || ''
      });
    }
  }, [clients]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    await queryClient.refetchQueries({ queryKey: ['currentUser'] });
    setIsUploadingAvatar(false);
    toast.success('Profielfoto bijgewerkt');
  };

  const handleSaveProfile = async () => {
    if (!formData.first_name || formData.first_name.trim() === '' || !formData.last_name || formData.last_name.trim() === '') {
      toast.error('Voor- en achternaam zijn verplicht');
      return;
    }

    setIsSavingProfile(true);
    
    try {
      const firstName = formData.first_name.trim();
      const lastName = formData.last_name.trim();
      const fullName = `${firstName} ${lastName}`;
      
      // Update User entity with both first_name, last_name, and full_name
      await base44.auth.updateMe({ 
        first_name: firstName,
        last_name: lastName,
        full_name: fullName
      });
      
      // Also update client contact_name if client exists
      if (clients.length > 0) {
        await base44.entities.Client.update(clients[0].id, { 
          contact_name: fullName
        });
      }
      
      // Force refetch to ensure we get the latest data
      await queryClient.refetchQueries({ queryKey: ['currentUser'] });
      
      // Invalidate all relevant queries to refresh everywhere
      await Promise.all([
        queryClient.invalidateQueries(['clients']),
        queryClient.invalidateQueries(['users']),
        queryClient.invalidateQueries(['clientProjects'])
      ]);
      
      // Show success feedback
      toast.success('Opgeslagen', { 
        icon: '✓',
        duration: 2000
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Er is iets misgegaan bij het opslaan');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveClient = async () => {
    if (clients.length === 0) return;
    
    setIsSavingClient(true);
    
    try {
      await base44.entities.Client.update(clients[0].id, clientData);
      
      await queryClient.invalidateQueries(['clients']);
      
      toast.success('Opgeslagen', {
        icon: '✓',
        duration: 2000
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Er is iets misgegaan bij het opslaan');
    } finally {
      setIsSavingClient(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Profiel"
        description="Beheer uw account en bedrijfsgegevens"
      />

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8EDE5] flex items-center justify-center">
            <User className="w-5 h-5 text-[#5C6B52]" />
          </div>
          <h2 className="text-lg font-medium text-gray-900">Persoonlijke gegevens</h2>
        </div>

        {/* Avatar upload */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#E8EDE5] flex items-center justify-center border-2 border-white shadow">
              {userData?.avatar_url ? (
                <img src={userData.avatar_url} alt="Profielfoto" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[#5C6B52]" />
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {isUploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{userData?.full_name || 'Profielfoto'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Klik op de foto om te wijzigen</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="first_name">Voornaam *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="mt-2 h-12 rounded-xl"
              required
            />
            {formData.first_name === '' && (
              <p className="text-xs text-red-600 mt-1">Voornaam is verplicht</p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Achternaam *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="mt-2 h-12 rounded-xl"
              required
            />
            {formData.last_name === '' && (
              <p className="text-xs text-red-600 mt-1">Achternaam is verplicht</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-2 h-12 rounded-xl bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">E-mailadres kan niet worden gewijzigd</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Button 
            onClick={handleSaveProfile}
            className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-6"
            disabled={isSavingProfile || !formData.first_name || !formData.last_name}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingProfile ? 'Bezig met opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E8EDE5] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#5C6B52]" />
          </div>
          <h2 className="text-lg font-medium text-gray-900">Bedrijfsgegevens</h2>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="company_name">Bedrijfsnaam</Label>
            <Input
              id="company_name"
              value={clientData.company_name}
              onChange={(e) => setClientData({ ...clientData, company_name: e.target.value })}
              className="mt-2 h-12 rounded-xl"
              placeholder="Makelaars Basmichel"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefoonnummer</Label>
            <Input
              id="phone"
              value={clientData.phone}
              onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
              className="mt-2 h-12 rounded-xl"
              placeholder="+31 6 12 34 56 78"
            />
          </div>
          <div>
            <Label htmlFor="invoice_admin_email">Administratie e-mail (optioneel)</Label>
            <Input
              id="invoice_admin_email"
              type="email"
              value={clientData.invoice_admin_email}
              onChange={(e) => setClientData({ ...clientData, invoice_admin_email: e.target.value })}
              className="mt-2 h-12 rounded-xl"
              placeholder="administratie@bedrijf.nl"
            />
            <p className="text-xs text-gray-400 mt-1">Alleen invullen als er een aparte administratie is.</p>
          </div>
          <div>
            <Label htmlFor="address">Adres</Label>
            <Input
              id="address"
              value={clientData.address}
              onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
              className="mt-2 h-12 rounded-xl"
              placeholder="Straatnaam 123"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code">Postcode</Label>
              <Input
                id="postal_code"
                value={clientData.postal_code}
                onChange={(e) => setClientData({ ...clientData, postal_code: e.target.value })}
                className="mt-2 h-12 rounded-xl"
                placeholder="1234 AB"
              />
            </div>
            <div>
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                value={clientData.city}
                onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                className="mt-2 h-12 rounded-xl"
                placeholder="Amsterdam"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Button 
            onClick={handleSaveClient}
            className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-6"
            disabled={isSavingClient || clients.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingClient ? 'Bezig met opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </div>
  );
}