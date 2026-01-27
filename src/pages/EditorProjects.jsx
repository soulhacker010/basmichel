import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Download, Upload, ArrowLeft, FileText, ChevronDown, Info, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusConfig = {
  geboekt: { label: 'Booked', color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
  shoot_uitgevoerd: { label: 'Revisions', color: 'bg-orange-500', bgLight: 'bg-orange-50', textColor: 'text-orange-700' },
  wordt_bewerkt: { label: 'In Editing', color: 'bg-purple-500', bgLight: 'bg-purple-50', textColor: 'text-purple-700' },
  klaar: { label: 'Completed', color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-700' },
  sold: { label: 'Sold', color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700' },
};

// File category definitions (matching AdminProjectDetail)
const rawCategories = [
  { key: 'raw_fotos', label: "Raw Foto's" },
  { key: 'raw_videos', label: "Raw Video's" },
  { key: '360_raw', label: "360° Foto's" },
  { key: 'pointcloud', label: 'Pointcloud' },
];

const deliveryCategories = [
  { key: 'bewerkte_fotos', label: "Foto's" },
  { key: 'bewerkte_videos', label: "Video's" },
  { key: '360_matterport', label: '360° / Matterport' },
  { key: 'meetrapport', label: 'MRP' },
];

export default function EditorProjects() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteImages, setNoteImages] = useState([]);
  const [uploadingNote, setUploadingNote] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ total: 0, completed: 0, failed: 0, current: [] });
  const [showClientNotes, setShowClientNotes] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('editorDarkMode') === 'true';
  });
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData]);

  const { data: editors = [] } = useQuery({
    queryKey: ['editors'],
    queryFn: () => base44.entities.Editor.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && editors.length > 0) {
      const editorData = editors.find(e => e.user_id === user.id && e.status === 'active');
      if (editorData) setEditor(editorData);
    }
  }, [user, editors]);

  const { data: projects = [] } = useQuery({
    queryKey: ['allProjects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: projectFiles = [] } = useQuery({
    queryKey: ['projectFiles', selectedProject?.id],
    queryFn: () => base44.entities.ProjectFile.filter({ project_id: selectedProject.id }),
    enabled: !!selectedProject,
  });

  const { data: editorNotes = [] } = useQuery({
    queryKey: ['editorNotes', selectedProject?.id],
    queryFn: () => base44.entities.EditorNote.filter({ project_id: selectedProject.id }, '-created_date'),
    enabled: !!selectedProject,
  });

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projectId, projects]);

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, category }) => {
      console.log(`Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

      // 1. Get Presigned URL
      const { data: presignedData } = await base44.functions.invoke('storage', {
        action: 'getPresignedUrl',
        fileName: file.name,
        fileType: file.type
      });

      if (!presignedData.success) {
        console.error('Presigned URL failed:', presignedData);
        throw new Error(presignedData.error || 'Failed to get upload URL');
      }

      console.log(`Got presigned URL for: ${file.name}`);

      // 2. Upload to R2 using XMLHttpRequest for progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            console.log(`${file.name}: ${percentComplete}% (${(e.loaded / 1024 / 1024).toFixed(1)}MB / ${(e.total / 1024 / 1024).toFixed(1)}MB)`);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`Upload complete for ${file.name}: ${xhr.status}`);
            resolve();
          } else {
            console.error(`Upload failed for ${file.name}: ${xhr.status}`, xhr.responseText);
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error(`Network error uploading ${file.name}`);
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          console.error(`Upload aborted for ${file.name}`);
          reject(new Error('Upload was aborted'));
        });

        xhr.open('PUT', presignedData.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      console.log(`Upload complete, saving metadata: ${file.name}`);

      // 3. Save Metadata
      const fileUrl = presignedData.publicUrl
        ? presignedData.publicUrl
        : presignedData.uploadUrl.split('?')[0];

      return base44.entities.ProjectFile.create({
        project_id: selectedProject.id,
        category: category || 'general',
        file_url: fileUrl,
        file_key: presignedData.fileKey,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', selectedProject?.id] });
    },
    onError: (err) => {
      console.error('Upload mutation error:', err);
      toast.error('Upload failed: ' + err.message);
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (file) => {
      // If we have a file_key, delete from R2
      if (file.file_key) {
        try {
          await base44.functions.invoke('storage', {
            action: 'deleteFile',
            fileKey: file.file_key
          });
        } catch (err) {
          console.warn('R2 delete failed (file may already be gone):', err);
        }
      } else {
        console.warn('No file_key found for file:', file.filename, '- skipping R2 delete');
      }
      // Always delete from DB
      return base44.entities.ProjectFile.delete(file.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', selectedProject?.id] });
      toast.success('File deleted');
    },
    onError: (err) => {
      console.error('Delete error:', err);
      toast.error('Failed to delete file: ' + err.message);
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.EditorNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorNotes'] });
      setNoteText('');
      setNoteImages([]);
      toast.success('Note added');
    },
  });

  const updateProjectStatusMutation = useMutation({
    mutationFn: ({ projectId, status }) => base44.entities.Project.update(projectId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProjects'] });
      toast.success('Project status updated');
    },
  });

  const syncCalendarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject.shoot_date) throw new Error('No shoot date set');

      const response = await base44.functions.invoke('calendar', {
        action: 'syncEvent',
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
        shootDate: selectedProject.shoot_date,
        calendarEventId: selectedProject.calendar_event_id
      });

      const data = response.data;
      if (!data || !data.success) throw new Error(data?.error || 'Sync function returned no success');

      // Update project with event ID so we know it is synced
      await base44.entities.Project.update(selectedProject.id, {
        calendar_event_id: data.calendarEventId
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProjects'] });
      toast.success('Synced to Google Calendar!');
    },
    onError: (err) => {
      toast.error('Sync failed: ' + err.message);
    }
  });

  const markSoldMutation = useMutation({
    mutationFn: async () => {
      if (!confirm('Marking this as SOLD will start a 14-day countdown to deletion. Continue?')) throw new Error('Cancelled');

      return base44.entities.Project.update(selectedProject.id, {
        status: 'sold',
        sold_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProjects'] });
      toast.success('Project marked as SOLD');
      setSelectedProject(prev => ({ ...prev, status: 'sold', sold_date: new Date().toISOString() }));
    }
  });

  const runCleanupMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('cleanup', { action: 'runCleanup' });
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allProjects'] });
      toast.success(`Cleanup Complete: Deleted ${data.deletedCount} projects.`);
      console.log('Cleanup Log:', data.log);
    },
    onError: (err) => {
      toast.error('Cleanup Failed: ' + err.message);
    }
  });

  // Parallel upload handler - uploads 5 files at a time
  const handleFileUpload = async (e, category = 'general') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // For large files (>50MB avg), use fewer concurrent uploads
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const avgSize = totalSize / files.length;
    const CONCURRENT_UPLOADS = avgSize > 50 * 1024 * 1024 ? 2 : 5;

    console.log(`Starting batch upload: ${files.length} files, ${(totalSize / 1024 / 1024).toFixed(0)}MB total, ${CONCURRENT_UPLOADS} concurrent`);

    setUploadingCategory(category);
    setUploadProgress({ total: files.length, completed: 0, failed: 0, current: [] });

    // Create upload queue
    const queue = [...files];
    const results = { completed: 0, failed: 0 };

    // Process files in parallel batches
    const uploadFile = async (file) => {
      try {
        // Update current uploading files
        setUploadProgress(prev => ({
          ...prev,
          current: [...prev.current, file.name].slice(-5) // Show last 5 uploading
        }));

        await uploadFileMutation.mutateAsync({ file, category });
        results.completed++;
        setUploadProgress(prev => ({
          ...prev,
          completed: results.completed,
          current: prev.current.filter(n => n !== file.name)
        }));
      } catch (err) {
        results.failed++;
        setUploadProgress(prev => ({
          ...prev,
          failed: results.failed,
          current: prev.current.filter(n => n !== file.name)
        }));
        console.error(`Failed to upload ${file.name}:`, err);
      }
    };

    // Process queue with concurrency limit
    const activeUploads = new Set();

    while (queue.length > 0 || activeUploads.size > 0) {
      // Start new uploads up to the concurrency limit
      while (activeUploads.size < CONCURRENT_UPLOADS && queue.length > 0) {
        const file = queue.shift();
        const uploadPromise = uploadFile(file).finally(() => {
          activeUploads.delete(uploadPromise);
        });
        activeUploads.add(uploadPromise);
      }

      // Wait for at least one upload to complete
      if (activeUploads.size > 0) {
        await Promise.race(activeUploads);
      }
    }

    // Show completion toast
    if (results.failed === 0) {
      toast.success(`Successfully uploaded ${results.completed} files!`);
    } else {
      toast.warning(`Uploaded ${results.completed} files, ${results.failed} failed`);
    }

    setUploadingCategory(null);
    setUploadProgress({ total: 0, completed: 0, failed: 0, current: [] });
    e.target.value = ''; // Reset input
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setUploadingNote(true);

    // TODO: Migrate note image uploads to R2 using the same pattern if needed. 
    // For now keeping legacy behavior or assumes it works differently. 
    // Ideally we should switch this too.
    const uploadedImages = [];
    for (const file of noteImages) {
      // Using existing core upload for notes for now unless requested to migrate EVERYTHING.
      // Prioritizing project files as requested.
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedImages.push(file_url);
    }

    await createNoteMutation.mutateAsync({
      project_id: selectedProject.id,
      editor_id: editor.id,
      note: noteText,
      images: uploadedImages,
    });

    setUploadingNote(false);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (selectedProject) {
    const client = clients.find(c => c.id === selectedProject.client_id);

    return (
      <div className="max-w-7xl mx-auto">
        <Dialog open={showClientNotes} onOpenChange={setShowClientNotes}>
          <DialogContent className={cn(darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white")}>
            <DialogHeader>
              <DialogTitle>Client Notes - {client?.company_name}</DialogTitle>
            </DialogHeader>
            <div className={cn("mt-4", darkMode ? "text-gray-300" : "text-gray-700")}>
              {client?.notes ? (
                <p className="whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <p className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>No notes available for this client.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          onClick={() => {
            setSelectedProject(null);
            window.history.pushState({}, '', '/EditorProjects'); // Simplified URL handling
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className={cn("rounded-xl p-8 mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
            <div>
              <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>{selectedProject.title}</h1>
              <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>{client?.company_name}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity",
                  statusConfig[selectedProject.status]?.bgLight,
                  statusConfig[selectedProject.status]?.textColor
                )}>
                  {statusConfig[selectedProject.status]?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => updateProjectStatusMutation.mutate({ projectId: selectedProject.id, status: 'geboekt' })}>
                  Upcoming
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateProjectStatusMutation.mutate({ projectId: selectedProject.id, status: 'wordt_bewerkt' })}>
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateProjectStatusMutation.mutate({ projectId: selectedProject.id, status: 'klaar' })}>
                  Finished
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateProjectStatusMutation.mutate({ projectId: selectedProject.id, status: 'shoot_uitgevoerd' })}>
                  Revisions
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => markSoldMutation.mutate()}>
                  Mark as Sold
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {selectedProject.status === 'sold' && selectedProject.sold_date && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <Trash2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">Specified for Deletion</p>
                  <p className="text-sm">Auto-delete scheduled 14 days from: {format(new Date(selectedProject.sold_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div>
              <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Project Nummer</p>
              <p className={cn("font-medium mt-1", darkMode ? "text-gray-100" : "text-gray-900")}>{selectedProject.project_number || 'N/A'}</p>
            </div>
            <div>
              <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Shoot Date</p>
              <p className={cn("font-medium mt-1", darkMode ? "text-gray-100" : "text-gray-900")}>
                {selectedProject.shoot_date ? format(new Date(selectedProject.shoot_date), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Client</p>
              <button
                onClick={() => setShowClientNotes(true)}
                className={cn("font-medium mt-1 flex items-center gap-1 hover:underline", darkMode ? "text-gray-100 hover:text-gray-300" : "text-gray-900 hover:text-gray-700")}
              >
                {client?.contact_name || 'N/A'}
                <Info className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Bedrijf</p>
              <p className={cn("font-medium mt-1", darkMode ? "text-gray-100" : "text-gray-900")}>{client?.company_name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress.total > 0 && (
          <div className={cn("rounded-xl p-4 mb-6", darkMode ? "bg-blue-900/30 border border-blue-700" : "bg-blue-50 border border-blue-200")}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-sm font-medium", darkMode ? "text-blue-300" : "text-blue-700")}>
                Uploading files: {uploadProgress.completed} / {uploadProgress.total}
                {uploadProgress.failed > 0 && <span className="text-red-500 ml-2">({uploadProgress.failed} failed)</span>}
              </span>
              <span className={cn("text-xs", darkMode ? "text-blue-400" : "text-blue-600")}>
                {Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%
              </span>
            </div>
            <div className={cn("h-2 rounded-full overflow-hidden", darkMode ? "bg-gray-700" : "bg-blue-100")}>
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
              />
            </div>
            {uploadProgress.current.length > 0 && (
              <p className={cn("text-xs mt-2 truncate", darkMode ? "text-gray-400" : "text-gray-500")}>
                Currently uploading: {uploadProgress.current.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Project Files Section - Delivery Categories */}
        <div className={cn("rounded-xl p-6 mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <h2 className={cn("text-lg font-medium mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>Bewerkte Bestanden</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliveryCategories.map(category => {
              const categoryFiles = projectFiles.filter(f => f.category === category.key);
              return (
                <div key={category.key} className={cn("border rounded-xl p-4", darkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn("font-medium text-sm", darkMode ? "text-gray-100" : "text-gray-900")}>{category.label}</h3>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, category.key)}
                      className="hidden"
                      id={`upload-${category.key}`}
                    />
                    <label htmlFor={`upload-${category.key}`}>
                      <Button size="sm" variant="outline" asChild disabled={uploadingCategory === category.key}>
                        <span className="cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          {uploadingCategory === category.key ? 'Uploading...' : 'Upload'}
                        </span>
                      </Button>
                    </label>
                  </div>
                  {categoryFiles.length === 0 ? (
                    <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>Geen bestanden</p>
                  ) : (
                    <div className="space-y-2">
                      {categoryFiles.map(file => (
                        <div key={file.id} className={cn("flex items-center justify-between p-2 rounded-lg", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                          <div className="flex items-center gap-2 min-w-0">
                            {file.mime_type?.startsWith('image/') ? (
                              <img src={file.file_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            ) : (
                              <FileText className="w-8 h-8 p-1.5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className={cn("text-xs font-medium truncate", darkMode ? "text-gray-100" : "text-gray-900")}>{file.filename}</p>
                              <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
                                {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => window.open(file.file_url, '_blank')}>
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                if (confirm('Delete this file?')) deleteFileMutation.mutate(file);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Raw Files Section */}
        <div className={cn("rounded-xl p-6 mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <h2 className={cn("text-lg font-medium mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>Raw Bestanden</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rawCategories.map(category => {
              const categoryFiles = projectFiles.filter(f => f.category === category.key);
              return (
                <div key={category.key} className={cn("border rounded-xl p-4", darkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn("font-medium text-sm", darkMode ? "text-gray-100" : "text-gray-900")}>{category.label}</h3>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, category.key)}
                      className="hidden"
                      id={`upload-raw-${category.key}`}
                    />
                    <label htmlFor={`upload-raw-${category.key}`}>
                      <Button size="sm" variant="outline" asChild disabled={uploadingCategory === category.key}>
                        <span className="cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          {uploadingCategory === category.key ? 'Uploading...' : 'Upload'}
                        </span>
                      </Button>
                    </label>
                  </div>
                  {categoryFiles.length === 0 ? (
                    <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>Geen bestanden</p>
                  ) : (
                    <div className="space-y-2">
                      {categoryFiles.map(file => (
                        <div key={file.id} className={cn("flex items-center justify-between p-2 rounded-lg", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                          <div className="flex items-center gap-2 min-w-0">
                            {file.mime_type?.startsWith('image/') ? (
                              <img src={file.file_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            ) : (
                              <FileText className="w-8 h-8 p-1.5 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className={cn("text-xs font-medium truncate", darkMode ? "text-gray-100" : "text-gray-900")}>{file.filename}</p>
                              <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-400")}>
                                {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => window.open(file.file_url, '_blank')}>
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                if (confirm('Delete this file?')) deleteFileMutation.mutate(file);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor Notes */}
        <div className={cn("rounded-xl p-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <h2 className={cn("text-lg font-medium mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>Editor Notes</h2>
          <div className="space-y-4 mb-6">
            {editorNotes.map(note => (
              <div key={note.id} className={cn("rounded-lg p-4", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                <p className={cn("text-sm whitespace-pre-wrap", darkMode ? "text-gray-100" : "text-gray-900")}>{note.note}</p>
                {note.images && note.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                    {note.images.map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-full h-24 object-cover rounded" />
                    ))}
                  </div>
                )}
                <p className={cn("text-xs mt-2", darkMode ? "text-gray-500" : "text-gray-400")}>
                  {format(new Date(note.created_date), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Textarea
              placeholder="Add a note about this project..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setNoteImages(Array.from(e.target.files))}
                className="text-sm"
              />
              <Button
                onClick={handleAddNote}
                disabled={!noteText.trim() || uploadingNote}
                className="bg-purple-600 hover:bg-purple-700 text-white ml-auto"
              >
                {uploadingNote ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>All Projects</h1>
          <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>View and manage project files</p>
        </div>

        {/* Admin Cleanup Button - Only visible if user has role 'admin' (assuming 'role' field exists) */}
        {user?.role === 'admin' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Run Cleanup? This will PERMANENTLY delete all projects marked "Sold" more than 14 days ago.')) {
                runCleanupMutation.mutate();
              }
            }}
            disabled={runCleanupMutation.isPending}
          >
            {runCleanupMutation.isPending ? 'Cleaning...' : 'Run Auto-Deletion'}
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="shoot_uitgevoerd">Revisions</TabsTrigger>
            <TabsTrigger value="wordt_bewerkt">In Editing</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => {
          const client = clients.find(c => c.id === project.client_id);
          const status = statusConfig[project.status];
          return (
            <div
              key={project.id}
              onClick={() => {
                setSelectedProject(project);
                window.history.pushState({}, '', `/EditorProjects?id=${project.id}`);
              }}
              className={cn("rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group",
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
              )}
            >
              <div className="h-2 w-full">
                <div className={cn("h-full", status?.color)} />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={cn("font-medium group-hover:text-purple-600 transition-colors",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      {project.title}
                    </h3>
                    {client?.company_name && (
                      <div className={cn("text-xs mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>{client.company_name}</div>
                    )}
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", status?.bgLight, status?.textColor)}>
                    {status?.label}
                  </span>
                </div>
                <div className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-400")}>
                  {project.created_date && format(new Date(project.created_date), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}