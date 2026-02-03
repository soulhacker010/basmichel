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
import { toast } from 'sonner';
import EditorNotesSection from '@/components/project/EditorNotesSection';
import AddEditorNote from '@/components/project/AddEditorNote';
import ExtraSessionsSection from '@/components/project/ExtraSessionsSection';
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
  const [uploadPercent, setUploadPercent] = useState(0);
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [rawOpen, setRawOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [matterportLink, setMatterportLink] = useState('');
  const [invoiceData, setInvoiceData] = useState({
    items: [{ title: '', description: '', quantity: 1, unit_price: '' }],
    vat_percentage: 21,
    discount_amount: 0,
    use_custom_recipient: false,
    recipient_name: '',
    recipient_email: '',
    recipient_address: '',
    template_id: '',
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

  useEffect(() => {
    if (project) {
      setSelectedStatus(project.status);
      setNotes(project.notes || '');
      setDeliveryDate(project.delivery_date || '');

      // Create Drive folder if not exists
      if (!project.drive_folder_id && project.project_number) {
        base44.functions.invoke('googleDrive', {
          action: 'createFolder',
          projectId: project.id,
          projectNumber: project.project_number
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }).catch(err => console.error('Failed to create Drive folder:', err));
      }

      // Load Drive files
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

      // Bij status "Klaar": update factuur met datums
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

      toast.success('Project opgeslagen');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ category, files }) => {
      const uploadedFiles = [];
      for (const file of files) {
        // Detect MIME type for proper R2 handling
        const extension = file.name.split('.').pop().toLowerCase();
        const rawFormats = ['dng', 'cr2', 'cr3', 'nef', 'arw', 'raw', 'orf', 'rw2', 'srw', 'raf'];
        const imageFormats = ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'webp'];
        const videoFormats = ['mp4', 'mov', 'm4v', 'mxf', 'avi', 'prores'];
        const documentFormats = ['pdf', 'docx', 'xlsx', 'csv', 'fml'];
        const pointCloud = ['e57', 'ply', 'las', 'laz', 'pts', 'xyz', 'pcd', 'obj', 'fbx'];
        const archives = ['zip', 'rar', '7z'];

        let fileType = file.type;

        if (!fileType || rawFormats.includes(extension) || pointCloud.includes(extension) || archives.includes(extension)) {
          fileType = 'application/octet-stream';
          console.log(`Detected binary file (.${extension}), using octet-stream`);
        } else if (imageFormats.includes(extension) && !fileType.startsWith('image/')) {
          fileType = 'image/jpeg';
        } else if (videoFormats.includes(extension) && !fileType.startsWith('video/')) {
          fileType = 'video/mp4';
        } else if (documentFormats.includes(extension)) {
          if (extension === 'pdf') fileType = 'application/pdf';
          else if (extension === 'docx') fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (extension === 'xlsx') fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          else if (extension === 'csv') fileType = 'text/csv';
          else fileType = 'application/octet-stream';
        }

        const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

        let file_url, file_key;

        // Use multipart upload for large files
        if (file.size > MULTIPART_THRESHOLD) {
          console.log(`File >50MB, using multipart upload with ${Math.ceil(file.size / CHUNK_SIZE)} chunks`);

          // 1. Create multipart upload
          const { data: initData } = await base44.functions.invoke('storage', {
            action: 'createMultipartUpload',
            fileName: file.name,
            fileType: fileType
          });

          if (!initData.success) throw new Error(initData.error || 'Failed to create multipart upload');

          const { uploadId, fileKey } = initData;
          file_key = fileKey;
          console.log(`Multipart upload created: ${uploadId}`);

          // 2. Get presigned URLs for all chunks
          const numChunks = Math.ceil(file.size / CHUNK_SIZE);
          const { data: urlsData } = await base44.functions.invoke('storage', {
            action: 'getPartPresignedUrls',
            fileKey,
            uploadId,
            numParts: numChunks
          });

          if (!urlsData.success) throw new Error(urlsData.error || 'Failed to get presigned URLs');
          console.log(`Got ${numChunks} presigned URLs for chunks`);

          // 3. Upload chunks in parallel (5 at a time)
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

              const uploadPromise = new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.addEventListener('load', () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    let etag = null;
                    try {
                      etag = xhr.getResponseHeader('ETag');
                    } catch (e) {
                      console.log(`CORS blocked ETag for chunk ${partNumber}`);
                    }
                    console.log(`Chunk ${partNumber}/${numChunks} uploaded${etag ? ', ETag: ' + etag : ''}`);
                    resolve({ PartNumber: partNumber, ETag: etag ? etag.replace(/"/g, '') : '*' });
                  } else {
                    reject(new Error(`Chunk ${partNumber} failed: ${xhr.status}`));
                  }
                });

                xhr.addEventListener('error', () => reject(new Error(`Network error on chunk ${partNumber}`)));
                xhr.addEventListener('abort', () => reject(new Error(`Chunk ${partNumber} aborted`)));

                xhr.open('PUT', url);
                xhr.send(chunk);
              });

              batch.push(uploadPromise);
            }

            const batchResults = await Promise.all(batch);
            uploadedParts.push(...batchResults);

            // Update progress after each chunk batch
            const completedChunks = Math.min(i + CONCURRENT_CHUNKS, numChunks);
            const percent = Math.round((completedChunks / numChunks) * 100);
            setUploadPercent(percent);
          }

          console.log(`All ${numChunks} chunks uploaded, completing multipart upload`);

          // 4. Complete multipart upload
          const { data: completeData } = await base44.functions.invoke('storage', {
            action: 'completeMultipartUpload',
            fileKey,
            uploadId,
            parts: uploadedParts
          });

          if (!completeData.success) throw new Error(completeData.error || 'Failed to complete multipart upload');
          console.log(`Multipart upload complete for: ${file.name}`);

          file_url = completeData.publicUrl || `${process.env.R2_PUBLIC_URL}/${fileKey}`;
        } else {
          // Simple PUT upload for small files
          console.log(`File <50MB, using simple PUT upload`);

          const { data: presignedData } = await base44.functions.invoke('storage', {
            action: 'getPresignedUrl',
            fileName: file.name,
            fileType: fileType
          });

          if (!presignedData.success) throw new Error(presignedData.error || 'Failed to get upload URL');

          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track real upload progress
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadPercent(percent);
              }
            };

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log(`Upload complete for ${file.name}`);
                resolve();
              } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.addEventListener('abort', () => reject(new Error('Upload was aborted')));

            xhr.open('PUT', presignedData.uploadUrl);
            xhr.setRequestHeader('Content-Type', fileType);
            xhr.send(file);
          });

          file_url = presignedData.publicUrl || presignedData.uploadUrl.split('?')[0];
          file_key = presignedData.fileKey;
        }

        // Save metadata to database
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

        // R2 only - Google Drive upload removed for stability with large file batches
      }
      return uploadedFiles;
    },
    onSuccess: () => {
      // Just refresh the file list, spinner/toast handled by handleFileUpload for batches
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
      // Calculate amounts from items
      const subtotal = data.items.reduce((sum, item) => {
        const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
        return sum + itemTotal;
      }, 0);

      const discountAmount = parseFloat(data.discount_amount) || 0;
      const afterDiscount = subtotal - discountAmount;
      const vatAmount = afterDiscount * (data.vat_percentage / 100);
      const totalAmount = afterDiscount + vatAmount;

      return await base44.entities.ProjectInvoice.create({
        project_id: projectId,
        invoice_number: project.project_number,
        client_name: data.use_custom_recipient ? data.recipient_name : (user?.full_name || client?.company_name || ''),
        client_email: data.use_custom_recipient ? data.recipient_email : (user?.email || ''),
        client_address: data.use_custom_recipient ? data.recipient_address : (project.address || ''),
        items: data.items.filter(item => item.title && item.unit_price),
        subtotal: subtotal,
        discount_amount: discountAmount,
        vat_percentage: data.vat_percentage,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: 'concept',
        template_id: data.template_id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoice', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setInvoiceDialogOpen(false);
      setInvoiceData({
        items: [{ title: '', description: '', quantity: 1, unit_price: '' }],
        vat_percentage: 21,
        discount_amount: 0,
        use_custom_recipient: false,
        recipient_name: '',
        recipient_email: '',
        recipient_address: '',
        template_id: '',
      });
      toast.success('Factuur aangemaakt');
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
    const allFiles = Array.from(event.target.files);
    if (allFiles.length === 0) return;

    setUploadingCategory(category);
    setUploadPercent(0);

    // Process files in batches of 5 to prevent browser memory crash with large RAW files
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(allFiles.length / BATCH_SIZE);

    console.log(`Starting upload of ${allFiles.length} files in ${totalBatches} batches`);

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const filesDone = Math.min(i + BATCH_SIZE, allFiles.length);

      // Update percentage for UI
      const percent = Math.round((i / allFiles.length) * 100);
      setUploadPercent(percent);

      console.log(`Uploading batch ${batchNum}/${totalBatches} (${batch.length} files) - ${percent}%`);

      try {
        await uploadMutation.mutateAsync({ category, files: batch });
        // Update after batch completes
        setUploadPercent(Math.round((filesDone / allFiles.length) * 100));
      } catch (error) {
        console.error(`Batch ${batchNum} failed:`, error);
        toast.error(`Upload mislukt bij bestand ${i + 1}: ${error.message}`);
        break;
      }

      // Longer delay between batches to allow garbage collection
      if (i + BATCH_SIZE < allFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setUploadingCategory(null);
    setUploadPercent(0);
    toast.success(`${allFiles.length} bestanden geüpload!`);
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

  const handleDeleteSelected = async (category) => {
    const filesToDelete = projectFiles.filter(f =>
      f.category === category && selectedFiles[f.id]
    );

    if (filesToDelete.length === 0) return;

    if (!confirm(`Weet je zeker dat je ${filesToDelete.length} bestand(en) wilt verwijderen?`)) {
      return;
    }

    for (const file of filesToDelete) {
      await deleteMutation.mutateAsync(file.id);
    }

    setSelectedFiles({});
    toast.success(`${filesToDelete.length} bestanden verwijderd`);
  };

  const saveMatterportLink = async () => {
    if (!matterportLink.trim()) {
      toast.error('Voer een geldige link in');
      return;
    }

    try {
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
    } catch (error) {
      toast.error('Fout bij opslaan link');
    }
  };

  const [syncingCalendar, setSyncingCalendar] = useState(false);

  const syncToCalendar = async () => {
    const shootDate = project.shoot_date || booking?.start_datetime;

    if (!shootDate) {
      toast.error('Geen shootdatum ingesteld');
      return;
    }

    setSyncingCalendar(true);
    try {
      const { data: response } = await base44.functions.invoke('calendar', {
        action: 'syncEvent',
        projectId: project.id,
        projectTitle: project.title,
        shootDate: shootDate,
        calendarEventId: project.calendar_event_id || null,
      });

      if (response.calendarEventId && !project.calendar_event_id) {
        // Save the calendar event ID to the project
        await base44.entities.Project.update(project.id, {
          calendar_event_id: response.calendarEventId,
        });
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      }

      toast.success('Gesynchroniseerd met Google Calendar!');
    } catch (error) {
      console.error('Calendar sync error:', error);
      if (error.message?.includes('not connected')) {
        toast.error('Google Calendar niet verbonden. Ga naar Instellingen om te verbinden.');
      } else if (error.message?.includes('Conflict')) {
        toast.error('Conflict: Kalender is bezet op dit tijdstip.');
      } else {
        toast.error('Synchronisatie mislukt: ' + (error.message || 'Onbekende fout'));
      }
    } finally {
      setSyncingCalendar(false);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <Loader2 className={cn("w-8 h-8 animate-spin mx-auto mb-3", darkMode ? "text-gray-600" : "text-gray-400")} />
        <p className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>Laden...</p>
      </div>
    );
  }

  // Map both shoot_uitgevoerd and wordt_bewerkt to step 2 (index 2 = "Wordt bewerkt")
  const getStepIndex = (status) => {
    if (status === 'geboekt') return 0;
    if (status === 'shoot_uitgevoerd' || status === 'wordt_bewerkt') return 2;
    if (status === 'klaar') return 3;
    return 0;
  };
  const currentStepIndex = getStepIndex(selectedStatus);

  return (
    <div className="max-w-6xl mx-auto">
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
        <h1 className={cn("text-2xl font-light mb-8", darkMode ? "text-gray-100" : "text-gray-900")}>{project.title}</h1>

        <div className="relative pt-2">
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
                      isCompleted
                        ? "bg-[#5C6B52] border-[#5C6B52] text-white"
                        : darkMode ? "border-gray-600 text-gray-500" : "border-gray-200 text-gray-300",
                      isManual && !isCompleted && (darkMode ? "hover:border-gray-500" : "hover:border-gray-300") + " cursor-pointer",
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
                    isCurrent ? "text-[#5C6B52]" :
                      isCompleted ? (darkMode ? "text-gray-300" : "text-gray-700") :
                        (darkMode ? "text-gray-600" : "text-gray-300")
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
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Projectnaam</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{project.title}</p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Klantnaam</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.full_name || '-'}
            </p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Bedrijf</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{client?.company_name || '-'}</p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>E-mailadres klant</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{user?.email || '-'}</p>
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Adres object</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>{project.title || '-'}</p>
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
                {syncingCalendar ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Sync to Calendar
              </Button>
            )}
          </div>
          <div>
            <p className={cn("text-sm mb-1", darkMode ? "text-gray-500" : "text-gray-400")}>Starttijd</p>
            <p className={cn("font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
              {project.shoot_time ||
                (booking?.start_datetime ? format(new Date(booking.start_datetime), 'HH:mm') : '-')}
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
              <div className="flex items-start justify-between">
                <div>
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
          </div>
        </div>
      </Link>

      {/* Raw Bestanden (Admin Only) */}
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
                    <div className="flex items-center justify-between mb-4 gap-4">
                      <h3 className="text-base font-medium text-gray-900 whitespace-nowrap">{category.label} ({categoryFiles.length})</h3>

                      {/* Visual Progress Bar */}
                      {uploadingCategory === category.key && uploadPercent > 0 && uploadPercent < 100 && (
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-300 ease-out"
                            style={{ width: `${uploadPercent}%` }}
                          />
                        </div>
                      )}

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
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleDownloadSelected(category.key)}
                                  className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download ({selectedCount})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteSelected(category.key)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Verwijderen ({selectedCount})
                                </Button>
                              </>
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
                                {uploadPercent}%
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

                    {/* Link input for 360/Matterport */}
                    {category.key === '360_matterport' && (
                      <div className="mb-4 flex gap-2">
                        <Input
                          type="url"
                          placeholder="Plak hier je Matterport of 360° link..."
                          value={matterportLink}
                          onChange={(e) => setMatterportLink(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={saveMatterportLink}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Link toevoegen
                        </Button>
                      </div>
                    )}

                    <div
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                          setUploadingCategory(category.key);
                          uploadMutation.mutate({ category: category.key, files });
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      className={cn(
                        "border-2 border-dashed rounded-lg transition-colors",
                        categoryFiles.length === 0 ? "border-gray-200 bg-gray-50" : "border-transparent"
                      )}
                    >
                      {categoryFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          Sleep bestanden hierheen of klik op Uploaden
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 p-2">
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
                                {file.mime_type === 'text/url' ? (
                                  <a
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
                                  >
                                    🔗 {file.file_url}
                                  </a>
                                ) : (
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                                )}
                                <p className="text-xs text-gray-400">
                                  {(file.file_size / 1024 / 1024).toFixed(2)} MB
                                  {file.created_date && (
                                    <span className="ml-2">
                                      • {new Date(new Date(file.created_date).getTime() + 60 * 60 * 1000).toLocaleDateString('nl-NL', {
                                        timeZone: 'Europe/Amsterdam',
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  )}
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
                  </div>
                );
              })}

              {/* Editor Notes */}
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
            <div className="flex justify-between items-start mb-6">
              <div className="grid grid-cols-2 gap-6 flex-1">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Factuurnummer</p>
                  <p className="font-medium text-gray-900">{projectInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Factuurdatum</p>
                  <p className="font-medium text-gray-900">
                    {projectInvoice.invoice_date ?
                      format(new Date(projectInvoice.invoice_date), 'd MMMM yyyy', { locale: nl }) :
                      'Wordt gezet bij status Klaar'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Vervaldatum</p>
                  <p className="font-medium text-gray-900">
                    {projectInvoice.due_date ?
                      format(new Date(projectInvoice.due_date), 'd MMMM yyyy', { locale: nl }) :
                      '-'}
                  </p>
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
              {projectInvoice.status !== 'betaald' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Weet je zeker dat je deze factuur wilt verwijderen?')) {
                      deleteInvoiceMutation.mutate(projectInvoice.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {projectInvoice.items && projectInvoice.items.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Items</p>
                <div className="space-y-2">
                  {projectInvoice.items.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {item.quantity}x € {item.unit_price?.toFixed(2)}
                          </p>
                          <p className="font-medium text-gray-900">
                            € {((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotaal</span>
                <span className="font-medium text-gray-900">€ {projectInvoice.subtotal?.toFixed(2)}</span>
              </div>
              {projectInvoice.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Korting</span>
                  <span className="font-medium text-red-600">- € {projectInvoice.discount_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">BTW ({projectInvoice.vat_percentage}%)</span>
                <span className="font-medium text-gray-900">€ {projectInvoice.vat_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-900">Totaalbedrag</span>
                <span className="font-semibold text-gray-900 text-lg">€ {projectInvoice.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={cn("text-center py-12", darkMode ? "text-gray-500" : "text-gray-400")}>
            Nog geen factuur aangemaakt
          </div>
        )}
      </div>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Factuur Aanmaken</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* A. FACTUURGEGEVENS */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Factuurgegevens</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Factuurnummer</Label>
                  <Input value={project.project_number || ''} disabled className="mt-1.5 bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Automatisch (= Projectnummer)</p>
                </div>
                <div>
                  <Label>Project</Label>
                  <Input value={project.title || ''} disabled className="mt-1.5 bg-gray-50" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>Let op:</strong> Factuurdatum en vervaldatum worden automatisch ingesteld wanneer het project op status "Klaar" wordt gezet.
                </p>
              </div>
            </div>

            {/* Factuursjablonen */}
            {invoiceTemplates.length > 0 && (
              <div className="space-y-3">
                <Label htmlFor="template">Gebruik factuursjabloon (optioneel)</Label>
                <select
                  id="template"
                  value={invoiceData.template_id}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    setInvoiceData({ ...invoiceData, template_id: templateId });

                    if (templateId) {
                      const template = invoiceTemplates.find(t => t.id === templateId);
                      if (template && template.content) {
                        try {
                          const content = typeof template.content === 'string' ?
                            JSON.parse(template.content) : template.content;

                          if (content.items) {
                            setInvoiceData({
                              ...invoiceData,
                              template_id: templateId,
                              items: content.items,
                              vat_percentage: content.vat_percentage || 21,
                              discount_amount: content.discount_amount || 0,
                            });
                          }
                        } catch (e) {
                          console.error('Error parsing template', e);
                        }
                      }
                    }
                  }}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Geen sjabloon</option>
                  {invoiceTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* B. FACTUURONTVANGER */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="custom_recipient"
                  checked={invoiceData.use_custom_recipient}
                  onChange={(e) => setInvoiceData({ ...invoiceData, use_custom_recipient: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="custom_recipient" className="cursor-pointer">
                  Gebruik afwijkende factuurontvanger
                </Label>
              </div>

              {!invoiceData.use_custom_recipient ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Factuur wordt verstuurd naar: <span className="font-medium text-gray-900">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.full_name || client?.company_name || 'Projectklant'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email || ''}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipient_name">Factuurnaam *</Label>
                    <Input
                      id="recipient_name"
                      value={invoiceData.recipient_name}
                      onChange={(e) => setInvoiceData({ ...invoiceData, recipient_name: e.target.value })}
                      placeholder="Bedrijfsnaam of contactpersoon"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient_email">Factuur e-mail *</Label>
                    <Input
                      id="recipient_email"
                      type="email"
                      value={invoiceData.recipient_email}
                      onChange={(e) => setInvoiceData({ ...invoiceData, recipient_email: e.target.value })}
                      placeholder="facturen@bedrijf.nl"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient_address">Factuuradres *</Label>
                    <Textarea
                      id="recipient_address"
                      value={invoiceData.recipient_address}
                      onChange={(e) => setInvoiceData({ ...invoiceData, recipient_address: e.target.value })}
                      placeholder="Straat 1&#10;1234 AB Plaats"
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* C. FACTUURITEMS */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-900">Factuuritems</h3>
              <div className="space-y-3">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`item_title_${index}`}>Titel *</Label>
                          <Input
                            id={`item_title_${index}`}
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...invoiceData.items];
                              newItems[index].title = e.target.value;
                              setInvoiceData({ ...invoiceData, items: newItems });
                            }}
                            placeholder="Bijvoorbeeld: Vastgoedfotografie"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`item_description_${index}`}>Omschrijving</Label>
                          <Textarea
                            id={`item_description_${index}`}
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...invoiceData.items];
                              newItems[index].description = e.target.value;
                              setInvoiceData({ ...invoiceData, items: newItems });
                            }}
                            placeholder="Optionele details..."
                            className="mt-1.5"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`item_quantity_${index}`}>Aantal *</Label>
                            <Input
                              id={`item_quantity_${index}`}
                              type="number"
                              step="1"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...invoiceData.items];
                                newItems[index].quantity = e.target.value;
                                setInvoiceData({ ...invoiceData, items: newItems });
                              }}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`item_price_${index}`}>Prijs per stuk *</Label>
                            <Input
                              id={`item_price_${index}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => {
                                const newItems = [...invoiceData.items];
                                newItems[index].unit_price = e.target.value;
                                setInvoiceData({ ...invoiceData, items: newItems });
                              }}
                              placeholder="0.00"
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <Label>Totaal</Label>
                            <div className="mt-1.5 h-9 px-3 py-2 bg-gray-50 rounded-md flex items-center text-sm font-medium">
                              € {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {invoiceData.items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newItems = invoiceData.items.filter((_, i) => i !== index);
                            setInvoiceData({ ...invoiceData, items: newItems });
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setInvoiceData({
                    ...invoiceData,
                    items: [...invoiceData.items, { title: '', description: '', quantity: 1, unit_price: '' }]
                  });
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Item toevoegen
              </Button>
            </div>

            {/* D. SAMENVATTING */}
            <div className="pt-4 border-t">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotaal</span>
                  <span className="font-medium text-gray-900">
                    € {invoiceData.items.reduce((sum, item) => {
                      return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                    }, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <Label htmlFor="discount" className="text-gray-600">Korting (€)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceData.discount_amount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-24 h-8 text-sm text-right"
                  />
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">BTW</span>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={invoiceData.vat_percentage}
                      onChange={(e) => setInvoiceData({ ...invoiceData, vat_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-16 h-7 text-xs"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    € {(() => {
                      const subtotal = invoiceData.items.reduce((sum, item) => {
                        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                      }, 0);
                      const afterDiscount = subtotal - (parseFloat(invoiceData.discount_amount) || 0);
                      return (afterDiscount * (invoiceData.vat_percentage / 100)).toFixed(2);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Totaalbedrag</span>
                  <span className="font-semibold text-gray-900 text-lg">
                    € {(() => {
                      const subtotal = invoiceData.items.reduce((sum, item) => {
                        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                      }, 0);
                      const discount = parseFloat(invoiceData.discount_amount) || 0;
                      const afterDiscount = subtotal - discount;
                      const vat = afterDiscount * (invoiceData.vat_percentage / 100);
                      return (afterDiscount + vat).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                Annuleren
              </Button>
              <Button
                onClick={() => createInvoiceMutation.mutate(invoiceData)}
                disabled={
                  invoiceData.items.some(item => !item.title || !item.unit_price) ||
                  (invoiceData.use_custom_recipient && (!invoiceData.recipient_name || !invoiceData.recipient_email))
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Factuur Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}