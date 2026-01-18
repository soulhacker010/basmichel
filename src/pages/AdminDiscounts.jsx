import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  Percent,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Tag,
  Lock
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function AdminDiscounts() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => base44.entities.DiscountCode.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DiscountCode.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setIsDialogOpen(false);
      setEditingDiscount(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DiscountCode.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setIsDialogOpen(false);
      setEditingDiscount(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DiscountCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setDeleteId(null);
    },
  });

  const filteredDiscounts = discounts.filter(discount => 
    discount.code?.toLowerCase().includes(search.toLowerCase()) ||
    discount.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      code: formData.get('code').toUpperCase(),
      description: formData.get('description'),
      discount_type: formData.get('discount_type'),
      discount_value: parseFloat(formData.get('discount_value')) || 0,
      valid_from: formData.get('valid_from'),
      valid_until: formData.get('valid_until'),
      max_uses: formData.get('max_uses') ? parseInt(formData.get('max_uses')) : null,
      is_active: formData.get('is_active') === 'on',
    };

    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isExpired = (discount) => {
    if (!discount.valid_until) return false;
    return new Date(discount.valid_until) < new Date();
  };

  const isNotStarted = (discount) => {
    if (!discount.valid_from) return false;
    return new Date(discount.valid_from) > new Date();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Kortingscodes"
        description="Beheer je kortingscodes"
        actions={
          <Button 
            onClick={() => {
              setEditingDiscount(null);
              setIsDialogOpen(true);
            }}
            className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Kortingscode
          </Button>
        }
      />

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Kortingen zijn nog niet toepasbaar</p>
          <p className="text-sm text-amber-700">
            Je kunt hier alvast kortingscodes aanmaken. Zodra de betalingsmodule is geactiveerd, 
            kunnen klanten deze codes gebruiken.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Zoek op code of beschrijving..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Discounts */}
      {filteredDiscounts.length === 0 ? (
        <EmptyState 
          icon={Tag}
          title={search ? "Geen resultaten" : "Nog geen kortingscodes"}
          description={search ? "Probeer een andere zoekopdracht" : "Maak je eerste kortingscode aan"}
          action={
            !search && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Kortingscode
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filteredDiscounts.map(discount => {
              const expired = isExpired(discount);
              const notStarted = isNotStarted(discount);
              
              return (
                <div 
                  key={discount.id}
                  className={cn(
                    "p-5 transition-colors",
                    (expired || !discount.is_active) && "bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-lg",
                        discount.is_active && !expired ? "bg-[#E8EDE5]" : "bg-gray-200"
                      )}>
                        {discount.discount_type === 'percentage' ? (
                          <Percent className={cn(
                            "w-5 h-5",
                            discount.is_active && !expired ? "text-[#5C6B52]" : "text-gray-500"
                          )} />
                        ) : (
                          <Tag className={cn(
                            "w-5 h-5",
                            discount.is_active && !expired ? "text-[#5C6B52]" : "text-gray-500"
                          )} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-semibold text-lg text-gray-900">
                            {discount.code}
                          </span>
                          <span className={cn(
                            "text-sm font-medium px-2 py-0.5 rounded",
                            discount.discount_type === 'percentage' 
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          )}>
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}%`
                              : `€${discount.discount_value}`
                            }
                          </span>
                          {!discount.is_active && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Inactief
                            </span>
                          )}
                          {expired && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                              Verlopen
                            </span>
                          )}
                          {notStarted && (
                            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded">
                              Nog niet actief
                            </span>
                          )}
                        </div>
                        {discount.description && (
                          <p className="text-sm text-gray-600 mb-2">{discount.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          {discount.valid_from && (
                            <span>Vanaf: {format(new Date(discount.valid_from), 'd MMM yyyy', { locale: nl })}</span>
                          )}
                          {discount.valid_until && (
                            <span>Tot: {format(new Date(discount.valid_until), 'd MMM yyyy', { locale: nl })}</span>
                          )}
                          {discount.max_uses && (
                            <span>Max gebruik: {discount.times_used || 0}/{discount.max_uses}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(discount.code);
                        }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Code Kopiëren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingDiscount(discount);
                          setIsDialogOpen(true);
                        }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(discount.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? 'Kortingscode Bewerken' : 'Nieuwe Kortingscode'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                name="code"
                defaultValue={editingDiscount?.code || ''}
                className="mt-1.5 uppercase font-mono"
                placeholder="KORTING2024"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingDiscount?.description || ''}
                className="mt-1.5"
                placeholder="Bijv: Nieuwjaarskorting"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount_type">Type</Label>
                <select
                  id="discount_type"
                  name="discount_type"
                  defaultValue={editingDiscount?.discount_type || 'percentage'}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="vast_bedrag">Vast bedrag (€)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="discount_value">Waarde *</Label>
                <Input
                  id="discount_value"
                  name="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingDiscount?.discount_value || ''}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Geldig vanaf</Label>
                <Input
                  id="valid_from"
                  name="valid_from"
                  type="date"
                  defaultValue={editingDiscount?.valid_from || ''}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="valid_until">Geldig tot</Label>
                <Input
                  id="valid_until"
                  name="valid_until"
                  type="date"
                  defaultValue={editingDiscount?.valid_until || ''}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="max_uses">Max. aantal keer te gebruiken</Label>
              <Input
                id="max_uses"
                name="max_uses"
                type="number"
                min="0"
                defaultValue={editingDiscount?.max_uses || ''}
                className="mt-1.5"
                placeholder="Leeg = onbeperkt"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                defaultChecked={editingDiscount?.is_active !== false}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal">
                Actief
              </Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingDiscount ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kortingscode Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze kortingscode wilt verwijderen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
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