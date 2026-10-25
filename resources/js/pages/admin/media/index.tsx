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
                    <div className="border-border bg-muted/50 grid grid-cols-2 overflow-hidden rounded-xl border p-1 dark:bg-black/10">
                        <button
                            type="button"
                            onClick={() => {
                                setType('Images');
                                setWorkingDir('');
                            }}
                            className={`cursor-pointer rounded-lg py-2 text-center text-xs font-semibold transition-colors ${
                                type === 'Images' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
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
                                type === 'Files' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Documentos / Files
                        </button>
                    </div>

                    {/* Folder creation */}
                    <form onSubmit={handleCreateFolder} className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                        <Label
                            htmlFor="page-folder-name"
                            className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
                        >
                            <FolderPlus className="text-primary h-4 w-4" />
                            <span>Crear Carpeta en: {workingDir || '/'}</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="page-folder-name"
                                type="text"
                                placeholder="Nombre de carpeta"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="bg-card h-9 text-xs"
                                disabled={creatingFolder}
                            />
                            <Button
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 shrink-0 px-4"
                                disabled={creatingFolder}
                            >
                                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                            </Button>
                        </div>
                    </form>

                    {/* File upload */}
                    <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs">
                        <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                            <UploadCloud className="text-primary h-4 w-4" />
                            <span>Subir Archivos</span>
                        </Label>
                        <div className="border-border hover:border-primary/40 hover:bg-muted/50 relative cursor-pointer rounded-xl border-2 border-dashed py-8 text-center transition-colors">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                            <UploadCloud className="text-muted-foreground mx-auto mb-2 h-9 w-9" />
                            <span className="text-muted-foreground block text-xs font-medium">Clic aquí o arrastra archivos para subir</span>
                            <span className="text-muted-foreground mt-1 block text-[10px]">
                                {type === 'Images' ? 'JPG, PNG, GIF, WEBP' : 'PDF, DOC, XLS, PPT, MP3, MP4'}
                            </span>
                        </div>

                        {/* Upload progress */}
                        {uploadingFiles.length > 0 && (
                            <div className="border-border space-y-3 border-t pt-3">
                                {uploadingFiles.map((file, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-muted-foreground max-w-[220px] truncate font-medium">{file.name}</span>
                                            <span className="text-primary font-bold">{file.progress}%</span>
                                        </div>
                                        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${file.progress}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side content: Browser List grid */}
                <div className="border-border bg-card space-y-4 rounded-xl border p-5 shadow-xs lg:col-span-8">
                    {/* Navigation Header */}
                    <div className="border-border flex items-center justify-between gap-2 border-b py-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                            {workingDir && (
                                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={handleGoBack}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <div className="text-muted-foreground flex items-center gap-1.5 truncate font-semibold">
                                <span className="capitalize">{type === 'Images' ? 'imágenes' : 'documentos'}</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <span className="bg-muted text-foreground truncate rounded-md px-2 py-0.5 font-bold">{workingDir || '/'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Files and Folders grid */}
                    {loading ? (
                        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-24 text-sm">
                            <Loader2 className="text-primary h-6 w-6 animate-spin" />
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
                                                className="group border-border bg-muted/50 hover:border-primary/40 hover:bg-muted/50 flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center shadow-xs transition-all"
                                            >
                                                <Folder className="text-warning h-10 w-10 transition-transform duration-200 group-hover:scale-105" />
                                                <span className="text-foreground w-full truncate text-xs font-semibold capitalize">{item.name}</span>
                                            </button>
                                            {!isSystemFolder && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    type="button"
                                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 transition-opacity group-hover/folder:opacity-100"
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
                                        className="group hover:border-border-strong border-border bg-card relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-all duration-200"
                                    >
                                        {/* File preview */}
                                        <div className="bg-muted/50 border-border flex aspect-square items-center justify-center overflow-hidden border-b dark:bg-black/10">
                                            {isImg ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <FileText className="text-primary h-12 w-12" />
                                            )}
                                        </div>

                                        {/* Details & actions */}
                                        <div className="flex flex-1 flex-col justify-between space-y-2 p-3">
                                            <span className="text-foreground block truncate text-xs font-semibold" title={item.name}>
                                                {item.name}
                                            </span>

                                            <div className="border-border flex gap-1.5 border-t pt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    type="button"
                                                    className="flex h-7 w-full cursor-pointer items-center justify-center gap-1 text-[10px]"
                                                    onClick={() => handleCopyUrl(item.url)}
                                                >
                                                    {copiedUrl === item.url ? (
                                                        <>
                                                            <Check className="text-success h-3.5 w-3.5" />
                                                            <span className="text-success">Copiado</span>
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
                                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 w-7 shrink-0"
                                                    onClick={() => handleDeleteItem(item.name)}
                                                    title="Eliminar elemento"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    type="button"
                                                    className="text-muted-foreground hover:text-muted-foreground h-7 w-7 shrink-0"
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
                        <div className="border-border bg-muted/50 rounded-xl border-2 border-dashed py-24 text-center">
                            <p className="text-muted-foreground text-sm italic">Esta carpeta está vacía.</p>
                        </div>
                    )}
                </div>
            </div>
        </ModuleLayout>
    );
}
