import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  FileCode,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  FileText,
  FileQuestion,
  FileCheck,
  Mail,
  Receipt
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
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
import { useEffect } from 'react';

const templateTypeConfig = {
  factuur: { icon: Receipt, label: 'Factuur', color: 'bg-blue-100 text-blue-700' },
  contract: { icon: FileText, label: 'Contract', color: 'bg-purple-100 text-purple-700' },
  vragenlijst: { icon: FileQuestion, label: 'Vragenlijst', color: 'bg-amber-100 text-amber-700' },
  offerte: { icon: FileCheck, label: 'Offerte', color: 'bg-green-100 text-green-700' },
  email: { icon: Mail, label: 'E-mail', color: 'bg-pink-100 text-pink-700' },
};

export default function AdminTemplates() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(localStorage.getItem('adminDarkMode') === 'true');
    };
    checkDarkMode();
    window.addEventListener('storage', checkDarkMode);
    const interval = setInterval(checkDarkMode, 100);
    return () => {
      window.removeEventListener('storage', checkDarkMode);
      clearInterval(interval);
    };
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteId(null);
    },
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      content: formData.get('content'),
      is_default: formData.get('is_default') === 'on',
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDuplicate = (template) => {
    createMutation.mutate({
      name: `${template.name} (kopie)`,
      type: template.type,
      content: template.content,
      is_default: false,
    });
  };

  const typeCounts = Object.keys(templateTypeConfig).reduce((acc, type) => {
    acc[type] = templates.filter(t => t.type === type).length;
    return acc;
  }, { all: templates.length });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Sjablonen"
        description="Beheer je document- en e-mailsjablonen"
        actions={
          <Button 
            onClick={() => {
              setEditingTemplate(null);
              setIsDialogOpen(true);
            }}
            className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuw Sjabloon
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
          <Input
            placeholder="Zoek op naam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
            className={typeFilter === 'all' ? 'bg-[#A8B5A0] hover:bg-[#97A690]' : ''}
          >
            Alle ({typeCounts.all})
          </Button>
          {Object.entries(templateTypeConfig).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type)}
                className={typeFilter === type ? 'bg-[#A8B5A0] hover:bg-[#97A690]' : ''}
              >
                <Icon className="w-4 h-4 mr-1" />
                {config.label} ({typeCounts[type] || 0})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Templates */}
      {filteredTemplates.length === 0 ? (
        <EmptyState 
          icon={FileCode}
          title={search || typeFilter !== 'all' ? "Geen resultaten" : "Nog geen sjablonen"}
          description={search || typeFilter !== 'all' ? "Probeer andere filters" : "Maak je eerste sjabloon aan"}
          action={
            !search && typeFilter === 'all' && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuw Sjabloon
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            const config = templateTypeConfig[template.type] || templateTypeConfig.email;
            const Icon = config.icon;
            
            return (
              <div 
                key={template.id}
                className={cn("rounded-xl border p-5 hover:shadow-sm transition-shadow",
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{template.name}</h3>
                      <p className={cn("text-xs", darkMode ? "text-gray-400" : "text-gray-500")}>{config.label}</p>
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
                        setEditingTemplate(template);
                        setIsDialogOpen(true);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Dupliceren
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {template.content && (
                  <p className={cn("text-sm line-clamp-2 mb-3", darkMode ? "text-gray-400" : "text-gray-500")}>
                    {template.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                )}

                <div className={cn("flex items-center justify-between text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
                  <span>
                    {template.created_date && format(new Date(template.created_date), 'd MMM yyyy', { locale: nl })}
                  </span>
                  {template.is_default && (
                    <span className="bg-[#E8EDE5] text-[#5C6B52] px-2 py-0.5 rounded">Standaard</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Sjabloon Bewerken' : 'Nieuw Sjabloon'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Naam *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingTemplate?.name || ''}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editingTemplate?.type || 'email'}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                  required
                >
                  <option value="factuur">Factuur</option>
                  <option value="contract">Contract</option>
                  <option value="vragenlijst">Vragenlijst</option>
                  <option value="offerte">Offerte</option>
                  <option value="email">E-mail</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">Inhoud</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={editingTemplate?.content || ''}
                className="mt-1.5 font-mono text-sm"
                rows={12}
                placeholder="Sjablooninhoud (HTML toegestaan)...

Beschikbare variabelen:
{{klant_naam}}
{{klant_email}}
{{project_titel}}
{{datum}}
{{bedrijfsnaam}}"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                name="is_default"
                defaultChecked={editingTemplate?.is_default}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_default" className="font-normal">
                Instellen als standaard sjabloon voor dit type
              </Label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingTemplate ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sjabloon Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit sjabloon wilt verwijderen?
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