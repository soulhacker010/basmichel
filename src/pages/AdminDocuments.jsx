import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Plus, 
  FileText,
  FileQuestion,
  FileCheck,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Send,
  Lock
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function AdminDocuments() {
  const [activeTab, setActiveTab] = useState('contracts');
  const [search, setSearch] = useState('');
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isQuestionnaireDialogOpen, setIsQuestionnaireDialogOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
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

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date'),
  });

  const { data: questionnaires = [] } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: () => base44.entities.Questionnaire.list('-created_date'),
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => base44.entities.Quote.list('-created_date'),
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

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list(),
  });

  // Contract mutations
  const createContractMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setIsContractDialogOpen(false);
      setEditingContract(null);
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setIsContractDialogOpen(false);
      setEditingContract(null);
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setDeleteItem(null);
    },
  });

  // Questionnaire mutations
  const createQuestionnaireMutation = useMutation({
    mutationFn: (data) => base44.entities.Questionnaire.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      setIsQuestionnaireDialogOpen(false);
      setEditingQuestionnaire(null);
    },
  });

  const updateQuestionnaireMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Questionnaire.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      setIsQuestionnaireDialogOpen(false);
      setEditingQuestionnaire(null);
    },
  });

  const deleteQuestionnaireMutation = useMutation({
    mutationFn: (id) => base44.entities.Questionnaire.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      setDeleteItem(null);
    },
  });

  // Quote mutations
  const createQuoteMutation = useMutation({
    mutationFn: (data) => base44.entities.Quote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsQuoteDialogOpen(false);
      setEditingQuote(null);
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Quote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setIsQuoteDialogOpen(false);
      setEditingQuote(null);
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Quote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setDeleteItem(null);
    },
  });

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'Geen klant';
    const user = users.find(u => u.id === client.user_id);
    return user?.full_name || client.company_name || 'Onbekend';
  };

  const handleContractSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      client_id: formData.get('client_id'),
      project_id: formData.get('project_id'),
      template_id: formData.get('template_id'),
      content: formData.get('content'),
      status: formData.get('status'),
    };

    if (editingContract) {
      updateContractMutation.mutate({ id: editingContract.id, data });
    } else {
      createContractMutation.mutate(data);
    }
  };

  const handleQuestionnaireSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      client_id: formData.get('client_id'),
      project_id: formData.get('project_id'),
      template_id: formData.get('template_id'),
      status: formData.get('status'),
      questions: [],
      answers: {},
    };

    if (editingQuestionnaire) {
      updateQuestionnaireMutation.mutate({ id: editingQuestionnaire.id, data });
    } else {
      createQuestionnaireMutation.mutate(data);
    }
  };

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      client_id: formData.get('client_id'),
      project_id: formData.get('project_id'),
      template_id: formData.get('template_id'),
      status: formData.get('status'),
      valid_until: formData.get('valid_until'),
      notes: formData.get('notes'),
      lines: [],
    };

    if (editingQuote) {
      updateQuoteMutation.mutate({ id: editingQuote.id, data });
    } else {
      createQuoteMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    if (deleteItem.type === 'contract') {
      deleteContractMutation.mutate(deleteItem.id);
    } else if (deleteItem.type === 'questionnaire') {
      deleteQuestionnaireMutation.mutate(deleteItem.id);
    } else if (deleteItem.type === 'quote') {
      deleteQuoteMutation.mutate(deleteItem.id);
    }
  };

  const renderDocumentList = (documents, type, emptyIcon, emptyTitle, emptyDesc) => {
    const filtered = documents.filter(doc => 
      doc.title?.toLowerCase().includes(search.toLowerCase())
    );

    if (filtered.length === 0) {
      return (
        <EmptyState 
          icon={emptyIcon}
          title={search ? "Geen resultaten" : emptyTitle}
          description={search ? "Probeer een andere zoekopdracht" : emptyDesc}
        />
      );
    }

    return (
      <div className={cn("divide-y", darkMode ? "divide-gray-700" : "divide-gray-50")}>
        {filtered.map(doc => (
          <div 
            key={doc.id}
            className={cn("p-4 transition-colors", darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50/50")}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{doc.title}</h3>
                  <StatusBadge status={doc.status} />
                </div>
                <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
                  {getClientName(doc.client_id)} • {doc.created_date && format(new Date(doc.created_date), 'd MMM yyyy', { locale: nl })}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-gray-400">
                    <Eye className="w-4 h-4 mr-2" />
                    Bekijken
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (type === 'contract') {
                      setEditingContract(doc);
                      setIsContractDialogOpen(true);
                    } else if (type === 'questionnaire') {
                      setEditingQuestionnaire(doc);
                      setIsQuestionnaireDialogOpen(true);
                    } else if (type === 'quote') {
                      setEditingQuote(doc);
                      setIsQuoteDialogOpen(true);
                    }
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Bewerken
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled className="text-gray-400">
                    <Send className="w-4 h-4 mr-2" />
                    Verzenden
                    <Lock className="w-3 h-3 ml-2" />
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteItem({ id: doc.id, type })}
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
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Documenten"
        description="Beheer contracten, vragenlijsten en offertes"
      />

      <div className={cn("rounded-xl overflow-hidden border", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className={cn("border-b px-4 pt-4", darkMode ? "border-gray-700" : "border-gray-100")}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <TabsList className={cn(darkMode ? "bg-gray-700" : "bg-gray-100")}>
                <TabsTrigger value="contracts">
                  <FileText className="w-4 h-4 mr-2" />
                  Contracten ({contracts.length})
                </TabsTrigger>
                <TabsTrigger value="questionnaires">
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Vragenlijsten ({questionnaires.length})
                </TabsTrigger>
                <TabsTrigger value="quotes">
                  <FileCheck className="w-4 h-4 mr-2" />
                  Offertes ({quotes.length})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
                  <Input
                    placeholder="Zoeken..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                {activeTab === 'contracts' && (
                  <Button 
                    onClick={() => {
                      setEditingContract(null);
                      setIsContractDialogOpen(true);
                    }}
                    className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuw
                  </Button>
                )}
                {activeTab === 'questionnaires' && (
                  <Button 
                    onClick={() => {
                      setEditingQuestionnaire(null);
                      setIsQuestionnaireDialogOpen(true);
                    }}
                    className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuw
                  </Button>
                )}
                {activeTab === 'quotes' && (
                  <Button 
                    onClick={() => {
                      setEditingQuote(null);
                      setIsQuoteDialogOpen(true);
                    }}
                    className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuw
                  </Button>
                )}
              </div>
            </div>
          </div>

          <TabsContent value="contracts" className="mt-0">
            {renderDocumentList(contracts, 'contract', FileText, 'Geen contracten', 'Maak je eerste contract aan')}
          </TabsContent>
          <TabsContent value="questionnaires" className="mt-0">
            {renderDocumentList(questionnaires, 'questionnaire', FileQuestion, 'Geen vragenlijsten', 'Maak je eerste vragenlijst aan')}
          </TabsContent>
          <TabsContent value="quotes" className="mt-0">
            {renderDocumentList(quotes, 'quote', FileCheck, 'Geen offertes', 'Maak je eerste offerte aan')}
          </TabsContent>
        </Tabs>
      </div>

      {/* Contract Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? 'Contract Bewerken' : 'Nieuw Contract'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContractSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingContract?.title || ''}
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Klant</Label>
                <select
                  id="client_id"
                  name="client_id"
                  defaultValue={editingContract?.client_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="">Selecteer klant</option>
                  {clients.map(client => {
                    const user = users.find(u => u.id === client.user_id);
                    return (
                      <option key={client.id} value={client.id}>
                        {user?.full_name || client.company_name || 'Onbekend'}
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
                  defaultValue={editingContract?.project_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="">Selecteer project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template_id">Sjabloon</Label>
                <select
                  id="template_id"
                  name="template_id"
                  defaultValue={editingContract?.template_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="">Geen sjabloon</option>
                  {templates.filter(t => t.type === 'contract').map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={editingContract?.status || 'concept'}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="concept">Concept</option>
                  <option value="verzonden" disabled>Verzonden (binnenkort)</option>
                  <option value="ondertekend" disabled>Ondertekend (binnenkort)</option>
                  <option value="geannuleerd">Geannuleerd</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="content">Inhoud</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={editingContract?.content || ''}
                className="mt-1.5"
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsContractDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingContract ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Questionnaire Dialog */}
      <Dialog open={isQuestionnaireDialogOpen} onOpenChange={setIsQuestionnaireDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionnaire ? 'Vragenlijst Bewerken' : 'Nieuwe Vragenlijst'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuestionnaireSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingQuestionnaire?.title || ''}
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Klant</Label>
                <select
                  id="client_id"
                  name="client_id"
                  defaultValue={editingQuestionnaire?.client_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="">Selecteer klant</option>
                  {clients.map(client => {
                    const user = users.find(u => u.id === client.user_id);
                    return (
                      <option key={client.id} value={client.id}>
                        {user?.full_name || client.company_name || 'Onbekend'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={editingQuestionnaire?.status || 'concept'}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="concept">Concept</option>
                  <option value="verzonden" disabled>Verzonden (binnenkort)</option>
                  <option value="ingevuld" disabled>Ingevuld (binnenkort)</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 text-center">
                Vrageneditor wordt binnenkort beschikbaar
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsQuestionnaireDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingQuestionnaire ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quote Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuote ? 'Offerte Bewerken' : 'Nieuwe Offerte'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingQuote?.title || ''}
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Klant</Label>
                <select
                  id="client_id"
                  name="client_id"
                  defaultValue={editingQuote?.client_id || ''}
                  className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
                >
                  <option value="">Selecteer klant</option>
                  {clients.map(client => {
                    const user = users.find(u => u.id === client.user_id);
                    return (
                      <option key={client.id} value={client.id}>
                        {user?.full_name || client.company_name || 'Onbekend'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="valid_until">Geldig tot</Label>
                <Input
                  id="valid_until"
                  name="valid_until"
                  type="date"
                  defaultValue={editingQuote?.valid_until || ''}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={editingQuote?.status || 'concept'}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8B5A0]"
              >
                <option value="concept">Concept</option>
                <option value="verzonden" disabled>Verzonden (binnenkort)</option>
                <option value="geaccepteerd" disabled>Geaccepteerd (binnenkort)</option>
                <option value="afgewezen" disabled>Afgewezen (binnenkort)</option>
                <option value="verlopen">Verlopen</option>
              </select>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 text-center">
                Offerteregels editor wordt binnenkort beschikbaar
              </p>
            </div>
            <div>
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingQuote?.notes || ''}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                {editingQuote ? 'Opslaan' : 'Aanmaken'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Document Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit document wilt verwijderen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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