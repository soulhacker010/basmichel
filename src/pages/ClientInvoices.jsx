import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FileText, 
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClientInvoices() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && clients.length > 0) {
      const client = clients.find(c => c.user_id === user.id);
      if (client) setClientId(client.id);
    }
  }, [user, clients]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['clientInvoices', clientId],
    queryFn: () => base44.entities.Invoice.filter({ client_id: clientId }, '-created_date'),
    enabled: !!clientId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: () => base44.entities.Project.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || '-';
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'open') return invoice.status === 'verzonden';
    if (filter === 'betaald') return invoice.status === 'betaald';
    return true;
  });

  const openInvoices = invoices.filter(i => i.status === 'verzonden');
  const totalOpen = openInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const toggleInvoiceSelection = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedTotal = invoices
    .filter(i => selectedInvoices.includes(i.id))
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900">Facturen</h1>
        <p className="text-gray-500 mt-1">Bekijk en betaal uw facturen</p>
      </div>

      {/* Open Amount Banner */}
      {totalOpen > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">Openstaand bedrag</p>
              <p className="text-2xl font-semibold text-amber-900">€{totalOpen.toFixed(2)}</p>
            </div>
          </div>
          <Button 
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setSelectedInvoices(openInvoices.map(i => i.id))}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Alles betalen
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Alle ({invoices.length})</TabsTrigger>
            <TabsTrigger value="open">Openstaand ({openInvoices.length})</TabsTrigger>
            <TabsTrigger value="betaald">Betaald ({invoices.filter(i => i.status === 'betaald').length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Geen facturen</h2>
          <p className="text-gray-500">
            {filter === 'all' ? 'U heeft nog geen facturen' : 'Geen facturen in deze categorie'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filteredInvoices.map(invoice => (
              <div 
                key={invoice.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {invoice.status === 'verzonden' && (
                    <div 
                      className="mt-1 cursor-pointer"
                      onClick={() => toggleInvoiceSelection(invoice.id)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        selectedInvoices.includes(invoice.id)
                          ? "bg-[#A8B5A0] border-[#A8B5A0]"
                          : "bg-white border-gray-300 hover:border-[#A8B5A0]"
                      )}>
                        {selectedInvoices.includes(invoice.id) && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    invoice.status === 'betaald' ? "bg-green-50" : "bg-amber-50"
                  )}>
                    {invoice.status === 'betaald' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoice_number || 'Factuur'}</p>
                    <p className="text-sm text-gray-500">{getProjectTitle(invoice.project_id)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {invoice.invoice_date && format(new Date(invoice.invoice_date), 'd MMMM yyyy', { locale: nl })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-900">€{invoice.total_amount?.toFixed(2)}</p>
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                      invoice.status === 'betaald' ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {invoice.status === 'betaald' ? 'Betaald' : 'Open'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    {invoice.status === 'verzonden' && invoice.payment_link && (
                      <a href={invoice.payment_link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                          Betalen
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Selected */}
      {selectedInvoices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{selectedInvoices.length} facturen geselecteerd</p>
              <p className="text-xl font-semibold text-gray-900">Totaal: €{selectedTotal.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedInvoices([])}>
                Annuleren
              </Button>
              <Button className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                Samen Betalen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}