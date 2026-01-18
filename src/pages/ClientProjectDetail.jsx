import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Images,
  FileText,
  Download,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const statusSteps = [
  { key: 'geboekt', label: 'Geboekt', description: 'Shoot ingepland' },
  { key: 'shoot_uitgevoerd', label: 'Shoot uitgevoerd', description: 'Fotosessie voltooid' },
  { key: 'wordt_bewerkt', label: 'Wordt bewerkt', description: 'Foto\'s worden bewerkt' },
  { key: 'klaar', label: 'Klaar', description: 'Galerij beschikbaar' },
];

export default function ClientProjectDetail() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);

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
    queryFn: () => base44.entities.Project.filter({ id: projectId }),
    enabled: !!projectId,
    select: data => data?.[0]
  });

  const { data: booking } = useQuery({
    queryKey: ['projectBooking', project?.booking_id],
    queryFn: () => base44.entities.Booking.filter({ id: project.booking_id }),
    enabled: !!project?.booking_id,
    select: data => data?.[0]
  });

  const { data: gallery } = useQuery({
    queryKey: ['projectGallery', project?.gallery_id],
    queryFn: () => base44.entities.Gallery.filter({ project_id: projectId, status: 'gepubliceerd' }),
    enabled: !!projectId,
    select: data => data?.[0]
  });

  const { data: mediaItems = [] } = useQuery({
    queryKey: ['galleryMedia', gallery?.id],
    queryFn: () => base44.entities.MediaItem.filter({ gallery_id: gallery.id }, 'order'),
    enabled: !!gallery?.id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['projectInvoices', projectId],
    queryFn: () => base44.entities.Invoice.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
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
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === project.status);

  const toggleImageSelection = (id) => {
    setSelectedImages(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllImages = () => {
    if (selectedImages.length === mediaItems.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(mediaItems.map(m => m.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link 
        to={createPageUrl('ClientProjects')}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Terug naar projecten
      </Link>

      {/* Progress Bar Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-gray-900">{project.title}</h1>
            {project.address && (
              <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{project.address}{project.city && `, ${project.city}`}</span>
              </div>
            )}
          </div>
          {project.delivery_datetime && project.status !== 'klaar' && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Verwachte levering</p>
              <p className="font-medium text-gray-900">
                {format(new Date(project.delivery_datetime), 'd MMMM yyyy', { locale: nl })}
              </p>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-[#A8B5A0] transition-all duration-500"
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
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    isCompleted 
                      ? "bg-[#A8B5A0] border-[#A8B5A0] text-white" 
                      : "bg-white border-gray-200 text-gray-400"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm mt-2 font-medium text-center",
                    isCurrent ? "text-[#5C6B52]" : isCompleted ? "text-gray-700" : "text-gray-400"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 text-center hidden sm:block">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          {project.status === 'klaar' && gallery && mediaItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Images className="w-5 h-5 text-[#5C6B52]" />
                  <h2 className="text-lg font-medium text-gray-900">Galerij</h2>
                  <span className="text-sm text-gray-500">({mediaItems.length} foto's)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllImages}
                  >
                    {selectedImages.length === mediaItems.length ? 'Deselecteer alles' : 'Selecteer alles'}
                  </Button>
                  {selectedImages.length > 0 && (
                    <Button
                      size="sm"
                      className="bg-[#A8B5A0] hover:bg-[#97A690] text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download ({selectedImages.length})
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaItems.map((item, index) => (
                    <div 
                      key={item.id}
                      className="relative aspect-[4/3] rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img 
                        src={item.thumbnail_url || item.file_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Selection Checkbox */}
                      <div 
                        className="absolute top-2 left-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImageSelection(item.id);
                        }}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors cursor-pointer",
                          selectedImages.includes(item.id)
                            ? "bg-[#A8B5A0] border-[#A8B5A0]"
                            : "bg-white/80 border-gray-300 hover:border-[#A8B5A0]"
                        )}>
                          {selectedImages.includes(item.id) && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Booking Info */}
          {booking && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#5C6B52]" />
                <h2 className="text-lg font-medium text-gray-900">Boeking</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Datum</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(booking.start_datetime), 'd MMMM yyyy', { locale: nl })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tijd</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(booking.start_datetime), 'HH:mm')} - {booking.end_datetime && format(new Date(booking.end_datetime), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoices */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#5C6B52]" />
              <h2 className="text-lg font-medium text-gray-900">Facturen</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">Nog geen facturen</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">€{invoice.total_amount?.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{invoice.invoice_number}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        invoice.status === 'betaald' ? "bg-green-50 text-green-700" :
                        invoice.status === 'verzonden' ? "bg-amber-50 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {invoice.status === 'betaald' ? 'Betaald' : invoice.status === 'verzonden' ? 'Open' : 'Concept'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {invoices.filter(i => i.status === 'verzonden').length > 0 && (
              <div className="p-4 border-t border-gray-50">
                <Link to={createPageUrl('ClientInvoices')}>
                  <Button className="w-full bg-[#A8B5A0] hover:bg-[#97A690] text-white">
                    Facturen Betalen
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl"
              onClick={() => setLightboxIndex(null)}
            >
              ×
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length);
              }}
            >
              ‹
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev + 1) % mediaItems.length);
              }}
            >
              ›
            </button>
            <img 
              src={mediaItems[lightboxIndex]?.file_url}
              alt=""
              className="max-w-full max-h-full object-contain p-4"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {mediaItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}