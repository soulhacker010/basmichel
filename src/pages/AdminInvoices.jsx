import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function AdminInvoices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsDialogOpen(false);
      setEditingInvoice(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsDialogOpen(false);
      setEditingInvoice(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteId(null);
    },
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return '-';
    const user = users.find(u => u.id === client.user_id);
    return client.company_name || user?.full_name || '-';
  };

  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || '-';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      getClientName(invoice.client_id).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: invoices.length,
    concept: invoices.filter(i => i.status === 'concept').length,
    verzonden: invoices.filter(i => i.status === 'verzonden').length,
    betaald: invoices.filter(i => i.status === 'betaald').length,
    verlopen: invoices.filter(i => i.status === 'verlopen').length,
  };

  const totalOpen = invoices
    .filter(i => i.status === 'verzonden')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const amount = parseFloat(formData.get('amount')) || 0;
    const vatRate = 0.21;
    const vatAmount = amount * vatRate;
    const totalAmount = amount + vatAmount;

    const data = {
      invoice_number: formData.get('invoice_number'),
      client_id: formData.get('client_id'),
      project_id: formData.get('project_id'),
      description: formData.get('description'),
      amount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      status: formData.get('status'),
      invoice_date: formData.get('invoice_date'),
      due_date: formData.get('due_date'),
      payment_link: formData.get('payment_link'),
    };

    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.invoice_number?.startsWith(`FAC-${year}`)).length + 1;
    return `FAC-${year}-${String(count).padStart(4, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Facturen"
        description="Beheer alle facturen"
        actions={
          <Button 
            onClick={() => {
              setEditingInvoice(null);
              setIsDialogOpen(true);
            }}
            className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Factuur
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Totaal facturen</p>
          <p className="text-2xl font-semibold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Openstaand</p>
          <p className="text-2xl font-semibold text-amber-600">€{totalOpen.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Verzonden</p>
          <p className="text-2xl font-semibold text-blue-600">{statusCounts.verzonden}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Betaald</p>
          <p className="text-2xl font-semibold text-green-600">{statusCounts.betaald}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Zoek op factuurnummer of klant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="concept">Concept</TabsTrigger>
            <TabsTrigger value="verzonden">Verzonden</TabsTrigger>
            <TabsTrigger value="betaald">Betaald</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <EmptyState 
          icon={FileText}
          title={search || statusFilter !== 'all' ? "Geen resultaten" : "Nog geen facturen"}
          description={search || statusFilter !== 'all' ? "Probeer andere filters" : "Maak je eerste factuur aan"}
          action={
            !search && statusFilter === 'all' && (
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Factuur
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filteredInvoices.map(invoice => (
              <div 
                key={invoice.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    invoice.status === 'betaald' ? "bg-green-50" :
                    invoice.status === 'verzonden' ? "bg-amber-50" :
                    invoice.status === 'verlopen' ? "bg-red-50" :
                    "bg-gray-100"
                  )}>
                    {invoice.status === 'betaald' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                     invoice.status === 'verzonden' ? <Clock className="w-5 h-5 text-amber-600" /> :
                     invoice.status === 'verlopen' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                     <FileText className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{invoice.invoice_number || 'Concept'}</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        invoice.status === 'betaald' ? "bg-green-50 text-green-700" :
                        invoice.status === 'verzonden' ? "bg-amber-50 text-amber-700" :
                        invoice.status === 'verlopen' ? "bg-red-50 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {invoice.status === 'betaald' ? 'Betaald' :
                         invoice.status === 'verzonden' ? 'Verzonden' :
                         invoice.status === 'verlopen' ? 'Verlopen' : 'Concept'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{getClientName(invoice.client_id)}</p>
                    <p className="text-xs text-gray-400">{getProjectTitle(invoice.project_id)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">€{invoice.total_amount?.toFixed(2)}</p>
                    {invoice.invoice_date && (
                      <p className="text-xs text-gray-400">
                        {format(new Date(invoice.invoice_date), 'd MMM yyyy', { locale: nl })}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingInvoice(invoice);
                        setIsDialogOpen(true);
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Bewerken
                      </DropdownMenuItem>
                      {invoice.status === 'concept' && (
                        <DropdownMenuItem onClick={() => {
                          updateMutation.mutate({ 
                            id: invoice.id, 
                            data: { ...invoice, status: 'verzonden' } 
                          });
                        }}>
                          <Send className="w-4 h-4 mr-2" />
                          Verzenden
                        </DropdownMenuItem>
                      )}
                      {invoice.status === 'verzonden' && (
                        <DropdownMenuItem onClick={() => {
                          updateMutation.mutate({ 
                            id: invoice.id, 
                            data: { ...invoice, status: 'betaald', paid_date: new Date().toISOString().split('T')[0] } 
                          });
                        }}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Markeer als betaald
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(invoice.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'Factuur Bewerken' : 'Nieuwe Factuur'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice_number">Factuurnummer</Label>
                <Input
                  id="invoice_number"
                  name="invoice_number"
                  defaultValue={editingInvoice?.invoice_number || generateInvoiceNumber()}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={editingInvoice?.status || 'concept'}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="concept">Concept</option>
                  <option value="verzonden">Verzonden</option>
                  <option value="betaald">Betaald</option>
                  <option value="verlopen">Verlopen</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="client_id">Klant *</Label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={editingInvoice?.client_id || ''}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecteer klant</option>
                {clients.map(client => {
                  const user = users.find(u => u.id === client.user_id);
                  return (
                    <option key={client.id} value={client.id}>
                      {client.company_name || user?.full_name || client.id}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <Label htmlFor="project_id">Project</Label>
              <select
                id="project_id"
                name="project_id"
                defaultValue={editingInvoice?.project_id || ''}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Selecteer project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description">Omschrijving</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingInvoice?.description || ''}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Bedrag (excl. BTW) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingInvoice?.amount || ''}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="invoice_date">Factuurdatum</Label>
                <Input
                  id="invoice_date"
                  name="invoice_date"
                  type="date"
                  defaultValue={editingInvoice?.invoice_date || new Date().toISOString().split('T')[0]}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">Vervaldatum</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={editingInvoice?.due_date || ''}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="payment_link">Betaallink (Revolut)</Label>
                <Input
                  id="payment_link"
                  name="payment_link"
                  defaultValue={editingInvoice?.payment_link || ''}
                  className="mt-1.5"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingInvoice ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Factuur Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze factuur wilt verwijderen?
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