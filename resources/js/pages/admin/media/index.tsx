import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    FolderPlus, UploadCloud, Folder, 
    FileText, ChevronRight, 
    ArrowLeft, Copy, Check, Loader2, ExternalLink, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModuleLayout from '@/layouts/module/layout';

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

    const filteredItems = items.filter(item => {
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
                    working_dir: workingDir
                }
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
                    type: type
                }
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
        const progressList = uploadQueue.map(f => ({ name: f.name, progress: 0 }));
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
                        'Accept': 'application/json',
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                        setUploadingFiles(prev => 
                            prev.map((item, idx) => idx === i ? { ...item, progress: percentCompleted } : item)
                        );
                    }
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
                    items: [itemName]
                }
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side actions: Create Folder & Upload Files */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Category tabs */}
                    <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/10 p-1">
                        <button
                            type="button"
                            onClick={() => { setType('Images'); setWorkingDir(''); }}
                            className={`py-2 text-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                type === 'Images' 
                                    ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-500 shadow-xs' 
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Imágenes / Fotos
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('Files'); setWorkingDir(''); }}
                            className={`py-2 text-center text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                type === 'Files' 
                                    ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-500 shadow-xs' 
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            Documentos / Files
                        </button>
                    </div>

                    {/* Folder creation */}
                    <form onSubmit={handleCreateFolder} className="bg-white dark:bg-[#161615] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
                        <Label htmlFor="page-folder-name" className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
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
                                className="h-9 text-xs bg-white dark:bg-[#161615]"
                                disabled={creatingFolder}
                            />
                            <Button size="sm" className="h-9 px-4 shrink-0 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600" disabled={creatingFolder}>
                                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                            </Button>
                        </div>
                    </form>

                    {/* File upload */}
                    <div className="bg-white dark:bg-[#161615] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
                        <Label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <UploadCloud className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span>Subir Archivos</span>
                        </Label>
                        <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 hover:border-red-500/40 transition-colors py-8 text-center cursor-pointer">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <UploadCloud className="mx-auto h-9 w-9 text-zinc-400 mb-2" />
                            <span className="text-xs text-zinc-500 dark:text-zinc-450 font-medium block">
                                Clic aquí o arrastra archivos para subir
                            </span>
                            <span className="text-[10px] text-zinc-400 mt-1 block">
                                {type === 'Images' ? 'JPG, PNG, GIF, WEBP' : 'PDF, DOC, XLS, PPT, MP3, MP4'}
                            </span>
                        </div>

                        {/* Upload progress */}
                        {uploadingFiles.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                                {uploadingFiles.map((file, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="truncate max-w-[220px] font-medium text-zinc-600 dark:text-zinc-400">{file.name}</span>
                                            <span className="font-bold text-red-600 dark:text-red-500">{file.progress}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-105 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-red-600 dark:bg-red-500 h-full transition-all duration-300"
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
                <div className="lg:col-span-8 bg-white dark:bg-[#161615] rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs">
                    
                    {/* Navigation Header */}
                    <div className="flex items-center gap-2 text-xs py-2 border-b border-zinc-100 dark:border-zinc-900 justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            {workingDir && (
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-8 w-8 rounded-lg" 
                                    onClick={handleGoBack}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <div className="flex items-center gap-1.5 text-zinc-400 font-semibold truncate">
                                <span className="capitalize">{type === 'Images' ? 'imágenes' : 'documentos'}</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <span className="text-zinc-900 dark:text-white truncate font-bold bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md">
                                    {workingDir || '/'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Files and Folders grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-sm text-zinc-500">
                            <Loader2 className="h-6 w-6 animate-spin text-red-600 dark:text-red-500" />
                            <span>Cargando archivos de la biblioteca...</span>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredItems.map((item, idx) => {
                                if (!item.is_file) {
                                    // Folder card
                                    const isSystemFolder = !workingDir || workingDir === '/' || ['1', 'shares'].includes(item.name);
                                    return (
                                        <div key={idx} className="relative group/folder">
                                            <button
                                                type="button"
                                                onClick={() => handleFolderClick(item.name)}
                                                className="w-full flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-[#1a1a19]/30 hover:border-red-500/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-all text-center gap-3 group cursor-pointer shadow-xs"
                                            >
                                                <Folder className="h-10 w-10 text-amber-500 group-hover:scale-105 transition-transform duration-200" />
                                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate w-full capitalize">
                                                    {item.name}
                                                </span>
                                            </button>
                                            {!isSystemFolder && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    type="button"
                                                    className="absolute top-2 right-2 h-7 w-7 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover/folder:opacity-100 transition-opacity"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.name); }}
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
                                        className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1f1f1e]/20 overflow-hidden group shadow-xs flex flex-col hover:border-zinc-350 dark:hover:border-zinc-750 transition-all duration-200"
                                    >
                                        {/* File preview */}
                                        <div className="aspect-square bg-zinc-55 dark:bg-black/10 flex items-center justify-center overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
                                            {isImg ? (
                                                <img 
                                                    src={item.url} 
                                                    alt={item.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <FileText className="h-12 w-12 text-red-500/80" />
                                            )}
                                        </div>

                                        {/* Details & actions */}
                                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate block" title={item.name}>
                                                {item.name}
                                            </span>
                                            
                                            <div className="flex gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900/50">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    type="button"
                                                    className="w-full text-[10px] h-7 flex items-center justify-center gap-1 cursor-pointer"
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
                                                    className="h-7 w-7 shrink-0 text-zinc-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
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
                        <div className="text-center py-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/10">
                            <p className="text-sm text-zinc-400 italic">Esta carpeta está vacía.</p>
                        </div>
                    )}
                </div>

            </div>
        </ModuleLayout>
    );
}
