import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Upload,
  Download,
  CheckCircle2,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusSteps = [
  { key: 'geboekt', label: 'Geboekt' },
  { key: 'shoot_uitgevoerd', label: 'Shoot uitgevoerd' },
  { key: 'wordt_bewerkt', label: 'Wordt bewerkt' },
  { key: 'klaar', label: 'Klaar' },
];

const fileCategories = [
  { 
    key: 'raw_fotos', 
    label: 'Raw Foto\'s',
    accept: '.DNG,.CR2,.NEF,.ARW,.RAF',
    mimeTypes: ['image/x-adobe-dng', 'image/x-canon-cr2', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-fuji-raf']
  },
  { 
    key: 'raw_videos', 
    label: 'Raw Video\'s',
    accept: '.MOV,.MP4',
    mimeTypes: ['video/quicktime', 'video/mp4']
  },
  { 
    key: '360_fotos', 
    label: '360° Foto\'s',
    accept: '.JPG,.JPEG,.PNG',
    mimeTypes: ['image/jpeg', 'image/png']
  },
  { 
    key: 'pointcloud', 
    label: 'Pointcloud',
    accept: '.E57,.PLY',
    mimeTypes: ['application/octet-stream', 'text/plain']
  },
];

export default function AdminProjectDetail() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingCategory, setUploadingCategory] = useState(null);
  
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
    enabled: !!projectId && project?.status === 'klaar',
  });

  React.useEffect(() => {
    if (project) {
      setSelectedStatus(project.status);
      setNotes(project.notes || '');
      setDeliveryDate(project.delivery_datetime ? format(new Date(project.delivery_datetime), "yyyy-MM-dd'T'HH:mm") : '');
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
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

  const handleSave = () => {
    updateMutation.mutate({
      id: projectId,
      data: {
        status: selectedStatus,
        delivery_datetime: deliveryDate || null,
        notes,
      }
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
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <button
                    onClick={() => setSelectedStatus(step.key)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all bg-white",
                      isCompleted 
                        ? "bg-[#5C6B52] border-[#5C6B52] text-white" 
                        : "border-gray-200 text-gray-300 hover:border-gray-300"
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
          {booking && (
            <>
              <div>
                <p className="text-sm text-gray-400 mb-1">Boekingsdatum</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(booking.start_datetime), 'd MMMM yyyy', { locale: nl })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Starttijd</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(booking.start_datetime), 'HH:mm')}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
          <div>
            <Label htmlFor="delivery">Opleverdatum en tijd</Label>
            <Input
              id="delivery"
              type="datetime-local"
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

      {/* Files Section - Only visible when status is "klaar" */}
      {selectedStatus === 'klaar' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Bestanden</h2>
          
          <div className="space-y-8">
            {fileCategories.map(category => {
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
                          accept={category.accept}
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
                              Bestanden uploaden
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
        </div>
      )}
    </div>
  );
}