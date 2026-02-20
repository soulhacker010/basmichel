import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    Images,
    X,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Download,
    Share2,
    Check,
    CheckSquare,
    Square,
    Play,
    ExternalLink,
    Loader2,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const categories = [
    { key: 'all', label: 'Alle' },
    { key: 'bewerkte_fotos', label: "Foto's" },
    { key: 'bewerkte_videos', label: "Video's" },
    { key: '360_matterport', label: '360 graden' },
    { key: 'meetrapport', label: 'Meetrapport' },
];

export default function ProjectGalleryView() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFiles, setSelectedFiles] = useState({});
    const [downloading, setDownloading] = useState(false);
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [revisionOpen, setRevisionOpen] = useState(false);
    const [revisionMessage, setRevisionMessage] = useState('');
    const [revisionSending, setRevisionSending] = useState(false);

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    useEffect(() => {
        const loadUser = async () => {
            try {
                const isAuth = await base44.auth.isAuthenticated();
                if (isAuth) {
                    const userData = await base44.auth.me();
                    setUser(userData);
                }
            } catch (e) {
                console.log('Not authenticated');
            } finally {
                setAuthChecked(true);
            }
        };
        loadUser();
    }, []);

    // Fetch project
    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => base44.entities.Project.get(projectId),
        enabled: !!projectId,
    });

    // Fetch project files
    const { data: allFiles = [], isLoading: filesLoading } = useQuery({
        queryKey: ['projectFiles', projectId],
        queryFn: () => base44.entities.ProjectFile.filter({ project_id: projectId }),
        enabled: !!projectId,
    });

    // Fetch client for project
    const { data: client } = useQuery({
        queryKey: ['client', project?.client_id],
        queryFn: () => base44.entities.Client.get(project.client_id),
        enabled: !!project?.client_id,
    });

    const hasAccess = () => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (client && client.user_id === user.id) return true;
        return false;
    };

    // Filter files to delivery categories only
    const deliveryFiles = allFiles.filter(f =>
        ['bewerkte_fotos', 'bewerkte_videos', '360_matterport', 'meetrapport'].includes(f.category)
    );

    // Filter by selected category
    const filteredFiles = selectedCategory === 'all'
        ? deliveryFiles
        : deliveryFiles.filter(f => f.category === selectedCategory);

    // Get only image, video, and link files for gallery display
    const galleryFiles = filteredFiles.filter(f =>
        f.mime_type?.startsWith('image/') ||
        f.mime_type?.startsWith('video/') ||
        f.mime_type === 'text/url'
    );

    const listFiles = filteredFiles.filter(f =>
        !f.mime_type?.startsWith('image/') &&
        !f.mime_type?.startsWith('video/') &&
        f.mime_type !== 'text/url'
    );

    const selectableFiles = filteredFiles.filter(f => f.mime_type !== 'text/url');

    // Get cover image
    const coverImage = deliveryFiles.find(f => f.mime_type?.startsWith('image/'));

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (selectedIndex === null) return;
        if (e.key === 'ArrowRight') {
            setSelectedIndex(prev => (prev + 1) % galleryFiles.length);
        } else if (e.key === 'ArrowLeft') {
            setSelectedIndex(prev => (prev - 1 + galleryFiles.length) % galleryFiles.length);
        } else if (e.key === 'Escape') {
            setSelectedIndex(null);
        }
    }, [selectedIndex, galleryFiles.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Toggle file selection
    const toggleSelect = (fileId) => {
        setSelectedFiles(prev => ({
            ...prev,
            [fileId]: !prev[fileId]
        }));
    };

    // Select all visible files
    const handleSelectAll = () => {
        if (selectableFiles.length === 0) return;
        const allSelected = selectableFiles.every(f => selectedFiles[f.id]);
        const newSelected = {};
        if (!allSelected) {
            selectableFiles.forEach(f => {
                newSelected[f.id] = true;
            });
        }
        setSelectedFiles(newSelected);
    };

    // Download selected files
    const handleDownload = async () => {
        const filesToDownload = selectableFiles.filter(f => selectedFiles[f.id]);
        if (filesToDownload.length === 0) {
            toast.error('No files selected for download');
            return;
        }

        setDownloading(true);
        try {
            if (filesToDownload.length === 1) {
                // Single file download
                const file = filesToDownload[0];
                const response = await fetch(file.file_url);
                const blob = await response.blob();
                saveAs(blob, file.filename);
            } else {
                // Multiple files - create ZIP
                const zip = new JSZip();

                for (const file of filesToDownload) {
                    const response = await fetch(file.file_url);
                    const blob = await response.blob();
                    zip.file(file.filename, blob);
                }

                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, `${project?.title || 'gallery'}.zip`);
            }
            toast.success(`Downloaded ${filesToDownload.length} file(s)`);
            setSelectedFiles({});
        } catch (error) {
            toast.error('Download failed');
            console.error(error);
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadSingle = async (file) => {
        try {
            const response = await fetch(file.file_url);
            const blob = await response.blob();
            saveAs(blob, file.filename);
        } catch (error) {
            toast.error('Download failed');
            console.error(error);
        }
    };

    // Copy share link
    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ url, title: project?.title || 'Galerij' });
                toast.success('Link gedeeld');
                return;
            }
        } catch (error) {
            console.warn('Native share failed:', error);
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                toast.success('Link gekopieerd');
                return;
            }

            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (copied) {
                toast.success('Link gekopieerd');
                return;
            }
        } catch (error) {
            console.warn('Clipboard fallback failed:', error);
        }

        window.prompt('Kopieer deze link:', url);
    };

    const sendRevisionRequest = async () => {
        if (!revisionMessage.trim()) {
            toast.error('Voer een bericht in');
            return;
        }

        setRevisionSending(true);
        try {
            const adminEmail = 'basmichelsite@gmail.com';
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
                subject: `Revisieverzoek - ${project?.title || 'Project'}`,
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
                    metadata: { source: 'project_gallery' },
                });
            }

            await base44.integrations.Core.SendEmail({
                to: adminEmail,
                subject: `Revisieverzoek - ${project?.title || 'Project'}`,
                body: `
Nieuw revisieverzoek:

Project: ${project?.title || 'Project'}
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

    const selectedCount = selectableFiles.filter(f => selectedFiles[f.id]).length;

    if (projectLoading || filesLoading || !authChecked) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-white/60">Loading...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-center">
                    <Images className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h1 className="text-xl font-medium text-white mb-2">Gallery not found</h1>
                    <p className="text-white/50">This project does not exist.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-center">
                    <Images className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h1 className="text-xl font-medium text-white mb-2">Toegang vereist</h1>
                    <p className="text-white/50 mb-6">Log in om deze galerij te bekijken.</p>
                    <Button onClick={() => base44.auth.redirectToLogin()} className="bg-white text-black">
                        Inloggen
                    </Button>
                </div>
            </div>
        );
    }

    if (!hasAccess()) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-center">
                    <Images className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h1 className="text-xl font-medium text-white mb-2">Geen toegang</h1>
                    <p className="text-white/50">Je hebt geen toegang tot deze galerij.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Hero Header */}
            <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
                {coverImage ? (
                    <>
                        <img
                            src={coverImage.file_url}
                            alt={project.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-[#1A1A1A]" />
                )}

                {/* Top Navigation */}
                <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between pointer-events-auto">
                    <Link
                        to={createPageUrl(user?.role === 'admin' ? 'AdminProjectDetail' : 'ClientProjectDetail2') + `?id=${projectId}`}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm">Terug naar project</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShare();
                        }}
                        className="text-white/90 hover:text-white hover:bg-white/10"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <p className="text-white/60 text-sm mb-2">BAS MICHEL</p>
                    <h1 className="text-3xl md:text-5xl font-light text-white mb-4">
                        {project.title}
                    </h1>
                    {project.address && (
                        <p className="text-white/60">{project.address}</p>
                    )}
                    <Button
                        onClick={() => {
                            const section = document.getElementById('gallery-section');
                            if (section) {
                                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        className="mt-6 bg-white/95 hover:bg-white text-gray-900 font-medium shadow-lg"
                    >
                        <Images className="w-4 h-4 mr-2" />
                        View Gallery
                    </Button>
                    <Button
                        onClick={() => setRevisionOpen(true)}
                        className="mt-4 bg-white/10 hover:bg-white/20 text-white border border-white/30"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Revisie aanvragen
                    </Button>
                </div>
            </div>

            {/* Gallery Section */}
            <div id="gallery-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Category Tabs + Actions */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        {categories.map(cat => {
                            const count = cat.key === 'all'
                                ? deliveryFiles.length
                                : deliveryFiles.filter(f => f.category === cat.key).length;

                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm transition-colors",
                                        selectedCategory === cat.key
                                            ? "bg-white text-black"
                                            : "text-white/60 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {cat.label}
                                    {count > 0 && (
                                        <span className="ml-2 text-xs opacity-60">({count})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="border border-white/40 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                        >
                            {selectableFiles.length > 0 && selectableFiles.every(f => selectedFiles[f.id]) ? (
                                <>
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Deselect All
                                </>
                            ) : (
                                <>
                                    <Square className="w-4 h-4 mr-2" />
                                    Select All
                                </>
                            )}
                        </Button>

                        {selectedCount > 0 && (
                            <Button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
                            >
                                {downloading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                )}
                                Download ({selectedCount})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Gallery Grid */}
                {galleryFiles.length === 0 && listFiles.length === 0 ? (
                    <div className="text-center py-20">
                        <Images className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">No files in this category</p>
                    </div>
                ) : (
                    <>
                        {galleryFiles.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {galleryFiles.map((file, index) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="aspect-[4/3] rounded-lg overflow-hidden relative group cursor-pointer"
                                        onClick={() => {
                                            if (file.mime_type === 'text/url') {
                                                window.open(file.file_url, '_blank');
                                            } else {
                                                setSelectedIndex(index);
                                            }
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        {file.mime_type === 'text/url' ? (
                                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                                <ExternalLink className="w-8 h-8 text-white/50" />
                                            </div>
                                        ) : file.mime_type?.startsWith('video/') ? (
                                            <div className="relative w-full h-full">
                                                <video
                                                    src={file.file_url}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <Play className="w-12 h-12 text-white/80" />
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={file.file_url}
                                                alt={file.filename}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                                        {/* Selection checkbox */}
                                        {file.mime_type !== 'text/url' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelect(file.id);
                                                }}
                                                className={cn(
                                                    "absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                                                    selectedFiles[file.id]
                                                        ? "bg-[#5C6B52] border-[#5C6B52] text-white"
                                                        : "border-white/50 bg-black/30 opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                {selectedFiles[file.id] && <Check className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {listFiles.length > 0 && (
                            <div className="mt-10">
                                <h3 className="text-sm uppercase tracking-wide text-white/60 mb-4">Bestanden</h3>
                                <div className="space-y-3">
                                    {listFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleSelect(file.id)}
                                                    className={cn(
                                                        "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                                                        selectedFiles[file.id]
                                                            ? "bg-[#5C6B52] border-[#5C6B52] text-white"
                                                            : "border-white/30 text-white/60"
                                                    )}
                                                >
                                                    {selectedFiles[file.id] && <Check className="w-4 h-4" />}
                                                </button>
                                                <div>
                                                    <p className="text-sm text-white">{file.filename}</p>
                                                    <p className="text-xs text-white/50">{file.category}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadSingle(file)}
                                                className="text-white/80 hover:text-white hover:bg-white/10"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedIndex !== null && galleryFiles[selectedIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black"
                        onClick={() => setSelectedIndex(null)}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
                            onClick={() => setSelectedIndex(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Navigation */}
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIndex(prev => (prev - 1 + galleryFiles.length) % galleryFiles.length);
                            }}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIndex(prev => (prev + 1) % galleryFiles.length);
                            }}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            {galleryFiles[selectedIndex]?.mime_type?.startsWith('video/') ? (
                                <video
                                    src={galleryFiles[selectedIndex]?.file_url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-full"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <img
                                    src={galleryFiles[selectedIndex]?.file_url}
                                    alt=""
                                    className="max-w-full max-h-full object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>

                        {/* Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-4 py-2 rounded-full">
                            {selectedIndex + 1} / {galleryFiles.length}
                        </div>

                        {/* Download button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const file = galleryFiles[selectedIndex];
                                if (file) {
                                    fetch(file.file_url)
                                        .then(res => res.blob())
                                        .then(blob => saveAs(blob, file.filename));
                                }
                            }}
                            className="absolute bottom-4 right-4 p-3 text-white/70 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

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
