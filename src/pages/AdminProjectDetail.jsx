import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Upload,
  Download,
  CheckCircle2,
  Trash2,
  Loader2,
  ChevronDown,
  FileText,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const statusSteps = [
  { key: 'geboekt', label: 'Geboekt' },
  { key: 'shoot_uitgevoerd', label: 'Shoot uitgevoerd' },
  { key: 'wordt_bewerkt', label: 'Wordt bewerkt' },
  { key: 'klaar', label: 'Klaar' },
];

const deliveryCategories = [
  { key: 'bewerkte_fotos', label: 'Bewerkte foto\'s' },
  { key: 'bewerkte_videos', label: 'Bewerkte video\'s' },
  { key: '360_matterport', label: '360° / Matterport' },
  { key: 'meetrapport', label: 'Meetrapport' },
];

const rawCategories = [
  { key: 'raw_fotos', label: 'Raw Foto\'s' },
  { key: 'raw_videos', label: 'Raw Video\'s' },
  { key: '360_raw', label: '360° Foto\'s' },
  { key: 'pointcloud', label: 'Pointcloud' },
];

export default function AdminProjectDetail() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [rawOpen, setRawOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    description: '',
    amount: '',
    vat_amount: '',
  });
  
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects?.[0];
    },
    enabled: !!projectId,
  });

  const { data: client } = useQuery({
    queryKey: ['client', project?.client_id],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: project.client_id });
      return clients?.[0];
    },
    enabled: !!project?.client_id,
  });

  const { data: user } = useQuery({
    queryKey: ['user', client?.user_id],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: client.user_id });
      return users?.[0];
    },
    enabled: !!client?.user_id,
  });

  const { data: booking } = useQuery({
    queryKey: ['booking', project?.booking_id],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ id: project.booking_id });
      return bookings?.[0];
    },
    enabled: !!project?.booking_id,
  });

  const { data: projectFiles = [] } = useQuery({
    queryKey: ['projectFiles', projectId],
    queryFn: () => base44.entities.ProjectFile.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: projectInvoice } = useQuery({
    queryKey: ['projectInvoice', projectId],
    queryFn: async () => {
      const invoices = await base44.entities.ProjectInvoice.filter({ project_id: projectId });
      return invoices?.[0];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (project) {
      setSelectedStatus(project.status);
      setNotes(project.notes || '');
      setDeliveryDate(project.delivery_date || '');
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      
      // Email bij status "Klaar"
      if (variables.data.status === 'klaar' && project.status !== 'klaar') {
        if (user?.email) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `Je project is klaar - ${project.title}`,
            body: `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
  .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #5C6B52 0%, #4A5641 100%); color: #ffffff; padding: 32px 30px; text-align: center; }
  .header h2 { margin: 0; font-size: 24px; font-weight: 300; }
  .content { padding: 32px 40px; line-height: 1.6; color: #333333; }
  .button { display: inline-block; background-color: #5C6B52; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
  .footer { background-color: #f8f9fa; color: #6c757d; text-align: center; padding: 20px; font-size: 13px; border-top: 1px solid #e9ecef; }
</style>
</head>
<body>
  <div class="email-container">
    <div class="header"><h2>Je project is klaar!</h2></div>
    <div class="content">
      <p>Beste ${user.full_name || 'klant'},</p>
      <p>Goed nieuws! Je project <strong>${project.title}</strong> is klaar en beschikbaar in je portal.</p>
      <p>Je kunt nu:</p>
      <ul>
        <li>De bewerkte bestanden bekijken en downloaden</li>
        <li>Je factuur inzien</li>
      </ul>
      <a href="${window.location.origin}" class="button">Bekijk Project</a>
    </div>
    <div class="footer">Bas Michel Photography<br>basmichelsite@gmail.com</div>
  </div>
</body>
</html>
            `,
          });
        }
      }
      
      alert('Project opgeslagen!');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ category, files }) => {
      const uploadedFiles = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.entities.ProjectFile.create({
          project_id: projectId,
          category,
          file_url,
          filename: file.name,
          file_size: file.size,
          mime_type: file.type,
        });
        uploadedFiles.push(file_url);
      }
      return uploadedFiles;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
      setUploadingCategory(null);
      alert('Bestanden geüpload!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectFile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      const totalAmount = parseFloat(data.amount) + parseFloat(data.vat_amount);
      return await base44.entities.ProjectInvoice.create({
        project_id: projectId,
        invoice_number: project.project_number,
        client_name: user?.full_name || client?.company_name || '',
        client_address: project.address || '',
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        description: data.description,
        amount: parseFloat(data.amount),
        vat_amount: parseFloat(data.vat_amount),
        total_amount: totalAmount,
        status: 'verzonden',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
      setInvoiceDialogOpen(false);
      setInvoiceData({ description: '', amount: '', vat_amount: '' });
      alert('Factuur aangemaakt!');
    },
  });

  const handleSave = () => {
    const updates = {
      status: selectedStatus,
      delivery_date: deliveryDate || null,
      notes,
    };

    if (selectedStatus === 'klaar' && project.status !== 'klaar') {
      updates.completed_date = format(new Date(), 'yyyy-MM-dd');
    }

    updateMutation.mutate({
      id: projectId,
      data: updates
    });
  };

  const handleFileUpload = async (category, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setUploadingCategory(category);
    uploadMutation.mutate({ category, files });
    event.target.value = '';
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const selectAllInCategory = (category) => {
    const categoryFiles = projectFiles.filter(f => f.category === category);
    const allSelected = categoryFiles.every(f => selectedFiles[f.id]);
    
    setSelectedFiles(prev => {
      const newSelection = { ...prev };
      categoryFiles.forEach(f => {
        newSelection[f.id] = !allSelected;
      });
      return newSelection;
    });
  };

  const handleDownloadSelected = async (category) => {
    const filesToDownload = projectFiles.filter(f => 
      f.category === category && selectedFiles[f.id]
    );
    
    if (filesToDownload.length === 0) return;

    for (const file of filesToDownload) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.filename;
      link.click();
    }
  };

  if (isLoading || !project) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === selectedStatus);

  return (
    <div className="max-w-6xl mx-auto">
      <Link 
        to={createPageUrl('AdminProjects')}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-8 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar projecten
      </Link>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
        <h1 className="text-2xl font-light text-gray-900 mb-8">{project.title}</h1>
        
        <div className="relative pt-2">
          <div className="absolute top-7 left-6 right-6 h-0.5 bg-gray-100">
            <div 
              className="h-full bg-[#5C6B52] transition-all duration-700"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="relative flex justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isManual = step.key === 'klaar';
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <button
                    onClick={() => isManual && setSelectedStatus(step.key)}
                    disabled={!isManual}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all bg-white",
                      isCompleted 
                        ? "bg-[#5C6B52] border-[#5C6B52] text-white" 
                        : "border-gray-200 text-gray-300",
                      isManual && !isCompleted && "hover:border-gray-300 cursor-pointer",
                      !isManual && "cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </button>
                  <p className={cn(
                    "text-sm mt-3 font-medium text-center max-w-[100px]",
                    isCurrent ? "text-[#5C6B52]" : isCompleted ? "text-gray-700" : "text-gray-300"
                  )}>
                    {step.label}
                  </p>
                  {!isManual && <p className="text-xs text-gray-400 mt-1">Automatisch</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Projectinformatie</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Projectnummer</p>
            <p className="font-medium text-gray-900">{project.project_number || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Projectnaam</p>
            <p className="font-medium text-gray-900">{project.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Klantnaam</p>
            <p className="font-medium text-gray-900">{user?.full_name || client?.company_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">E-mailadres klant</p>
            <p className="font-medium text-gray-900">{user?.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Adres object</p>
            <p className="font-medium text-gray-900">{project.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Shootdatum</p>
            <p className="font-medium text-gray-900">
              {project.shoot_date ? format(new Date(project.shoot_date), 'd MMMM yyyy', { locale: nl }) : 
               booking?.start_datetime ? format(new Date(booking.start_datetime), 'd MMMM yyyy', { locale: nl }) : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Starttijd</p>
            <p className="font-medium text-gray-900">
              {project.shoot_time || 
               (booking?.start_datetime ? format(new Date(booking.start_datetime), 'HH:mm') : '-')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div>
            <Label htmlFor="delivery">Verwachte opleverdatum</Label>
            <Input
              id="delivery"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="notes">Interne notities</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5"
            rows={4}
            placeholder="Notities voor intern gebruik..."
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
          >
            {updateMutation.isPending ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>

      {/* Bewerkte Opleverbestanden */}
      <Collapsible open={deliveryOpen} onOpenChange={setDeliveryOpen} className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <CollapsibleTrigger className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <h2 className="text-lg font-medium text-gray-900">Bewerkte Opleverbestanden</h2>
            <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", deliveryOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-8 pb-8 space-y-6">
              {deliveryCategories.map(category => {
                const categoryFiles = projectFiles.filter(f => f.category === category.key);
                const selectedCount = categoryFiles.filter(f => selectedFiles[f.id]).length;
                const allSelected = categoryFiles.length > 0 && categoryFiles.every(f => selectedFiles[f.id]);

                return (
                  <div key={category.key} className="border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-medium text-gray-900">{category.label}</h3>
                      <div className="flex items-center gap-2">
                        {categoryFiles.length > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllInCategory(category.key)}
                            >
                              {allSelected ? 'Deselecteer alles' : 'Alles selecteren'}
                            </Button>
                            {selectedCount > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleDownloadSelected(category.key)}
                                className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download ({selectedCount})
                              </Button>
                            )}
                          </>
                        )}
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(category.key, e)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={uploadingCategory === category.key}
                          />
                          <Button
                            size="sm"
                            disabled={uploadingCategory === category.key}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {uploadingCategory === category.key ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploaden...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Uploaden
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {categoryFiles.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Nog geen bestanden geüpload
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {categoryFiles.map(file => (
                          <div 
                            key={file.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedFiles[file.id]}
                              onChange={() => toggleFileSelection(file.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                              <p className="text-xs text-gray-400">
                                {(file.file_size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(file.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Raw Bestanden (Admin Only) */}
      <Collapsible open={rawOpen} onOpenChange={setRawOpen} className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <CollapsibleTrigger className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Raw Bestanden</h2>
              <p className="text-sm text-gray-400 mt-1">Alleen zichtbaar voor admin</p>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", rawOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-8 pb-8 space-y-6">
              {rawCategories.map(category => {
                const categoryFiles = projectFiles.filter(f => f.category === category.key);
                const selectedCount = categoryFiles.filter(f => selectedFiles[f.id]).length;
                const allSelected = categoryFiles.length > 0 && categoryFiles.every(f => selectedFiles[f.id]);

                return (
                  <div key={category.key} className="border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-medium text-gray-900">{category.label}</h3>
                      <div className="flex items-center gap-2">
                        {categoryFiles.length > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllInCategory(category.key)}
                            >
                              {allSelected ? 'Deselecteer alles' : 'Alles selecteren'}
                            </Button>
                            {selectedCount > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleDownloadSelected(category.key)}
                                className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download ({selectedCount})
                              </Button>
                            )}
                          </>
                        )}
                        <div className="relative">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(category.key, e)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={uploadingCategory === category.key}
                          />
                          <Button
                            size="sm"
                            disabled={uploadingCategory === category.key}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {uploadingCategory === category.key ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploaden...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Uploaden
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {categoryFiles.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Nog geen bestanden geüpload
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {categoryFiles.map(file => (
                          <div 
                            key={file.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedFiles[file.id]}
                              onChange={() => toggleFileSelection(file.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                              <p className="text-xs text-gray-400">
                                {(file.file_size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(file.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Factuur */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Factuur</h2>
          {!projectInvoice && (
            <Button 
              onClick={() => setInvoiceDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Factuur Aanmaken
            </Button>
          )}
        </div>

        {projectInvoice ? (
          <div className="border border-gray-100 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Factuurnummer</p>
                <p className="font-medium text-gray-900">{projectInvoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Datum</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(projectInvoice.invoice_date), 'd MMMM yyyy', { locale: nl })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Bedrag (excl. BTW)</p>
                <p className="font-medium text-gray-900">€ {projectInvoice.amount?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">BTW</p>
                <p className="font-medium text-gray-900">€ {projectInvoice.vat_amount?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Totaalbedrag</p>
                <p className="font-medium text-gray-900 text-lg">€ {projectInvoice.total_amount?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span className={cn(
                  "inline-flex px-3 py-1 rounded-full text-xs font-medium",
                  projectInvoice.status === 'betaald' ? "bg-green-50 text-green-700" :
                  projectInvoice.status === 'verzonden' ? "bg-blue-50 text-blue-700" :
                  "bg-gray-100 text-gray-500"
                )}>
                  {projectInvoice.status === 'betaald' ? 'Betaald' : 
                   projectInvoice.status === 'verzonden' ? 'Verzonden' : 'Concept'}
                </span>
              </div>
            </div>
            {projectInvoice.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-400 mb-1">Omschrijving</p>
                <p className="text-sm text-gray-900">{projectInvoice.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Nog geen factuur aangemaakt
          </div>
        )}
      </div>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Factuur Aanmaken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Factuurnummer</Label>
              <Input value={project.project_number || ''} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                value={invoiceData.description}
                onChange={(e) => setInvoiceData({...invoiceData, description: e.target.value})}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Bedrag (excl. BTW)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={invoiceData.amount}
                  onChange={(e) => setInvoiceData({...invoiceData, amount: e.target.value})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="vat">BTW</Label>
                <Input
                  id="vat"
                  type="number"
                  step="0.01"
                  value={invoiceData.vat_amount}
                  onChange={(e) => setInvoiceData({...invoiceData, vat_amount: e.target.value})}
                  className="mt-1.5"
                />
              </div>
            </div>
            {invoiceData.amount && invoiceData.vat_amount && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Totaalbedrag: <span className="font-medium text-gray-900">
                    € {(parseFloat(invoiceData.amount) + parseFloat(invoiceData.vat_amount)).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                Annuleren
              </Button>
              <Button 
                onClick={() => createInvoiceMutation.mutate(invoiceData)}
                disabled={!invoiceData.amount || !invoiceData.vat_amount}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Aanmaken
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}