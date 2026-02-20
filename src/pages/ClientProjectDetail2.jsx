import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft,
  MapPin,
  Download,
  CheckCircle2,
  Loader2,
  ChevronDown,
  FileText,
  Trash2,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, startOfWeek, addWeeks, isSameDay, setHours, setMinutes, addMinutes, isAfter, isBefore } from 'date-fns';
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
import { toast } from 'sonner';
import ProjectTimeline from '@/components/project/ProjectTimeline';

const statusSteps = [
  { key: 'geboekt', label: 'Geboekt' },
  { key: 'shoot_uitgevoerd', label: 'Shoot uitgevoerd' },
  { key: 'wordt_bewerkt', label: 'Wordt bewerkt' },
  { key: 'klaar', label: 'Klaar' },
];

const deliveryCategories = [
  { key: 'bewerkte_fotos', label: 'Bewerkte foto\'s' },
  { key: 'bewerkte_videos', label: 'Bewerkte video\'s' },
  { key: '360_matterport', label: '360 graden / Matterport' },
  { key: 'meetrapport', label: 'Meetrapport' },
];

export default function ClientProjectDetail2() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [revisionSending, setRevisionSending] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { data: projectInvoice } = useQuery({
    queryKey: ['projectInvoice', projectId],
    queryFn: async () => {
      const invoices = await base44.entities.ProjectInvoice.filter({ project_id: projectId });
      return invoices?.[0];
    },
    enabled: !!projectId && project?.status === 'klaar',
  });

  const { data: galleries = [] } = useQuery({
    queryKey: ['projectGallery', projectId],
    queryFn: () => base44.entities.Gallery.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId && project?.status === 'klaar',
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['availability'],
    queryFn: () => base44.entities.Availability.filter({ is_active: true }),
    enabled: showReschedule,
  });

  const { data: existingSessions = [] } = useQuery({
    queryKey: ['existingSessions'],
    queryFn: () => base44.entities.Session.filter({ status: 'bevestigd' }),
    enabled: showReschedule,
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

  // Map both shoot_uitgevoerd and wordt_bewerkt to step 2 (index 2 = "Wordt bewerkt")
  const getStepIndex = (status) => {
    if (status === 'geboekt') return 0;
    if (status === 'shoot_uitgevoerd' || status === 'wordt_bewerkt') return 2;
    if (status === 'klaar') return 3;
    return 0;
  };
  const currentStepIndex = getStepIndex(project.status);

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

  const deliveryFiles = projectFiles.filter(f =>
    ['bewerkte_fotos', 'bewerkte_videos', '360_matterport', 'meetrapport'].includes(f.category)
  );
  const hasGallery = galleries.length > 0;

  const formatInvoiceDate = (dateValue) => {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';
    return format(date, 'd MMMM yyyy', { locale: nl });
  };

  const getInvoiceSubtotal = (invoice) => {
    if (!invoice) return null;
    if (typeof invoice.subtotal === 'number') return invoice.subtotal;
    if (typeof invoice.amount === 'number') return invoice.amount;
    if (typeof invoice.total_amount === 'number' && typeof invoice.vat_amount === 'number') {
      return invoice.total_amount - invoice.vat_amount;
    }
    return null;
  };

  const openInvoicePrint = (invoice) => {
    if (!invoice) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const business = {
      name: invoice.business_name || 'Bas Michel Photography',
      address: invoice.business_address || '',
      postcode: '',
      city: '',
      country: 'Nederland',
      email: invoice.business_email || 'basmichelsite@gmail.com',
      website: invoice.business_website || 'basmichel.nl',
      kvk: invoice.kvk_number || '',
      vat: invoice.vat_number || '',
      iban: invoice.bank_iban || '',
      bic: invoice.bank_bic || '',
      bank: invoice.bank_name || 'ING',
    };

    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const subtotal = getInvoiceSubtotal(invoice) ?? 0;
    const discount = typeof invoice.discount_amount === 'number' ? invoice.discount_amount : 0;
    const vatAmount = typeof invoice.vat_amount === 'number' ? invoice.vat_amount : 0;
    const total = typeof invoice.total_amount === 'number' ? invoice.total_amount : subtotal - discount + vatAmount;
    const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : null;
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;

    const formatMoney = (value) => `€ ${value.toFixed(2)}`;
    const formatDate = (value) => value && !Number.isNaN(value.getTime())
      ? value.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    const rows = items.map((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const lineTotal = qty * price;
      return `
        <tr>
          <td>${item.title || ''}</td>
          <td>${item.description || ''}</td>
          <td style="text-align:right;">${qty}</td>
          <td style="text-align:right;">${formatMoney(price)}</td>
          <td style="text-align:right;">${formatMoney(lineTotal)}</td>
        </tr>
      `;
    }).join('');

    const businessAddress = [business.address, business.postcode && business.city ? `${business.postcode} ${business.city}` : business.city, business.country]
      .filter(Boolean)
      .join('<br/>');
    const paymentRef = invoice.invoice_number || project.project_number || '';

    win.document.write(`
<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <title>Factuur ${invoice.invoice_number || ''}</title>
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: Arial, sans-serif; color: #111827; padding: 40px; }
      .page { width: 210mm; min-height: 297mm; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
      .brand { font-size: 20px; font-weight: 700; color: #5C6B52; }
      .title { font-size: 24px; font-weight: 600; }
      .meta { color: #6b7280; font-size: 13px; line-height: 1.6; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
      .card { border: 1px solid #e5e7eb; padding: 16px; border-radius: 10px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
      th { text-align: left; background: #f9fafb; color: #6b7280; font-weight: 600; }
      .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
      .totals table { width: 320px; }
      .totals td { border: none; padding: 6px 0; }
      .totals .label { color: #6b7280; }
      .totals .value { text-align: right; font-weight: 600; }
      .footer { margin-top: 24px; color: #6b7280; font-size: 12px; }
      .toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
      .print-btn { background: #5C6B52; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
      @media print { .toolbar { display: none; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="page">
    <div class="toolbar"><button class="print-btn" onclick="window.print()">Download PDF</button></div>
    <div class="header">
      <div>
        <div class="brand">Bas Michel Photography</div>
        <div class="meta">${business.website || '-'} - ${business.email || '-'}</div>
        <div class="meta">${businessAddress || '-'}</div>
      </div>
      <div style="text-align:right;">
        <div class="title">Factuur</div>
        <div class="meta">Factuurnummer: ${invoice.invoice_number || '-'}</div>
        <div class="meta">Factuurdatum: ${formatDate(invoiceDate)}</div>
        <div class="meta">Vervaldatum: ${formatDate(dueDate)}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="meta">Factuur aan</div>
        <div style="font-weight:600; margin-top:6px;">${invoice.client_name || 'Klant'}</div>
        <div class="meta">${invoice.client_email || ''}</div>
        <div class="meta">${(invoice.client_address || '').replace(/\\n/g, '<br/>')}</div>
      </div>
      <div class="card">
        <div class="meta">Project</div>
        <div style="font-weight:600; margin-top:6px;">${project.title || '-'}</div>
        <div class="meta">${project.address || ''} ${project.city || ''}</div>
        <div class="meta">Betalingskenmerk: ${paymentRef || '-'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th>Details</th>
          <th style="text-align:right;">Aantal</th>
          <th style="text-align:right;">Prijs</th>
          <th style="text-align:right;">Totaal</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5">Geen items</td></tr>'}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr>
          <td class="label">Subtotaal (excl. BTW)</td>
          <td class="value">${formatMoney(subtotal)}</td>
        </tr>
        ${discount > 0 ? `
        <tr>
          <td class="label">Korting</td>
          <td class="value">- ${formatMoney(discount)}</td>
        </tr>` : ''}
        <tr>
          <td class="label">BTW (${invoice.vat_percentage || 0}%)</td>
          <td class="value">${formatMoney(vatAmount)}</td>
        </tr>
        <tr>
          <td class="label">Totaal</td>
          <td class="value">${formatMoney(total)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <div>Bank: ${business.bank || '-'} - IBAN: ${business.iban || '-'} - BIC: ${business.bic || '-'}</div>
      <div>KvK: ${business.kvk || '-'} - BTW: ${business.vat || '-'}</div>
      <div>Dank voor de samenwerking.</div>
    </div>
    </div>
  </body>
</html>
    `);

    win.document.close();
    win.focus();
  };

  const sendRevisionRequest = async () => {
    if (!revisionMessage.trim()) {
      toast.error('Voer een bericht in');
      return;
    }

    setRevisionSending(true);
    try {
      const adminEmail = 'basmichelsite@gmail.com';
      const projectTitle = project?.title || 'Project';
      const senderName = user?.full_name || user?.email || 'Klant';
      const link = createPageUrl('AdminProjectDetail') + `?id=${projectId}`;

      await base44.entities.Notification.create({
        type: 'revision_request',
        title: 'Revisieverzoek',
        message: `${senderName}: ${revisionMessage.trim()}`,
        project_id: projectId,
        link,
      });

      await base44.entities.InboxMessage.create({
        subject: `Revisieverzoek - ${projectTitle}`,
        sender_name: senderName,
        sender_email: user?.email || '',
        message: revisionMessage.trim(),
        is_read: false,
        is_archived: false,
      });

      const editors = await base44.entities.Editor.filter({ status: 'active' });
      for (const editor of editors) {
        await base44.entities.EditorNotification.create({
          editor_id: editor.id,
          type: 'revision_request',
          title: 'Revisieverzoek',
          message: `${senderName}: ${revisionMessage.trim()}`,
          project_id: projectId,
          metadata: { source: 'client_project' },
        });
      }

      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `Revisieverzoek - ${projectTitle}`,
        body: `
Nieuw revisieverzoek:

Project: ${projectTitle}
Van: ${senderName}
Bericht: ${revisionMessage.trim()}

Open project: ${window.location.origin}${link}
        `
      });

      toast.success('Revisieverzoek verstuurd');
      setRevisionMessage('');
      setRevisionOpen(false);
    } catch (error) {
      console.error('Revision request error:', error);
      toast.error('Versturen mislukt');
    } finally {
      setRevisionSending(false);
    }
  };

  const handleCancelProject = async () => {
    try {
      // Delete associated sessions to free calendar slot
      const sessions = await base44.entities.Session.filter({ project_id: projectId });
      for (const session of sessions) {
        // Delete from Google Calendar first
        if (session.google_calendar_event_id) {
          try {
            await base44.functions.invoke('calendarSession', {
              action: 'deleteSessionEvent',
              calendarEventId: session.google_calendar_event_id
            });
          } catch (error) {
            console.error('Failed to delete calendar event:', error);
          }
        }
        await base44.entities.Session.delete(session.id);
      }

      // Delete associated booking if exists
      if (project.booking_id) {
        await base44.entities.Booking.delete(project.booking_id);
      }

      // Delete project files
      const files = await base44.entities.ProjectFile.filter({ project_id: projectId });
      for (const file of files) {
        await base44.entities.ProjectFile.delete(file.id);
      }

      // Delete project invoices
      const invoices = await base44.entities.ProjectInvoice.filter({ project_id: projectId });
      for (const invoice of invoices) {
        await base44.entities.ProjectInvoice.delete(invoice.id);
      }

      // Create admin notification
      await base44.entities.Notification.create({
        type: 'project_geannuleerd',
        title: 'Project geannuleerd door klant',
        message: `${user?.full_name || user?.email || 'Klant'} heeft project "${project.title}" geannuleerd`,
        project_id: projectId,
      });

      // Delete the project
      await base44.entities.Project.delete(projectId);

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries(['clientProjects']),
        queryClient.invalidateQueries(['projects']),
        queryClient.invalidateQueries(['existingSessions']),
      ]);

      toast.success('Project geannuleerd');
      navigate(createPageUrl('ClientProjects'));
    } catch (error) {
      console.error('Error canceling project:', error);
      toast.error('Er ging iets mis bij het annuleren');
    }
  };

  const getWeekDays = () => {
    const start = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getTimeSlots = (date) => {
    if (!date) return [];

    const dayOfWeek = date.getDay();
    const workdayConfig = availability.find(a => a.type === 'werkdag' && a.day_of_week === dayOfWeek);

    const startHour = workdayConfig?.start_time ? parseInt(workdayConfig.start_time.split(':')[0]) : 9;
    const endHour = workdayConfig?.end_time ? parseInt(workdayConfig.end_time.split(':')[0]) : 17;

    const slots = [];
    const duration = 60;

    let currentTime = setMinutes(setHours(date, startHour), 0);
    const endTime = setMinutes(setHours(date, endHour), 0);

    while (isBefore(addMinutes(currentTime, duration), endTime) || isSameDay(addMinutes(currentTime, duration), endTime)) {
      const slotEnd = addMinutes(currentTime, duration);
      const hasConflict = existingSessions.some(session => {
        const sessionStart = new Date(session.start_datetime);
        const sessionEnd = new Date(session.end_datetime);
        return (
          (isAfter(currentTime, sessionStart) && isBefore(currentTime, sessionEnd)) ||
          (isAfter(slotEnd, sessionStart) && isBefore(slotEnd, sessionEnd)) ||
          (isBefore(currentTime, sessionStart) && isAfter(slotEnd, sessionEnd)) ||
          isSameDay(currentTime, sessionStart) && format(currentTime, 'HH:mm') === format(sessionStart, 'HH:mm')
        );
      });

      if (!hasConflict && isAfter(currentTime, new Date())) {
        slots.push(new Date(currentTime));
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsRescheduling(true);
    try {
      const endDatetime = addMinutes(selectedTime, 60);

      // Delete old sessions to free the old calendar slot
      const oldSessions = await base44.entities.Session.filter({ project_id: projectId });
      for (const session of oldSessions) {
        // Delete from Google Calendar first
        if (session.google_calendar_event_id) {
          try {
            await base44.functions.invoke('calendarSession', {
              action: 'deleteSessionEvent',
              calendarEventId: session.google_calendar_event_id
            });
          } catch (error) {
            console.error('Failed to delete calendar event:', error);
          }
        }
        await base44.entities.Session.delete(session.id);
      }

      // Update project with new date and time
      await base44.entities.Project.update(projectId, {
        shoot_date: format(selectedDate, 'yyyy-MM-dd'),
        shoot_time: format(selectedTime, 'HH:mm'),
      });

      // Create new session to block the new time slot
      const sessionTypes = await base44.entities.SessionType.filter({ is_active: true });
      const defaultSessionType = sessionTypes[0];

      if (defaultSessionType) {
        await base44.entities.Session.create({
          session_type_id: defaultSessionType.id,
          client_id: clientId,
          project_id: projectId,
          start_datetime: selectedTime.toISOString(),
          end_datetime: endDatetime.toISOString(),
          status: 'bevestigd',
          location: `${project.address}${project.city ? `, ${project.city}` : ''}`,
        });
      }

      // Update booking if exists
      if (project.booking_id) {
        await base44.entities.Booking.update(project.booking_id, {
          start_datetime: selectedTime.toISOString(),
          end_datetime: endDatetime.toISOString(),
        });
      }

      // Create admin notification
      await base44.entities.Notification.create({
        type: 'project_verzet',
        title: 'Project verzet',
        message: `${user?.full_name || user?.email || 'Klant'} heeft project "${project.title}" verzet naar ${format(selectedDate, 'd MMMM yyyy', { locale: nl })} om ${format(selectedTime, 'HH:mm')}`,
        project_id: projectId,
      });

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries(['project', projectId]),
        queryClient.invalidateQueries(['clientProjects']),
        queryClient.invalidateQueries(['existingSessions']),
      ]);

      toast.success('Opgeslagen', {
        icon: '✓',
        duration: 2000
      });
      setShowReschedule(false);
      setSelectedDate(null);
      setSelectedTime(null);
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast.error('Er ging iets mis bij het verzetten');
    } finally {
      setIsRescheduling(false);
    }
  };

  const weekDays = showReschedule ? getWeekDays() : [];
  const timeSlots = selectedDate ? getTimeSlots(selectedDate) : [];

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
          {project.delivery_date && project.status !== 'klaar' && (
            <div className="text-left md:text-right bg-[#F8FAF7] rounded-xl px-5 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Verwachte levering</p>
              <p className="font-medium text-[#5C6B52]">
                {format(new Date(project.delivery_date), 'd MMMM yyyy', { locale: nl })}
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

      {/* Action Buttons - Only for "geboekt" status */}
      {project.status === 'geboekt' && (
        <div className="flex gap-3 mb-8">
          <Button
            variant="outline"
            onClick={() => setShowReschedule(true)}
            className="flex-1"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Verzetten
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCancelConfirm(true)}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Annuleren
          </Button>
        </div>
      )}

      {/* Cancel Confirmation */}
      {showCancelConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <p className="font-medium text-red-900 mb-2">Project annuleren?</p>
          <p className="text-sm text-red-700 mb-4">
            Deze actie kan niet ongedaan gemaakt worden. Het project wordt definitief verwijderd.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1"
            >
              Terug
            </Button>
            <Button
              onClick={handleCancelProject}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Ja, annuleren
            </Button>
          </div>
        </div>
      )}

      {/* Reschedule Interface */}
      {showReschedule && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Shoot verzetten</h2>
            <button onClick={() => { setShowReschedule(false); setSelectedDate(null); setSelectedTime(null); }}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* Week Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(prev => prev - 1)}
                disabled={weekOffset === 0}
              >
                ←
              </Button>
              <span className="text-sm font-medium text-gray-900">
                {weekDays.length > 0 && `${format(weekDays[0], 'd MMM', { locale: nl })} – ${format(weekDays[6], 'd MMM yyyy', { locale: nl })}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(prev => prev + 1)}
              >
                →
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const isPast = isBefore(day, new Date()) && !isToday;
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setSelectedTime(null);
                    }}
                    disabled={isPast}
                    className={cn(
                      "py-3 px-2 rounded-lg text-center transition-all text-sm",
                      isPast ? "opacity-30 cursor-not-allowed" :
                        isSelected ? "bg-[#5C6B52] text-white" :
                          isToday ? "bg-[#F8FAF7] text-[#5C6B52] ring-1 ring-[#A8B5A0]" :
                            "hover:bg-gray-50"
                    )}
                  >
                    <p className="text-xs uppercase opacity-70 mb-1">{format(day, 'EEE', { locale: nl })}</p>
                    <p className="text-lg">{format(day, 'd')}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Beschikbare tijden op {format(selectedDate, 'd MMMM', { locale: nl })}
              </h3>
              {timeSlots.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Geen beschikbare tijden</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.toISOString()}
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                        selectedTime && isSameDay(slot, selectedTime) && format(slot, 'HH:mm') === format(selectedTime, 'HH:mm')
                          ? "bg-[#5C6B52] text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      )}
                    >
                      {format(slot, 'HH:mm')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || isRescheduling}
            className="w-full bg-[#5C6B52] hover:bg-[#4A5A42] text-white"
          >
            {isRescheduling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Bezig met opslaan...
              </>
            ) : (
              'Bevestig nieuwe datum'
            )}
          </Button>
        </div>
      )}

      {/* Project Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Projectinformatie</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Projectnummer</p>
            <p className="font-medium text-gray-900">{project.project_number || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Projectnaam</p>
            <p className="font-medium text-gray-900">{project.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Adres object</p>
            <p className="font-medium text-gray-900">{project.title || '-'}</p>
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
          {project.delivery_date && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Verwachte opleverdatum</p>
              <p className="font-medium text-gray-900">
                {format(new Date(project.delivery_date), 'd MMMM yyyy', { locale: nl })}
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => setRevisionOpen(true)}
            className="w-full"
          >
            Revisie aanvragen
          </Button>
        </div>
      </div>

      {/* Gallery Link - Only when status is "klaar" and gallery exists */}
      {project.status === 'klaar' && galleries.length > 0 && (
        <Link
          to={createPageUrl(`ProjectGalleryView?id=${projectId}`)}
          className="block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow mb-8"
        >
          <div className="p-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Galerij</h2>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {galleries[0].cover_image_url ? (
                  <img
                    src={galleries[0].cover_image_url}
                    alt="Gallery preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-2">{galleries[0].title}</p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {project.title}
                </p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Bewerkte Opleverbestanden - Only when status is "klaar" */}
      {project.status === 'klaar' && deliveryFiles.length > 0 && !hasGallery && (
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Timeline */}
      <ProjectTimeline project={project} />

      {/* Factuur - Only when status is "klaar" */}
      {project.status === 'klaar' && projectInvoice && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#E8EDE5] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#5C6B52]" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Factuur</h2>
          </div>

          <div className="border border-gray-100 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Factuurnummer</p>
                <p className="font-medium text-gray-900">{projectInvoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Datum</p>
                <p className="font-medium text-gray-900">{formatInvoiceDate(projectInvoice.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Bedrag (excl. BTW)</p>
                <p className="font-medium text-gray-900">
                  {getInvoiceSubtotal(projectInvoice) !== null
                    ? `€ ${getInvoiceSubtotal(projectInvoice).toFixed(2)}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">BTW</p>
                <p className="font-medium text-gray-900">€ {projectInvoice.vat_amount?.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-400 mb-1">Totaalbedrag</p>
                <p className="font-medium text-gray-900 text-2xl">€ {projectInvoice.total_amount?.toFixed(2)}</p>
              </div>
            </div>
            {projectInvoice.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-400 mb-1">Omschrijving</p>
                <p className="text-sm text-gray-900">{projectInvoice.description}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => openInvoicePrint(projectInvoice)}
              >
                Bekijk factuur / Download PDF
              </Button>
            </div>
            {projectInvoice.status === 'betaald' ? (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 justify-center py-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Betaald</span>
                </div>
              </div>
            ) : projectInvoice.mollie_payment_link_url ? (
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <a
                  href={projectInvoice.mollie_payment_link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-3 bg-[#5C6B52] hover:bg-[#4A5641] text-white rounded-lg font-medium transition-colors"
                >
                  Factuur Betalen via iDEAL
                </a>
                <p className="text-xs text-center text-gray-400">Je wordt doorgestuurd naar een veilige betaalpagina van Mollie</p>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <Button
                  className="w-full bg-[#5C6B52] hover:bg-[#4A5641] text-white"
                  disabled={paymentLoading}
                  onClick={async () => {
                    try {
                      setPaymentLoading(true);
                      const response = await base44.functions.invoke('molliePayment', {
                        action: 'createPaymentLink',
                        invoiceId: projectInvoice.id,
                        amount: projectInvoice.total_amount,
                        description: `Factuur ${projectInvoice.invoice_number || project.project_number}`,
                        redirectUrl: window.location.href,
                      });
                      const data = response?.data || response;
                      if (data?.paymentLinkUrl) {
                        // Refresh invoice data to show the payment link
                        queryClient.invalidateQueries({ queryKey: ['projectInvoice'] });
                        // Redirect to Mollie payment page
                        window.open(data.paymentLinkUrl, '_blank');
                      } else if (data?.error) {
                        alert(`Fout bij betaling: ${data.error}`);
                      }
                    } catch (err) {
                      console.error('Payment error:', err);
                      alert('Er ging iets mis bij het aanmaken van de betaallink. Probeer het opnieuw.');
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                >
                  {paymentLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Betaallink aanmaken...</>
                  ) : (
                    'Factuur Betalen'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisieverzoek</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Geef aan wat er aangepast moet worden. Dit bericht wordt doorgestuurd naar de studio en editors.
            </p>
            <Textarea
              value={revisionMessage}
              onChange={(e) => setRevisionMessage(e.target.value)}
              rows={5}
              placeholder="Beschrijf je revisie..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRevisionOpen(false)}>
                Annuleren
              </Button>
              <Button
                onClick={sendRevisionRequest}
                disabled={revisionSending}
                className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
              >
                {revisionSending ? 'Versturen...' : 'Versturen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
