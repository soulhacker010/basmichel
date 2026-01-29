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
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useEffect } from 'react';

export default function AdminInvoices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
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

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.ProjectInvoice.list('-created_date'),
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectInvoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['projectInvoice'] });
      setIsDialogOpen(false);
      setEditingInvoice(null);
      toast.success('Factuur bijgewerkt');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectInvoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['projectInvoice'] });
      setDeleteId(null);
      toast.success('Factuur verwijderd');
    },
  });

  const getClientName = (invoice) => {
    return invoice.client_name || '-';
  };

  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || '-';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      getClientName(invoice).toLowerCase().includes(search.toLowerCase()) ||
      getProjectTitle(invoice.project_id).toLowerCase().includes(search.toLowerCase());
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



  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>Facturen</h1>
        <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>Alle facturen uit projecten</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className={cn("rounded-lg border p-5", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <p className={cn("text-xs uppercase tracking-wide mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Betaald</p>
          <p className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>€{totalPaid.toFixed(2)}</p>
        </div>
        <div className={cn("rounded-lg border p-5", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <p className={cn("text-xs uppercase tracking-wide mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Onbetaald</p>
          <p className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>€{totalUnpaid.toFixed(2)}</p>
        </div>
        <div className={cn("rounded-lg border p-5", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <p className={cn("text-xs uppercase tracking-wide mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Concept</p>
          <p className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>€{totalDraft.toFixed(2)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
          <Input
            placeholder="Zoek e-mail of contactnaam"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded border-gray-200"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="shrink-0">
          <TabsList className={cn("h-10 border", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
            <TabsTrigger value="all" className="text-sm">Alle Facturen</TabsTrigger>
            <TabsTrigger value="concept" className="text-sm">Concept</TabsTrigger>
            <TabsTrigger value="verzonden" className="text-sm">Onbetaald</TabsTrigger>
            <TabsTrigger value="betaald" className="text-sm">Betaald</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className={cn("rounded-lg border p-16 text-center", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <FileText className={cn("w-12 h-12 mx-auto mb-4", darkMode ? "text-gray-600" : "text-gray-300")} />
          <p className={cn("font-medium mb-1", darkMode ? "text-gray-100" : "text-gray-900")}>Geen facturen gevonden</p>
          <p className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>Probeer je filters aan te passen</p>
        </div>
      ) : (
        <div className={cn("rounded-lg border", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <table className="w-full">
            <thead>
              <tr className={cn("border-b", darkMode ? "border-gray-700" : "border-gray-100")}>
                <th className={cn("text-left px-6 py-3 text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-400" : "text-gray-500")}>Factuur #</th>
                <th className={cn("text-left px-6 py-3 text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-400" : "text-gray-500")}>Klant</th>
                <th className={cn("text-left px-6 py-3 text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-400" : "text-gray-500")}>Project</th>
                <th className={cn("text-left px-6 py-3 text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-400" : "text-gray-500")}>Bedrag</th>
                <th className={cn("text-left px-6 py-3 text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-400" : "text-gray-500")}>Vervaldatum</th>
                <th className={cn("text-left px-6 py-3 text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-400" : "text-gray-500")}>Status</th>
                <th className="w-8 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", darkMode ? "divide-gray-700" : "divide-gray-50")}>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className={cn("cursor-pointer", darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}>
                  <td className={cn("px-6 py-4 text-sm font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{invoice.invoice_number || 'Concept'}</td>
                  <td className={cn("px-6 py-4 text-sm", darkMode ? "text-gray-300" : "text-gray-600")}>{getClientName(invoice)}</td>
                  <td className={cn("px-6 py-4 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                    {invoice.project_id && (
                      <Link 
                        to={`${createPageUrl('AdminProjectDetail')}?id=${invoice.project_id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {getProjectTitle(invoice.project_id)}
                      </Link>
                    )}
                  </td>
                  <td className={cn("px-6 py-4 text-sm font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>€ {invoice.total_amount?.toFixed(2)}</td>
                  <td className={cn("px-6 py-4 text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                    {invoice.due_date ? format(new Date(invoice.due_date), 'd MMM yyyy', { locale: nl }) : 
                     invoice.invoice_date ? '-' : 'Bij status Klaar'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex px-2 py-1 rounded text-xs font-medium",
                      invoice.status === 'betaald' ? "bg-green-50 text-green-700" :
                      invoice.status === 'verzonden' ? "bg-amber-50 text-amber-700" :
                      invoice.status === 'verlopen' ? "bg-red-50 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {invoice.status === 'betaald' ? 'Betaald' :
                       invoice.status === 'verzonden' ? 'Verzonden' :
                       invoice.status === 'verlopen' ? 'Verlopen' : 'Concept'}
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
                        <DropdownMenuItem asChild>
                          <Link to={`${createPageUrl('AdminProjectDetail')}?id=${invoice.project_id}`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Ga naar project
                          </Link>
                        </DropdownMenuItem>
                        {invoice.status === 'verzonden' && (
                          <DropdownMenuItem onClick={() => {
                            updateMutation.mutate({ 
                              id: invoice.id, 
                              data: { status: 'betaald', paid_date: format(new Date(), 'yyyy-MM-dd') } 
                            });
                          }}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Markeer als betaald
                          </DropdownMenuItem>
                        )}
                        {invoice.status !== 'betaald' && (
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Weet je zeker dat je deze factuur wilt verwijderen?')) {
                                deleteMutation.mutate(invoice.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}



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