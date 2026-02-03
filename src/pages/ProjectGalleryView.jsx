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
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const categories = [
    { key: 'all', label: 'Alle' },
    { key: 'bewerkte_fotos', label: "Foto's" },
    { key: 'bewerkte_videos', label: "Video's" },
    { key: '360_matterport', label: '360°' },
];

export default function ProjectGalleryView() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFiles, setSelectedFiles] = useState({});
    const [downloading, setDownloading] = useState(false);
    const [selectMode, setSelectMode] = useState(false);

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

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

    // Filter files to delivery categories only
    const deliveryFiles = allFiles.filter(f =>
        ['bewerkte_fotos', 'bewerkte_videos', '360_matterport'].includes(f.category)
    );

    // Filter by selected category
    const filteredFiles = selectedCategory === 'all'
        ? deliveryFiles
        : deliveryFiles.filter(f => f.category === selectedCategory);

    // Get only image and video files for gallery display
    const galleryFiles = filteredFiles.filter(f =>
        f.mime_type?.startsWith('image/') ||
        f.mime_type?.startsWith('video/') ||
        f.mime_type === 'text/url'
    );

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
        const allSelected = galleryFiles.every(f => selectedFiles[f.id]);
        const newSelected = {};
        if (!allSelected) {
            galleryFiles.forEach(f => {
                newSelected[f.id] = true;
            });
        }
        setSelectedFiles(newSelected);
    };

    // Download selected files
    const handleDownload = async () => {
        const filesToDownload = galleryFiles.filter(f => selectedFiles[f.id] && f.mime_type !== 'text/url');
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
            setSelectMode(false);
        } catch (error) {
            toast.error('Download failed');
            console.error(error);
        } finally {
            setDownloading(false);
        }
    };

    // Copy share link
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const selectedCount = Object.values(selectedFiles).filter(Boolean).length;

    if (projectLoading || filesLoading) {
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
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-[#1A1A1A]" />
                )}

                {/* Top Navigation */}
                <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
                    <Link
                        to={createPageUrl('AdminProjectDetail') + `?id=${projectId}`}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm">Back to project</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="text-white/70 hover:text-white hover:bg-white/10"
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
                        onClick={() => setSelectMode(true)}
                        className="mt-6 bg-white hover:bg-gray-100 text-gray-900 font-medium"
                    >
                        <Images className="w-4 h-4 mr-2" />
                        View Gallery
                    </Button>
                </div>
            </div>

            {/* Gallery Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Category Tabs + Actions */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        {categories.map(cat => {
                            const count = cat.key === 'all'
                                ? deliveryFiles.filter(f => f.mime_type?.startsWith('image/') || f.mime_type?.startsWith('video/')).length
                                : deliveryFiles.filter(f => f.category === cat.key && (f.mime_type?.startsWith('image/') || f.mime_type?.startsWith('video/'))).length;

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
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            className="border-white/20 text-white hover:bg-white/10"
                        >
                            {galleryFiles.every(f => selectedFiles[f.id]) ? (
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
                {galleryFiles.length === 0 ? (
                    <div className="text-center py-20">
                        <Images className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">No files in this category</p>
                    </div>
                ) : (
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
                            </motion.div>
                        ))}
                    </div>
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
        </div>
    );
}
