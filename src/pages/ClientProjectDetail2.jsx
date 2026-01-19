import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Download,
  CheckCircle2,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { key: 'raw_fotos', label: 'Raw Foto\'s' },
  { key: 'raw_videos', label: 'Raw Video\'s' },
  { key: '360_fotos', label: '360° Foto\'s' },
  { key: 'pointcloud', label: 'Pointcloud' },
];

export default function ClientProjectDetail2() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

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

  const { data: clientUser } = useQuery({
    queryKey: ['clientUser', client?.user_id],
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

  // Security check
  if (project && clientId && project.client_id !== clientId) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <p className="text-gray-500">U heeft geen toegang tot dit project.</p>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === project.status);

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

  return (
    <div className="max-w-5xl mx-auto">
      <Link 
        to={createPageUrl('ClientProjects')}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-8 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar projecten
      </Link>

      {/* Status Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-gray-900">{project.title}</h1>
            {project.address && (
              <div className="flex items-center gap-2 text-gray-400 mt-2">
                <MapPin className="w-4 h-4" />
                <span>{project.address}{project.city && `, ${project.city}`}</span>
              </div>
            )}
          </div>
          {project.delivery_datetime && project.status !== 'klaar' && (
            <div className="text-left md:text-right bg-[#F8FAF7] rounded-xl px-5 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Verwachte levering</p>
              <p className="font-medium text-[#5C6B52]">
                {format(new Date(project.delivery_datetime), 'd MMMM yyyy', { locale: nl })}
              </p>
            </div>
          )}
        </div>

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
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all bg-white",
                    isCompleted 
                      ? "bg-[#5C6B52] border-[#5C6B52] text-white" 
                      : "border-gray-200 text-gray-300"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Projectnaam</p>
            <p className="font-medium text-gray-900">{project.title}</p>
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
      </div>

      {/* Files Section - Only visible when status is "klaar" */}
      {project.status === 'klaar' && projectFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Bestanden</h2>
          
          <div className="space-y-8">
            {fileCategories.map(category => {
              const categoryFiles = projectFiles.filter(f => f.category === category.key);
              if (categoryFiles.length === 0) return null;

              const selectedCount = categoryFiles.filter(f => selectedFiles[f.id]).length;
              const allSelected = categoryFiles.every(f => selectedFiles[f.id]);

              return (
                <div key={category.key} className="border border-gray-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium text-gray-900">{category.label}</h3>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </div>

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
                        <a 
                          href={file.file_url}
                          download={file.filename}
                          className="text-[#5C6B52] hover:text-[#4A5641]"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}