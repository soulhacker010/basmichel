import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Building2, Phone, MapPin, Save } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function ClientProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });
  const [clientData, setClientData] = useState({
    company_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || ''
      });
    };
    loadUser();
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: () => base44.entities.Client.filter({ user_id: user?.id }),
    enabled: !!user,
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
        postal_code: client.postal_code || ''
      });
    }
  }, [clients]);

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success('Profiel bijgewerkt');
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      toast.success('Bedrijfsgegevens bijgewerkt');
    }
  });

  const handleSaveProfile = async () => {
    // Update both User and Client entities
    await updateUserMutation.mutateAsync(formData);
    
    // Also update client name if exists
    if (clients.length > 0) {
      await updateClientMutation.mutateAsync({
        id: clients[0].id,
        data: { contact_name: formData.full_name }
      });
    }
  };

  const handleSaveClient = async () => {
    if (clients.length > 0) {
      await updateClientMutation.mutateAsync({
        id: clients[0].id,
        data: clientData
      });
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

        <div className="space-y-5">
          <div>
            <Label htmlFor="full_name">Naam</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-2 h-12 rounded-xl"
            />
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
            disabled={updateUserMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Opslaan
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
            disabled={updateClientMutation.isPending || clients.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Opslaan
          </Button>
        </div>
      </div>
    </div>
  );
}