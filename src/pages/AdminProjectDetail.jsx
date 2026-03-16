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
  Plus,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import EditorNotesSection from '@/components/project/EditorNotesSection';
import AddEditorNote from '@/components/project/AddEditorNote';
import ExtraSessionsSection from '@/components/project/ExtraSessionsSection';
import InvoiceDialog from '@/components/project/InvoiceDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const statusSteps = [
  { key: 'geboekt', label: 'Geboekt' },
  { key: 'shoot_uitgevoerd', label: 'Shoot uitgevoerd' },
  { key: 'wordt_bewerkt', label: 'Wordt bewerkt' },
  { key: 'klaar', label: 'Klaar' },
];

const deliveryCategories = [
  { key: 'bewerkte_fotos', label: "Bewerkte foto's" },
  { key: 'bewerkte_videos', label: 'Bewerkte video\'s' },
  { key: '360_matterport', label: '360 graden / Matterport' },
  { key: 'meetrapport', label: 'Meetrapport' },
];

const rawCategories = [
  { key: 'raw_fotos', label: "Raw Foto's" },
  { key: 'raw_videos', label: "Raw Video's" },
  { key: '360_raw', label: '360 graden Foto\'s' },
  { key: 'pointcloud', label: 'Pointcloud' },
];

export default function AdminProjectDetail() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [rawOpen, setRawOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [matterportLink, setMatterportLink] = useState('');
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    items: [{ title: '', description: '', quantity: 1, unit_price: '' }],
    vat_percentage: 21,
    discount_amount: 0,
    use_custom_recipient: false,
    recipient_name: '',
    recipient_email: '',
    recipient_address: '',
    template_id: '',
    cc_emails: '',
    recipient_client_ids: [],
  });

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

  const { data: adminUser } = useQuery({
    queryKey: ['currentAdmin'],
    queryFn: () => base44.auth.me(),
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

  const { data: invoiceTemplates = [] } = useQuery({
    queryKey: ['invoiceTemplates'],
    queryFn: async () => {
      const templates = await base44.entities.Template.filter({ type: 'factuur' });
      return templates || [];
    },
  });

  const { data: allClients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.Client.list(),
  });

  useEffect(() => {
    if (project) {
      setSelectedStatus(project.status);
      setNotes(project.notes || '');
      setDeliveryDate(project.delivery_date || '');

      if (!project.drive_folder_id && project.project_number) {
        base44.functions.invoke('googleDrive', {
          action: 'createFolder',
          projectId: project.id,
          projectNumber: project.project_number
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }).catch(err => console.error('Failed to create Drive folder:', err));
      }

      if (project.drive_raw_folder_id) {
        setLoadingDriveFiles(true);
        base44.functions.invoke('googleDrive', {
          action: 'listFiles',
          folderId: project.drive_raw_folder_id
        }).then(response => {
          setDriveFiles(response.data.files || []);
          setLoadingDriveFiles(false);
        }).catch(err => {
          console.error('Failed to load Drive files:', err);
          setLoadingDriveFiles(false);
        });
      }
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      if (variables.data.status === 'klaar' && project.status !== 'klaar') {
        if (projectInvoice && !projectInvoice.invoice_date) {
          const invoiceDate = format(new Date(), 'yyyy-MM-dd');
          const dueDate = format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
          await base44.entities.ProjectInvoice.update(projectInvoice.id, {
            invoice_date: invoiceDate,
            due_date: dueDate,
            status: 'verzonden',
          });
          queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }

        try {
          const existingGalleries = await base44.entities.Gallery.filter({ project_id: project.id });
          const existingGallery = existingGalleries?.[0];
          if (existingGallery) {
            if (existingGallery.status !== 'gepubliceerd') {
              await base44.entities.Gallery.update(existingGallery.id, { status: 'gepubliceerd' });
            }
          } else {
            const baseSlug = (project.title || 'galerij').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const suffix = project.project_number || project.id?.slice(0, 6);
            await base44.entities.Gallery.create({
              title: project.title || 'Galerij',
              slug: `${baseSlug}-${suffix}`,
              client_id: project.client_id,
              project_id: project.id,
              status: 'gepubliceerd',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['galleries'] });
        } catch (galleryError) {
          console.error('Failed to ensure gallery on klaar:', galleryError);
        }

        if (user?.email) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            from_name: 'Bas Michel Fotografie',
            subject: `Je project is klaar - ${project.title}`,
            body: `<p>Beste ${user.full_name || 'klant'},</p><p>Goed nieuws! Je project <strong>${project.title}</strong> is klaar en staat voor je klaar in het portaal.</p><p><em>Dit is een automatische e-mail — reageren heeft geen effect. Log in via het portaal om je bestanden te bekijken of een revisie aan te vragen.</em></p><p>Met vriendelijke groet,<br/>Bas Michel Fotografie</p>`,
          });
        }
      }

      const shootDate = variables.data.shoot_date || project.shoot_date;
      if (shootDate) {
        try {
          const { data: calendarResponse } = await base44.functions.invoke('calendar', {
            action: 'syncEvent',
            projectId: project.id,
            projectTitle: project.title,
            shootDate: shootDate,
            shootTime: project.shoot_time || null,
            clientName: user?.full_name || client?.company_name || 'N/A',
            location: project.title,
            calendarEventId: project.calendar_event_id || null,
          });
          if (calendarResponse?.calendarEventId && !project.calendar_event_id) {
            await base44.entities.Project.update(project.id, {
              calendar_event_id: calendarResponse.calendarEventId,
            });
          }
        } catch (calendarError) {
          console.error('Auto calendar sync failed:', calendarError);
        }
      }

      toast.success('Project opgeslagen');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ category, files }) => {
      const uploadedFiles = [];
      for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        const rawFormats = ['dng', 'cr2', 'cr3', 'nef', 'arw', 'raw', 'orf', 'rw2', 'srw', 'raf'];
        const pointCloud = ['e57', 'ply', 'las', 'laz', 'pts', 'xyz', 'pcd', 'obj', 'fbx'];
        const archives = ['zip', 'rar', '7z'];
        let fileType = file.type;
        if (!fileType || rawFormats.includes(extension) || pointCloud.includes(extension) || archives.includes(extension)) {
          fileType = 'application/octet-stream';
        }

        const MULTIPART_THRESHOLD = 50 * 1024 * 1024;
        const CHUNK_SIZE = 10 * 1024 * 1024;
        let file_url, file_key;

        if (file.size > MULTIPART_THRESHOLD) {
          const { data: initData } = await base44.functions.invoke('storage', {
            action: 'createMultipartUpload',
            fileName: file.name,
            fileType: fileType
          });
          if (!initData.success) throw new Error(initData.error || 'Failed to create multipart upload');
          const { uploadId, fileKey } = initData;
          file_key = fileKey;
          const numChunks = Math.ceil(file.size / CHUNK_SIZE);
          const { data: urlsData } = await base44.functions.invoke('storage', {
            action: 'getPartPresignedUrls',
            fileKey,
            uploadId,
            numParts: numChunks
          });
          if (!urlsData.success) throw new Error(urlsData.error || 'Failed to get presigned URLs');
          const uploadedParts = [];
          const CONCURRENT_CHUNKS = 5;
          for (let i = 0; i < numChunks; i += CONCURRENT_CHUNKS) {
            const batch = [];
            for (let j = 0; j < CONCURRENT_CHUNKS && (i + j) < numChunks; j++) {
              const chunkIndex = i + j;
              const start = chunkIndex * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, file.size);
              const chunk = file.slice(start, end);
              const { partNumber, url } = urlsData.presignedUrls[chunkIndex];
              batch.push(new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.addEventListener('load', () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    let etag = null;
                    try { etag = xhr.getResponseHeader('ETag'); } catch (e) {}
                    resolve({ PartNumber: partNumber, ETag: etag ? etag.replace(/"/g, '') : '*' });
                  } else {
                    reject(new Error(`Chunk ${partNumber} failed: ${xhr.status}`));
                  }
                });
                xhr.addEventListener('error', () => reject(new Error(`Network error on chunk ${partNumber}`)));
                xhr.open('PUT', url);
                xhr.send(chunk);
              }));
            }
            const batchResults = await Promise.all(batch);
            uploadedParts.push(...batchResults);
            setUploadPercent(Math.round((Math.min(i + CONCURRENT_CHUNKS, numChunks) / numChunks) * 100));
          }
          const { data: completeData } = await base44.functions.invoke('storage', {
            action: 'completeMultipartUpload',
            fileKey,
            uploadId,
            parts: uploadedParts
          });
          if (!completeData.success) throw new Error(completeData.error || 'Failed to complete multipart upload');
          file_url = completeData.publicUrl || `${process.env.R2_PUBLIC_URL}/${fileKey}`;
        } else {
          const { data: presignedData } = await base44.functions.invoke('storage', {
            action: 'getPresignedUrl',
            fileName: file.name,
            fileType: fileType
          });
          if (!presignedData.success) throw new Error(presignedData.error || 'Failed to get upload URL');
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) setUploadPercent(Math.round((event.loaded / event.total) * 100));
            };
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`Upload failed: ${xhr.status}`));
            });
            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.open('PUT', presignedData.uploadUrl);
            xhr.setRequestHeader('Content-Type', fileType);
            xhr.send(file);
          });
          file_url = presignedData.publicUrl || presignedData.uploadUrl.split('?')[0];
          file_key = presignedData.fileKey;
        }

        await base44.entities.ProjectFile.create({
          project_id: projectId,
          category,
          file_url,
          file_key,
          filename: file.name,
          file_size: file.size,
          mime_type: fileType,
        });
        uploadedFiles.push(file_url);
      }
      return uploadedFiles;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
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
      const subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);
      const discountAmount = parseFloat(data.discount_amount) || 0;
      const afterDiscount = subtotal - discountAmount;
      const vatAmount = afterDiscount * (data.vat_percentage / 100);
      const totalAmount = afterDiscount + vatAmount;
      const shouldSetDates = project?.status === 'klaar';
      return await base44.entities.ProjectInvoice.create({
        project_id: projectId,
        client_id: project?.client_id || null,
        invoice_number: project.project_number,
        business_name: adminUser?.business_name || 'Bas Michel',
        business_address: adminUser?.address || '',
        business_phone: adminUser?.phone || '',
        business_website: adminUser?.website || '',
        business_email: adminUser?.email || 'basmichelsite@gmail.com',
        bank_account_name: adminUser?.bank_account_name || 'Bas Michel',
        bank_iban: adminUser?.bank_iban || '',
        kvk_number: adminUser?.kvk_number || '',
        vat_number: adminUser?.vat_number || '',
        client_name: data.use_custom_recipient ? data.recipient_name : (user?.full_name || client?.company_name || ''),
        client_email: data.use_custom_recipient ? data.recipient_email : (user?.email || ''),
        client_address: data.use_custom_recipient ? data.recipient_address : (project.address || ''),
        items: data.items.filter(item => item.title && item.unit_price),
        subtotal,
        discount_amount: discountAmount,
        vat_percentage: data.vat_percentage,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        invoice_date: shouldSetDates ? format(new Date(), 'yyyy-MM-dd') : null,
        due_date: shouldSetDates ? format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') : null,
        status: shouldSetDates ? 'verzonden' : 'concept',
        template_id: data.template_id || null,
        cc_emails: data.cc_emails || '',
        recipient_client_ids: Array.from(new Set([...(data.recipient_client_ids || []), project?.client_id].filter(Boolean))),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setInvoiceDialogOpen(false);
      resetInvoiceData();
      toast.success('Factuur aangemaakt');
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      const subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);
      const discountAmount = parseFloat(data.discount_amount) || 0;
      const afterDiscount = subtotal - discountAmount;
      const vatAmount = afterDiscount * (data.vat_percentage / 100);
      const totalAmount = afterDiscount + vatAmount;
      return await base44.entities.ProjectInvoice.update(projectInvoice.id, {
        client_id: project?.client_id || null,
        client_name: data.use_custom_recipient ? data.recipient_name : (user?.full_name || client?.company_name || ''),
        client_email: data.use_custom_recipient ? data.recipient_email : (user?.email || ''),
        client_address: data.use_custom_recipient ? data.recipient_address : (project.address || ''),
        items: data.items.filter(item => item.title && item.unit_price),
        subtotal,
        discount_amount: discountAmount,
        vat_percentage: data.vat_percentage,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        template_id: data.template_id || null,
        cc_emails: data.cc_emails || '',
        recipient_client_ids: Array.from(new Set([...(data.recipient_client_ids || []), project?.client_id].filter(Boolean))),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setInvoiceDialogOpen(false);
      setIsEditingInvoice(false);
      resetInvoiceData();
      toast.success('Factuur bijgewerkt');
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectInvoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factuur verwijderd');
    },
  });

  const resetInvoiceData = () => {
    setInvoiceData({
      items: [{ title: '', description: '', quantity: 1, unit_price: '' }],
      vat_percentage: 21,
      discount_amount: 0,
      use_custom_recipient: false,
      recipient_name: '',
      recipient_email: '',
      recipient_address: '',
      template_id: '',
      cc_emails: '',
      recipient_client_ids: [],
    });
  };

  const handleSave = () => {
    const updates = { status: selectedStatus, delivery_date: deliveryDate || null, notes };
    if (selectedStatus === 'klaar' && project.status !== 'klaar') {
      updates.completed_date = format(new Date(), 'yyyy-MM-dd');
    }
    updateMutation.mutate({ id: projectId, data: updates });
  };

  const handleFileUpload = async (category, event) => {
    const allFiles = Array.from(event.target.files);
    if (allFiles.length === 0) return;
    setUploadingCategory(category);
    setUploadPercent(0);
    const BATCH_SIZE = 5;
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      setUploadPercent(Math.round((i / allFiles.length) * 100));
      await uploadMutation.mutateAsync({ category, files: batch });
    }
    setUploadingCategory(null);
    setUploadPercent(0);
    toast.success(`${allFiles.length} bestanden geüpload!`);
    event.target.value = '';
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const selectAllInCategory = (category) => {
    const categoryFiles = projectFiles.filter(f => f.category === category);
    const allSelected = categoryFiles.every(f => selectedFiles[f.id]);
    setSelectedFiles(prev => {
      const newSelection = { ...prev };
      categoryFiles.forEach(f => { newSelection[f.id] = !allSelected; });
      return newSelection;
    });
  };

  const handleDownloadSelected = async (category) => {
    const filesToDownload = projectFiles.filter(f => f.category === category && selectedFiles[f.id]);
    for (const file of filesToDownload) {
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.filename;
      link.click();
    }
  };

  const handleDeleteSelected = async (category) => {
    const filesToDelete = projectFiles.filter(f => f.category === category && selectedFiles[f.id]);
    if (filesToDelete.length === 0) return;
    if (!confirm(`Weet je zeker dat je ${filesToDelete.length} bestand(en) wilt verwijderen?`)) return;
    for (const file of filesToDelete) {
      await deleteMutation.mutateAsync(file.id);
    }
    setSelectedFiles({});
    toast.success(`${filesToDelete.length} bestanden verwijderd`);
  };

  const saveMatterportLink = async () => {
    if (!matterportLink.trim()) { toast.error('Voer een geldige link in'); return; }
    await base44.entities.ProjectFile.create({
      project_id: projectId,
      category: '360_matterport',
      file_url: matterportLink.trim(),
      filename: 'Matterport Link',
      file_size: 0,
      mime_type: 'text/url',
    });
    queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
    setMatterportLink('');
    toast.success('Matterport link opgeslagen');
  };

  const syncToCalendar = async () => {
    const shootDate = project.shoot_date || booking?.start_datetime;
    if (!shootDate) { toast.error('Geen shootdatum ingesteld'); return; }
    setSyncingCalendar(true);
    try {
      const { data: response } = await base44.functions.invoke('calendar', {
        action: 'syncEvent',
        projectId: project.id,
        projectTitle: project.title,
        shootDate,
        shootTime: project.shoot_time || (booking?.start_datetime ? new Date(booking.start_datetime).toTimeString().slice(0, 5) : null),
        clientName: user?.full_name || client?.company_name || 'N/A',
        location: project.title,
        calendarEventId: project.calendar_event_id || null,
      });
      if (response.calendarEventId && !project.calendar_event_id) {
        await base44.entities.Project.update(project.id, { calendar_event_id: response.calendarEventId });
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }
      toast.success('Gesynchroniseerd met Google Calendar!');
    } catch (error) {
      toast.error('Synchronisatie mislukt: ' + (error.message || 'Onbekende fout'));
    } finally {
      setSyncingCalendar(false);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="max-w-screen-2xl mx-auto py-16 text-center">
        <Loader2 className={cn("w-8 h-8 animate-spin mx-auto mb-3", darkMode ? "text-gray-600" : "text-gray-400")} />
        <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Laden...</p>
      </div>
    );
  }

  const getStepIndex = (status) => {
    if (status === 'geboekt') return 0;
    if (status === 'shoot_uitgevoerd' || status === 'wordt_bewerkt') return 2;
    if (status === 'klaar') return 3;
    return 0;
  };
  const currentStepIndex = getStepIndex(selectedStatus);

  return (
    <div className="max-w-screen-2xl mx-auto">
      <Link
        to={createPageUrl('AdminProjects')}
        className={cn("inline-flex items-center gap-2 mb-8 transition-colors text-sm",
          darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar projecten
      </Link>

      {/* Status Bar */}
      <div className={cn("rounded-2xl p-8 mb-8", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>{project.title}</h1>
        </div>

        {/* Mobile: compact progress bar + Klaar button */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className={cn("text-xs font-medium uppercase tracking-wide", darkMode ? "text-gray-500" : "text-gray-400")}>Voortgang</span>
            <span className="text-xs font-semibold text-[#5C6B52]">
              Stap {currentStepIndex + 1} van {statusSteps.length} · {statusSteps[currentStepIndex]?.label}
            </span>
          </div>
          <div className={cn("w-full h-2 rounded-full overflow-hidden", darkMode ? "bg-gray-700" : "bg-gray-100")}>
            <div
              className="h-full bg-[#5C6B52] rounded-full transition-all duration-700"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 mb-4">
            {statusSteps.map((step, index) => (
              <div key={step.key} className={cn(
                "w-2 h-2 rounded-full transition-all",
                index <= currentStepIndex ? "bg-[#5C6B52]" : (darkMode ? "bg-gray-600" : "bg-gray-200")
              )} />
            ))}
          </div>
          {selectedStatus !== 'klaar' && (
            <button
              onClick={() => setSelectedStatus('klaar')}
              className="w-full py-2.5 rounded-xl border-2 border-[#5C6B52] text-[#5C6B52] text-sm font-medium hover:bg-[#5C6B52] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Markeer als Klaar
            </button>
          )}
          {selectedStatus === 'klaar' && (
            <div className="w-full py-2.5 rounded-xl bg-[#5C6B52] text-white text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Klaar
            </div>
          )}
        </div>

        {/* Desktop: full stepper */}
        <div className="hidden md:block relative pt-2">
          <div className={cn("absolute top-7 left-6 right-6 h-0.5", darkMode ? "bg-gray-700" : "bg-gray-100")}>
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
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                      darkMode ? "bg-gray-700" : "bg-white",
                      isCompleted ? "bg-[#5C6B52] border-[#5C6B52] text-white" :
                        darkMode ? "border-gray-600 text-gray-500" : "border-gray-200 text-gray-300",
                      !isManual && "cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-medium">{index + 1}</span>}
                  </button>
                  <p className={cn(
                    "text-sm mt-3 font-medium text-center max-w-[100px]",
                    isCurrent ? "text-[#5C6B52]" : isCompleted ? (darkMode ? "text-gray-300" : "text-gray-700") : (darkMode ? "text-gray-600" : "text-gray-300")
                  )}>
                    {step.label}
                  </p>
                  {!isManual && <p className={cn("text-xs mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>Automatisch</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className={cn("rounded-2xl p-8 mb-8", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <h2 className={cn("text-lg font-medium mb-6", darkMode ? "text-gray-100" : "text-gray-900")}>Projectinformatie</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Projectnummer</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{project.project_number || '-'}</p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Klantnaam</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
              {user?.full_name || '-'}
            </p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Bedrijf</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{client?.company_name || '-'}</p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>E-mail klant</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{user?.email || '-'}</p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Shootdatum</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
              {project.shoot_date ? format(new Date(project.shoot_date), 'd MMMM yyyy', { locale: nl }) :
                booking?.start_datetime ? format(new Date(booking.start_datetime), 'd MMMM yyyy', { locale: nl }) : '-'}
            </p>
            {(project.shoot_date || booking?.start_datetime) && (
              <Button
                size="sm"
                variant="outline"
                onClick={syncToCalendar}
                disabled={syncingCalendar}
                className={cn("mt-2", darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "")}
              >
                {syncingCalendar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                Sync to Calendar
              </Button>
            )}
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Starttijd</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
              {project.shoot_time || (booking?.start_datetime ? format(new Date(booking.start_datetime), 'HH:mm') : '-')}
            </p>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t", darkMode ? "border-gray-700" : "border-gray-100")}>
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

        {/* Klant notities - read only */}
        {project.client_notes && (
          <div className={cn("mt-6 p-4 rounded-xl border", darkMode ? "bg-yellow-900/20 border-yellow-700/40" : "bg-yellow-50 border-yellow-200")}>
            <p className={cn("text-xs font-semibold uppercase tracking-wide mb-2", darkMode ? "text-yellow-400" : "text-yellow-700")}>
              📝 Klant notities
            </p>
            <p className={cn("text-sm whitespace-pre-wrap", darkMode ? "text-yellow-200" : "text-yellow-900")}>
              {project.client_notes}
            </p>
          </div>
        )}

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

      {/* Gallery Preview */}
      <Link
        to={createPageUrl('ProjectGalleryView') + `?id=${projectId}`}
        className={cn("block rounded-2xl overflow-hidden hover:shadow-md transition-shadow mb-8",
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
        )}
      >
        <div className="p-8">
          <h2 className={cn("text-lg font-medium mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>Galerij</h2>
          <div className="flex items-center gap-6">
            <div className={cn("w-32 h-32 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0",
              darkMode ? "bg-gray-700" : "bg-gray-100"
            )}>
              {projectFiles.filter(f => f.category === 'bewerkte_fotos' && f.mime_type?.startsWith('image/')).length > 0 ? (
                <img
                  src={projectFiles.filter(f => f.category === 'bewerkte_fotos' && f.mime_type?.startsWith('image/'))[0].file_url}
                  alt="Gallery preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm mb-1", darkMode ? "text-gray-400" : "text-gray-500")}>
                {projectFiles.filter(f => f.category === 'bewerkte_fotos').length} bestanden
              </p>
              <p className={cn("font-medium flex items-center gap-2", darkMode ? "text-gray-100" : "text-gray-900")}>
                <MapPin className={cn("w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
                {project.title}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Raw Bestanden */}
      <Collapsible open={rawOpen} onOpenChange={setRawOpen} className="mb-8">
        <div className={cn("rounded-2xl overflow-hidden", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
          <CollapsibleTrigger className={cn("w-full px-8 py-6 flex items-center justify-between transition-colors",
            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
          )}>
            <div>
              <h2 className={cn("text-lg font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>Raw Bestanden</h2>
              <p className={cn("text-sm mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>
                Alleen zichtbaar voor admin • {projectFiles.filter(f => f.category?.includes('raw') || f.category === 'pointcloud').length} bestanden
              </p>
            </div>
            <ChevronDown className={cn("w-5 h-5 transition-transform", darkMode ? "text-gray-500" : "text-gray-400", rawOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-8 pb-8 space-y-6">
              {rawCategories.map(category => {
                const categoryFiles = projectFiles.filter(f => f.category === category.key);
                const selectedCount = categoryFiles.filter(f => selectedFiles[f.id]).length;
                const allSelected = categoryFiles.length > 0 && categoryFiles.every(f => selectedFiles[f.id]);

                return (
                  <div key={category.key} className="border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                      <h3 className="text-base font-medium text-gray-900">{category.label} ({categoryFiles.length})</h3>
                      {uploadingCategory === category.key && uploadPercent > 0 && uploadPercent < 100 && (
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 transition-all" style={{ width: `${uploadPercent}%` }} />
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {categoryFiles.length > 0 && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => selectAllInCategory(category.key)}>
                              {allSelected ? 'Deselecteer alles' : 'Alles selecteren'}
                            </Button>
                            {selectedCount > 0 && (
                              <>
                                <Button size="sm" onClick={() => handleDownloadSelected(category.key)} className="bg-[#5C6B52] hover:bg-[#4A5641] text-white">
                                  <Download className="w-4 h-4 mr-2" />Download ({selectedCount})
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteSelected(category.key)}>
                                  <Trash2 className="w-4 h-4 mr-2" />Verwijderen ({selectedCount})
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {category.key === '360_matterport' && (
                      <div className="mb-4 flex gap-2">
                        <Input
                          type="url"
                          placeholder="Plak hier je Matterport of 360° link..."
                          value={matterportLink}
                          onChange={(e) => setMatterportLink(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={saveMatterportLink} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="w-4 h-4 mr-2" />Link toevoegen
                        </Button>
                      </div>
                    )}

                    <div className={cn(
                      "border-2 border-dashed rounded-lg transition-colors",
                      categoryFiles.length === 0 ? "border-gray-200 bg-gray-50" : "border-transparent"
                    )}>
                      {categoryFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          Sleep bestanden hierheen of klik op Uploaden
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 p-2">
                          {categoryFiles.map(file => (
                            <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={!!selectedFiles[file.id]}
                                onChange={() => toggleFileSelection(file.id)}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <div className="flex-1 min-w-0">
                                {file.mime_type === 'text/url' ? (
                                  <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:underline truncate block">
                                    🔗 {file.file_url}
                                  </a>
                                ) : (
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                                )}
                                <p className="text-xs text-gray-400">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(file.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="border border-gray-100 rounded-xl p-6 mt-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Editor Notities</h3>
                <EditorNotesSection projectId={projectId} />
                <AddEditorNote projectId={projectId} />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Extra Sessies */}
      <div className={cn("rounded-2xl p-8 mb-8", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <h2 className={cn("text-lg font-medium mb-6", darkMode ? "text-gray-100" : "text-gray-900")}>Extra Sessies</h2>
        <ExtraSessionsSection projectId={projectId} />
      </div>

      {/* Factuur */}
      <div className={cn("rounded-2xl p-8", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn("text-lg font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>Factuur</h2>
          {!projectInvoice && (
            <Button
              onClick={() => { setIsEditingInvoice(false); resetInvoiceData(); setInvoiceDialogOpen(true); }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />Factuur Aanmaken
            </Button>
          )}
        </div>

        {projectInvoice ? (
          <div className="border border-gray-100 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="grid grid-cols-2 gap-6 flex-1">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Factuurnummer</p>
                  <p className="font-medium text-gray-900">{projectInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <span className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-medium",
                    projectInvoice.status === 'betaald' ? "bg-green-50 text-green-700" :
                      projectInvoice.status === 'verzonden' ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {projectInvoice.status === 'betaald' ? 'Betaald' : projectInvoice.status === 'verzonden' ? 'Verzonden' : 'Concept'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Totaalbedrag</p>
                  <p className="font-semibold text-gray-900 text-lg">€ {projectInvoice.total_amount?.toFixed(2)}</p>
                </div>
              </div>
              {projectInvoice.status !== 'betaald' && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => {
                      setIsEditingInvoice(true);
                      setInvoiceData({
                        items: projectInvoice.items?.length > 0 ? projectInvoice.items.map(item => ({
                          title: item.title || '', description: item.description || '',
                          quantity: item.quantity || 1, unit_price: item.unit_price || '',
                        })) : [{ title: '', description: '', quantity: 1, unit_price: '' }],
                        vat_percentage: projectInvoice.vat_percentage || 21,
                        discount_amount: projectInvoice.discount_amount || 0,
                        use_custom_recipient: !!projectInvoice.client_name,
                        recipient_name: projectInvoice.client_name || '',
                        recipient_email: projectInvoice.client_email || '',
                        recipient_address: projectInvoice.client_address || '',
                        template_id: projectInvoice.template_id || '',
                        cc_emails: projectInvoice.cc_emails || '',
                        recipient_client_ids: projectInvoice.recipient_client_ids || [],
                      });
                      setInvoiceDialogOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { if (confirm('Weet je zeker dat je deze factuur wilt verwijderen?')) deleteInvoiceMutation.mutate(projectInvoice.id); }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              {projectInvoice.status === 'betaald' ? (
                <div className="flex items-center gap-2 py-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium text-sm">Betaald</span>
                  {projectInvoice.paid_date && (
                    <span className="text-xs text-gray-400 ml-2">
                      op {format(new Date(projectInvoice.paid_date), 'd MMMM yyyy', { locale: nl })}
                    </span>
                  )}
                </div>
              ) : projectInvoice.mollie_payment_link_url ? (
                <div className="space-y-2">
                  <a href={projectInvoice.mollie_payment_link_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block">
                    {projectInvoice.mollie_payment_link_url}
                  </a>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={async () => {
                      const response = await base44.functions.invoke('molliePayment', {
                        action: 'checkPaymentStatus',
                        paymentLinkId: projectInvoice.mollie_payment_link_id,
                        invoiceId: projectInvoice.id,
                      });
                      const data = response?.data || response;
                      if (data?.status === 'paid') {
                        queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
                        toast.success('Betaling ontvangen!');
                      } else {
                        toast.info('Nog niet betaald');
                      }
                    }}>
                      Status controleren
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (confirm('Wil je deze factuur handmatig als betaald markeren?')) {
                        await base44.entities.ProjectInvoice.update(projectInvoice.id, {
                          status: 'betaald',
                          paid_date: new Date().toISOString(),
                        });
                        queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
                        queryClient.invalidateQueries({ queryKey: ['invoices'] });
                        toast.success('Factuur als betaald gemarkeerd');
                      }
                    }} className="text-green-600 hover:text-green-700">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Betaald markeren
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={async () => {
                  const response = await base44.functions.invoke('molliePayment', {
                    action: 'createPaymentLink',
                    invoiceId: projectInvoice.id,
                    amount: projectInvoice.total_amount,
                    description: `Factuur ${projectInvoice.invoice_number || project.project_number}`,
                  });
                  const data = response?.data || response;
                  if (data?.paymentLinkUrl) {
                    queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
                    toast.success('Betaallink aangemaakt');
                  } else if (data?.error) {
                    toast.error(`Fout: ${data.error}`);
                  }
                }} className="text-blue-600 hover:text-blue-700">
                  Betaallink genereren
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={cn("text-center py-12", darkMode ? "text-gray-500" : "text-gray-400")}>
            Nog geen factuur aangemaakt
          </div>
        )}
      </div>

      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        isEditing={isEditingInvoice}
        invoiceData={invoiceData}
        setInvoiceData={setInvoiceData}
        invoiceTemplates={invoiceTemplates}
        project={project}
        user={user}
        client={client}
        allClients={allClients}
        onSave={() => isEditingInvoice ? updateInvoiceMutation.mutate(invoiceData) : createInvoiceMutation.mutate(invoiceData)}
        isSaving={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
      />
    </div>
  );
}