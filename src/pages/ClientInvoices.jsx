import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: () => base44.entities.Client.filter({ user_id: user?.id }),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && clients.length > 0) {
      const client = clients[0];
      if (client) setClientId(client.id);
    }
  }, [user, clients]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['clientInvoices', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const primary = await base44.entities.ProjectInvoice.filter({ client_id: clientId }, '-created_date');
      const shared = await base44.entities.ProjectInvoice.filter({ recipient_client_ids: clientId }, '-created_date');
      const combined = [...(primary || []), ...(shared || [])];
      const seen = new Set();
      return combined.filter(inv => {
        if (seen.has(inv.id)) return false;
        seen.add(inv.id);
        return true;
      });
    },
    enabled: !!clientId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      return await base44.entities.Project.filter({ client_id: clientId });
    },
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-light text-gray-900">Facturen</h1>
        <p className="text-gray-400 mt-2">Bekijk en betaal uw facturen</p>
      </div>

      {/* Open Amount Banner */}
      {totalOpen > 0 && (
        <div className="mb-8 bg-[#FEF9F3] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">Openstaand bedrag</p>
              <p className="text-2xl font-light text-amber-900">€{totalOpen.toFixed(2)}</p>
            </div>
          </div>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 h-11"
            onClick={() => setSelectedInvoices(openInvoices.map(i => i.id))}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Alles betalen
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8">
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Alle', count: invoices.length },
            { value: 'open', label: 'Openstaand', count: openInvoices.length },
            { value: 'betaald', label: 'Betaald', count: invoices.filter(i => i.status === 'betaald').length },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                filter === tab.value
                  ? "bg-[#5C6B52] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">Geen facturen</h2>
          <p className="text-gray-400">
            {filter === 'all' ? 'U heeft nog geen facturen ontvangen' : 'Geen facturen in deze categorie'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map(invoice => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4">
                {invoice.status === 'verzonden' && (
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleInvoiceSelection(invoice.id)}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                      selectedInvoices.includes(invoice.id)
                        ? "bg-[#5C6B52]"
                        : "bg-gray-100 hover:bg-gray-200"
                    )}>
                      {selectedInvoices.includes(invoice.id) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  invoice.status === 'betaald' ? "bg-green-50" : "bg-amber-50"
                )}>
                  {invoice.status === 'betaald' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoice_number || 'Factuur'}</p>
                  <p className="text-sm text-gray-400">{getProjectTitle(invoice.project_id)}</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-xl font-light text-gray-900">€{invoice.total_amount?.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {invoice.invoice_date && format(new Date(invoice.invoice_date), 'd MMM yyyy', { locale: nl })}
                  </p>
                </div>
                <span className={cn(
                  "inline-flex px-3 py-1.5 rounded-full text-xs font-medium",
                  invoice.status === 'betaald' ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                )}>
                  {invoice.status === 'betaald' ? 'Betaald' : 'Open'}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full w-9 h-9 p-0">
                    <Download className="w-4 h-4" />
                  </Button>
                  {invoice.status === 'verzonden' && (invoice.payment_link || invoice.mollie_payment_link_url) && (
                    <a href={invoice.payment_link || invoice.mollie_payment_link_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-5">
                        Betalen
                      </Button>
                    </a>
                  )}
                  {invoice.status === 'verzonden' && !(invoice.payment_link || invoice.mollie_payment_link_url) && (
                    <Button
                      size="sm"
                      className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-5"
                      disabled={paymentLoadingId === invoice.id}
                      onClick={async () => {
                        try {
                          setPaymentLoadingId(invoice.id);
                          const response = await base44.functions.invoke('molliePayment', {
                            action: 'createPaymentLink',
                            invoiceId: invoice.id,
                            amount: invoice.total_amount,
                            description: `Factuur ${invoice.invoice_number || ''}`,
                            redirectUrl: window.location.href,
                          });
                          const data = response?.data || response;
                          if (data?.paymentLinkUrl) {
                            queryClient.invalidateQueries({ queryKey: ['clientInvoices', clientId] });
                            window.open(data.paymentLinkUrl, '_blank');
                          } else if (data?.error) {
                            console.error('Payment link error:', data.error);
                          }
                        } catch (err) {
                          console.error('Create payment link error:', err);
                        } finally {
                          setPaymentLoadingId(null);
                        }
                      }}
                    >
                      {paymentLoadingId === invoice.id ? 'Laden...' : 'Betalen'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pay Selected */}
      {selectedInvoices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 shadow-xl z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{selectedInvoices.length} facturen geselecteerd</p>
              <p className="text-2xl font-light text-gray-900">€{selectedTotal.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoices([])}
                className="rounded-full px-6"
              >
                Annuleren
              </Button>
              <Button className="bg-[#5C6B52] hover:bg-[#4A5A42] text-white rounded-full px-6 h-11">
                <CreditCard className="w-4 h-4 mr-2" />
                Samen betalen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
