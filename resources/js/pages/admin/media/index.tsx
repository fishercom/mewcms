import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModuleLayout from '@/layouts/module/layout';
import axios from 'axios';
import { ArrowLeft, Check, ChevronRight, Copy, ExternalLink, FileText, Folder, FolderPlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface LfmItem {
    name: string;
    url: string;
    size: string;
    time: number;
    thumb: string;
    is_file: boolean;
    icon?: string;
}

const isImageFile = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) : false;
};

export default function MediaLibrary() {
    const [type, setType] = useState<'Images' | 'Files'>('Images');
    const [workingDir, setWorkingDir] = useState<string>('');
    const [items, setItems] = useState<LfmItem[]>([]);

    const filteredItems = items.filter((item) => {
        if (!item.is_file) return true;
        const isImg = isImageFile(item.name);
        return type === 'Images' ? isImg : !isImg;
    });
    const [loading, setLoading] = useState(false);

    // Folder creation state
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);

    // Upload state
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);

    // Copy state feedback
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Fetch files and folders
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/laravel-filemanager/jsonitems', {
                params: {
                    type: type,
                    working_dir: workingDir,
                },
            });
            if (response.data) {
                if (response.data.items) {
                    setItems(response.data.items);
                }
                if (response.data.working_dir && !workingDir) {
                    setWorkingDir(response.data.working_dir);
                }
            }
        } catch (error) {
            console.error('Error fetching file manager items:', error);
        } finally {
            setLoading(false);
        }
    }, [type, workingDir]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Handle Directory Creation
    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        setCreatingFolder(true);
        try {
            const response = await axios.get('/laravel-filemanager/newfolder', {
                params: {
                    name: newFolderName,
                    working_dir: workingDir,
                    type: type,
                },
            });
            if (response.data === 'OK') {
                setNewFolderName('');
                fetchItems();
            } else {
                alert(response.data.error || 'Error al crear carpeta');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Folder creation error:', error);
            const errMsg = error.response?.data?.[0] || error.response?.data || error.message || 'Error al crear carpeta.';
            alert(`Error: ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg}`);
        } finally {
            setCreatingFolder(false);
        }
    };

    // Handle Bulk File Upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const uploadQueue = Array.from(files);
        const progressList = uploadQueue.map((f) => ({ name: f.name, progress: 0 }));
        setUploadingFiles(progressList);

        for (let i = 0; i < uploadQueue.length; i++) {
            const file = uploadQueue[i];
            const formData = new FormData();
            formData.append('upload', file);
            formData.append('working_dir', workingDir);
            formData.append('type', type);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                formData.append('_token', csrfToken);
            }

            try {
                await axios.post('/laravel-filemanager/upload', formData, {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                        setUploadingFiles((prev) => prev.map((item, idx) => (idx === i ? { ...item, progress: percentCompleted } : item)));
                    },
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.error(`Upload failed for ${file.name}:`, error);
                const errMsg = error.response?.data?.[0] || error.response?.data || error.message || 'Error al subir el archivo.';
                alert(`Error al subir ${file.name}: ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg}`);
            }
        }

        setTimeout(() => setUploadingFiles([]), 1500);
        fetchItems();
    };

    // Navigate to Subfolder
    const handleFolderClick = (folderName: string) => {
        const separator = workingDir.endsWith('/') || workingDir === '' ? '' : '/';
        const nextDir = workingDir === '' ? `/${folderName}` : `${workingDir}${separator}${folderName}`;
        setWorkingDir(nextDir);
    };

    // Navigate Back / Parent Folder
    const handleGoBack = () => {
        if (!workingDir || workingDir === '/') {
            setWorkingDir('');
            return;
        }
        const parts = workingDir.split('/');
        parts.pop();
        const parentDir = parts.join('/') || '/';
        setWorkingDir(parentDir === '/' ? '' : parentDir);
    };

    // Copy URL to clipboard
    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const handleDeleteItem = async (itemName: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${itemName}"?`)) {
            return;
        }

        try {
            const response = await axios.get('/laravel-filemanager/delete', {
                params: {
                    type: type,
                    working_dir: workingDir,
                    items: [itemName],
                },
            });
            if (response.data === 'OK') {
                fetchItems();
            } else {
                alert('Error al eliminar el elemento');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Delete item error:', error);
            const errMsg = error.response?.data?.[0] || error.response?.data || error.message || 'Error al eliminar el elemento.';
            alert(`Error: ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg}`);
        }
    };

    return (
        <ModuleLayout>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                {/* Left side actions: Create Folder & Upload Files */}
                <div className="space-y-6 lg:col-span-4">
                    {/* Category tabs */}
                    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/50 p-1 dark:border-zinc-800 dark:bg-black/10">
                        <button
                            type="button"
                            onClick={() => {
                                setType('Images');
                                setWorkingDir('');
                            }}
                            className={`cursor-pointer rounded-lg py-2 text-center text-xs font-semibold transition-colors ${
                                type === 'Images'
                                    ? 'bg-white text-red-600 shadow-xs dark:bg-zinc-800 dark:text-red-500'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Imágenes / Fotos
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setType('Files');
                                setWorkingDir('');
                            }}
                            className={`cursor-pointer rounded-lg py-2 text-center text-xs font-semibold transition-colors ${
                                type === 'Files'
                                    ? 'bg-white text-red-600 shadow-xs dark:bg-zinc-800 dark:text-red-500'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Documentos / Files
                        </button>
                    </div>

                    {/* Folder creation */}
                    <form
                        onSubmit={handleCreateFolder}
                        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-[#161615]"
                    >
                        <Label
                            htmlFor="page-folder-name"
                            className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
                        >
                            <FolderPlus className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span>Crear Carpeta en: {workingDir || '/'}</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="page-folder-name"
                                type="text"
                                placeholder="Nombre de carpeta"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="h-9 bg-white text-xs dark:bg-[#161615]"
                                disabled={creatingFolder}
                            />
                            <Button
                                size="sm"
                                className="h-9 shrink-0 bg-red-600 px-4 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                                disabled={creatingFolder}
                            >
                                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                            </Button>
                        </div>
                    </form>

                    {/* File upload */}
                    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-[#161615]">
                        <Label className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                            <UploadCloud className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span>Subir Archivos</span>
                        </Label>
                        <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-zinc-300 py-8 text-center transition-colors hover:border-red-500/40 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/10">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                            <UploadCloud className="mx-auto mb-2 h-9 w-9 text-zinc-400" />
                            <span className="dark:text-zinc-450 block text-xs font-medium text-zinc-500">
                                Clic aquí o arrastra archivos para subir
                            </span>
                            <span className="mt-1 block text-[10px] text-zinc-400">
                                {type === 'Images' ? 'JPG, PNG, GIF, WEBP' : 'PDF, DOC, XLS, PPT, MP3, MP4'}
                            </span>
                        </div>

                        {/* Upload progress */}
                        {uploadingFiles.length > 0 && (
                            <div className="space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                                {uploadingFiles.map((file, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="max-w-[220px] truncate font-medium text-zinc-600 dark:text-zinc-400">{file.name}</span>
                                            <span className="font-bold text-red-600 dark:text-red-500">{file.progress}%</span>
                                        </div>
                                        <div className="bg-zinc-105 h-1.5 w-full overflow-hidden rounded-full dark:bg-zinc-800">
                                            <div
                                                className="h-full bg-red-600 transition-all duration-300 dark:bg-red-500"
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side content: Browser List grid */}
                <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs lg:col-span-8 dark:border-zinc-800 dark:bg-[#161615]">
                    {/* Navigation Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 py-2 text-xs dark:border-zinc-900">
                        <div className="flex min-w-0 items-center gap-2">
                            {workingDir && (
                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={handleGoBack}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <div className="flex items-center gap-1.5 truncate font-semibold text-zinc-400">
                                <span className="capitalize">{type === 'Images' ? 'imágenes' : 'documentos'}</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <span className="truncate rounded-md bg-zinc-100 px-2 py-0.5 font-bold text-zinc-900 dark:bg-zinc-900 dark:text-white">
                                    {workingDir || '/'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Files and Folders grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-zinc-500">
                            <Loader2 className="h-6 w-6 animate-spin text-red-600 dark:text-red-500" />
                            <span>Cargando archivos de la biblioteca...</span>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {filteredItems.map((item, idx) => {
                                if (!item.is_file) {
                                    // Folder card
                                    const isSystemFolder = !workingDir || workingDir === '/' || ['1', 'shares'].includes(item.name);
                                    return (
                                        <div key={idx} className="group/folder relative">
                                            <button
                                                type="button"
                                                onClick={() => handleFolderClick(item.name)}
                                                className="group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 text-center shadow-xs transition-all hover:border-red-500/40 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-[#1a1a19]/30 dark:hover:bg-zinc-900/10"
                                            >
                                                <Folder className="h-10 w-10 text-amber-500 transition-transform duration-200 group-hover:scale-105" />
                                                <span className="w-full truncate text-xs font-semibold text-zinc-700 capitalize dark:text-zinc-300">
                                                    {item.name}
                                                </span>
                                            </button>
                                            {!isSystemFolder && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    type="button"
                                                    className="absolute top-2 right-2 h-7 w-7 rounded-full text-zinc-400 opacity-0 transition-opacity group-hover/folder:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteItem(item.name);
                                                    }}
                                                    title="Eliminar carpeta"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                }

                                // File card
                                const isImg = isImageFile(item.name);
                                return (
                                    <div
                                        key={idx}
                                        className="group hover:border-zinc-350 dark:hover:border-zinc-750 relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs transition-all duration-200 dark:border-zinc-800 dark:bg-[#1f1f1e]/20"
                                    >
                                        {/* File preview */}
                                        <div className="bg-zinc-55 flex aspect-square items-center justify-center overflow-hidden border-b border-zinc-100 dark:border-zinc-900 dark:bg-black/10">
                                            {isImg ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <FileText className="h-12 w-12 text-red-500/80" />
                                            )}
                                        </div>

                                        {/* Details & actions */}
                                        <div className="flex flex-1 flex-col justify-between space-y-2 p-3">
                                            <span className="block truncate text-xs font-semibold text-zinc-700 dark:text-zinc-300" title={item.name}>
                                                {item.name}
                                            </span>

                                            <div className="flex gap-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-900/50">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    type="button"
                                                    className="flex h-7 w-full cursor-pointer items-center justify-center gap-1 text-[10px]"
                                                    onClick={() => handleCopyUrl(item.url)}
                                                >
                                                    {copiedUrl === item.url ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                                            <span className="text-green-500">Copiado</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3.5 w-3.5" />
                                                            <span>Copiar URL</span>
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    type="button"
                                                    className="text-zinc-450 h-7 w-7 shrink-0 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                                                    onClick={() => handleDeleteItem(item.name)}
                                                    title="Eliminar elemento"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    type="button"
                                                    className="h-7 w-7 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                                    asChild
                                                >
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" title="Abrir en pestaña nueva">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/10 py-24 text-center dark:border-zinc-800">
                            <p className="text-sm text-zinc-400 italic">Esta carpeta está vacía.</p>
                        </div>
                    )}
                </div>
            </div>
        </ModuleLayout>
    );
}
