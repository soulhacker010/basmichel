import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Download, Upload, ArrowLeft, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusConfig = {
  geboekt: { label: 'Booked', color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
  shoot_uitgevoerd: { label: 'Shoot Done', color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
  wordt_bewerkt: { label: 'In Editing', color: 'bg-purple-500', bgLight: 'bg-purple-50', textColor: 'text-purple-700' },
  klaar: { label: 'Completed', color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-700' },
};

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
      if (project) setSelectedProject(project);
    }
  }, [projectId, projects]);

  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.ProjectFile.create({
        project_id: selectedProject.id,
        category: 'bewerkte_fotos',
        file_url,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles'] });
      toast.success('File uploaded');
    },
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

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingFiles(true);
    for (const file of files) {
      await uploadFileMutation.mutateAsync(file);
    }
    setUploadingFiles(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setUploadingNote(true);
    
    const uploadedImages = [];
    for (const file of noteImages) {
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

  const handleDownloadFile = (fileUrl, filename) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (selectedProject) {
    const client = clients.find(c => c.id === selectedProject.client_id);
    const rawFiles = projectFiles.filter(f => f.category.includes('raw'));
    const editedFiles = projectFiles.filter(f => f.category.includes('bewerkte'));

    return (
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedProject(null);
            window.history.pushState({}, '', createPageUrl('EditorProjects'));
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className={cn("rounded-xl p-8 mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <div className="flex items-start justify-between mb-6">
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Shoot Date</p>
              <p className={cn("font-medium mt-1", darkMode ? "text-gray-100" : "text-gray-900")}>
                {selectedProject.shoot_date ? format(new Date(selectedProject.shoot_date), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
            <div>
              <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Client</p>
              <p className={cn("font-medium mt-1", darkMode ? "text-gray-100" : "text-gray-900")}>{client?.contact_name || 'N/A'}</p>
            </div>
            <div>
              <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Email</p>
              <p className={cn("font-medium mt-1", darkMode ? "text-gray-100" : "text-gray-900")}>{client?.user_id ? clients.find(c => c.id === client.id)?.contact_name : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Raw Files */}
        <div className={cn("rounded-xl p-6 mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <h2 className={cn("text-lg font-medium mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>Raw Files ({rawFiles.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rawFiles.map(file => (
              <div key={file.id} className="group relative">
                {file.mime_type?.startsWith('image/') ? (
                  <img src={file.file_url} alt={file.filename} className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownloadFile(file.file_url, file.filename)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Edited Files */}
        <div className={cn("rounded-xl p-6 mb-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <h2 className={cn("text-lg font-medium mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>Upload Edited Files</h2>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploadingFiles}>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploadingFiles ? 'Uploading...' : 'Select Files'}
              </span>
            </Button>
          </label>
          {editedFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {editedFiles.map(file => (
                <div key={file.id}>
                  {file.mime_type?.startsWith('image/') ? (
                    <img src={file.file_url} alt={file.filename} className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor Notes */}
        <div className={cn("rounded-xl p-6", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <h2 className={cn("text-lg font-medium mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>Editor Notes</h2>
          <div className="space-y-4 mb-6">
            {editorNotes.map(note => (
              <div key={note.id} className={cn("rounded-lg p-4", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                <p className={cn("text-sm whitespace-pre-wrap", darkMode ? "text-gray-100" : "text-gray-900")}>{note.note}</p>
                {note.images && note.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
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
      <div className="mb-8">
        <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>All Projects</h1>
        <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>View and manage project files</p>
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
            <TabsTrigger value="shoot_uitgevoerd">Shoot Done</TabsTrigger>
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
                window.history.pushState({}, '', `${createPageUrl('EditorProjects')}?id=${project.id}`);
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