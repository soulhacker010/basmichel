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

  const totalPaid = invoices
    .filter(i => i.status === 'betaald')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const totalDraft = invoices
    .filter(i => i.status === 'concept')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const totalUnpaid = invoices
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
    const count = invoices.filter(i => i.invoice_number?.startsWith(`${year}`)).length + 1;
    return `${year}${String(count).padStart(4, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light text-gray-900">Invoices</h1>
        <Button 
          onClick={() => {
            setEditingInvoice(null);
            setIsDialogOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white rounded px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Paid</p>
          <p className="text-2xl font-light text-gray-900">€{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Unpaid</p>
          <p className="text-2xl font-light text-gray-900">€{totalUnpaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Draft</p>
          <p className="text-2xl font-light text-gray-900">€{totalDraft.toFixed(2)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search email or contact name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded border-gray-200"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="shrink-0">
          <TabsList className="bg-white border border-gray-200 h-10">
            <TabsTrigger value="all" className="text-sm">All Invoices</TabsTrigger>
            <TabsTrigger value="concept" className="text-sm">Draft</TabsTrigger>
            <TabsTrigger value="verzonden" className="text-sm">Unpaid</TabsTrigger>
            <TabsTrigger value="betaald" className="text-sm">Paid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-16 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-1">No invoices found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice #</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="w-8 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoice_number || 'Draft'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getClientName(invoice.client_id)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{getProjectTitle(invoice.project_id)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">€{invoice.total_amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {invoice.due_date ? format(new Date(invoice.due_date), 'd MMM yyyy', { locale: nl }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex px-2 py-1 rounded text-xs font-medium",
                      invoice.status === 'betaald' ? "bg-green-50 text-green-700" :
                      invoice.status === 'verzonden' ? "bg-amber-50 text-amber-700" :
                      invoice.status === 'verlopen' ? "bg-red-50 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {invoice.status === 'betaald' ? 'Paid' :
                       invoice.status === 'verzonden' ? 'Unpaid' :
                       invoice.status === 'verlopen' ? 'Overdue' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                          Edit
                        </DropdownMenuItem>
                        {invoice.status === 'concept' && (
                          <DropdownMenuItem onClick={() => {
                            updateMutation.mutate({ 
                              id: invoice.id, 
                              data: { ...invoice, status: 'verzonden' } 
                            });
                          }}>
                            <Send className="w-4 h-4 mr-2" />
                            Send
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
                            Mark as paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(invoice.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice_number">Invoice Number</Label>
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
                  <option value="concept">Draft</option>
                  <option value="verzonden">Sent</option>
                  <option value="betaald">Paid</option>
                  <option value="verlopen">Overdue</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="client_id">Client *</Label>
              <select
                id="client_id"
                name="client_id"
                defaultValue={editingInvoice?.client_id || ''}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Select client</option>
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
                <option value="">Select project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingInvoice?.description || ''}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (excl. VAT) *</Label>
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
                <Label htmlFor="invoice_date">Invoice Date</Label>
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
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={editingInvoice?.due_date || ''}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="payment_link">Payment Link</Label>
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
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                {editingInvoice ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}