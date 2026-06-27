import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    X, FolderPlus, UploadCloud, Folder, 
    FileText, ChevronRight, 
    ArrowLeft, Copy, Check, Loader2, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickMediaDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (url: string) => void;
    initialType?: 'Images' | 'Files';
}

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

export default function QuickMediaDrawer({ 
    isOpen, 
    onClose, 
    onSelect,
    initialType = 'Images' 
}: QuickMediaDrawerProps) {
    const [type, setType] = useState<'Images' | 'Files'>(initialType);
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
        if (!isOpen) return;
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
    }, [isOpen, type, workingDir]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    if (!isOpen) return null;

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
            // Get CSRF token from Laravel meta tag or cookie if needed
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
            } catch (error: any) {
                console.error(`Upload failed for ${file.name}:`, error);
                const errMsg = error.response?.data?.[0] || error.response?.data || error.message || 'Error al subir el archivo.';
                alert(`Error al subir ${file.name}: ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg}`);
            }
        }

        // Clear upload display and refresh
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
        parts.pop(); // Remove last segment
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
        } catch (error: any) {
            console.error('Delete item error:', error);
            const errMsg = error.response?.data?.[0] || error.response?.data || error.message || 'Error al eliminar el elemento.';
            alert(`Error: ${typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
                onClick={onClose} 
            />

            {/* Sidebar drawer content */}
            <div className="relative w-full max-w-md bg-white dark:bg-[#161615] border-l border-gray-200 dark:border-gray-800 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-900">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Gestor de Medios Rápido</h2>
                        <p className="text-xs text-gray-400">Sube, crea carpetas e inserta archivos</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                        <X className="h-4.5 w-4.5" />
                    </Button>
                </div>

                {/* Tab selector Images / Files */}
                <div className="grid grid-cols-2 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-black/10">
                    <button
                        type="button"
                        onClick={() => { setType('Images'); setWorkingDir(''); }}
                        className={`py-3 text-center text-xs font-semibold border-b-2 transition-colors ${
                            type === 'Images' 
                                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Imágenes / Fotos
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('Files'); setWorkingDir(''); }}
                        className={`py-3 text-center text-xs font-semibold border-b-2 transition-colors ${
                            type === 'Files' 
                                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-500' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Documentos / Files
                    </button>
                </div>

                {/* Main Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Action Block 1: Folder Creation */}
                    <form onSubmit={handleCreateFolder} className="bg-gray-50 dark:bg-black/15 p-4 rounded-xl border border-gray-200/50 dark:border-gray-900/50 space-y-3">
                        <Label htmlFor="drawer-folder-name" className="text-xs font-semibold flex items-center gap-1">
                            <FolderPlus className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span>Crear Carpeta en: {workingDir || '/'}</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="drawer-folder-name"
                                type="text"
                                placeholder="Nombre de carpeta"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="h-9 text-xs"
                                disabled={creatingFolder}
                            />
                            <Button size="sm" className="h-9 px-4 shrink-0" disabled={creatingFolder}>
                                {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
                            </Button>
                        </div>
                    </form>

                    {/* Action Block 2: Bulk Upload */}
                    <div className="bg-gray-50 dark:bg-black/15 p-4 rounded-xl border border-gray-200/50 dark:border-gray-900/50 space-y-3">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                            <UploadCloud className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span>Subida Múltiple de Archivos</span>
                        </Label>
                        <div className="relative border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-900/20 transition-colors py-5 text-center cursor-pointer">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 font-medium block">
                                Clic aquí o arrastra archivos para subir
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                                {type === 'Images' ? 'JPG, PNG, GIF, WEBP' : 'PDF, DOC, XLS, PPT, MP3, MP4'}
                            </span>
                        </div>

                        {/* Uploading list */}
                        {uploadingFiles.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-900">
                                {uploadingFiles.map((file, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="truncate max-w-[200px]">{file.name}</span>
                                            <span className="font-semibold">{file.progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
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

                    {/* Action Block 3: Browser List */}
                    <div className="space-y-3">
                        {/* Navigation Breadcrumb */}
                        <div className="flex items-center gap-2 text-xs py-1.5 border-b border-gray-100 dark:border-gray-900">
                            {workingDir && (
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7" 
                                    onClick={handleGoBack}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <div className="flex items-center gap-1 text-gray-500 font-medium truncate">
                                <span>{type === 'Images' ? 'photos' : 'files'}</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                                <span className="text-gray-900 dark:text-white truncate font-semibold">
                                    {workingDir || '/'}
                                </span>
                            </div>
                        </div>

                        {/* Files and Folders list */}
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-xs text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin text-red-600 dark:text-red-500" />
                                <span>Cargando archivos...</span>
                            </div>
                        ) : filteredItems.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredItems.map((item, idx) => {
                                    if (!item.is_file) {
                                        // Directory view
                                        const isSystemFolder = !workingDir || workingDir === '/' || ['1', 'shares'].includes(item.name);
                                        return (
                                            <div key={idx} className="relative group/folder">
                                                <button
                                                    type="button"
                                                    onClick={() => handleFolderClick(item.name)}
                                                    className="w-full flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white hover:border-red-500/40 dark:bg-[#1f1f1e] hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all text-center gap-2 group cursor-pointer"
                                                >
                                                    <Folder className="h-8 w-8 text-amber-500 group-hover:scale-105 transition-transform duration-200" />
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate w-full capitalize">
                                                        {item.name}
                                                    </span>
                                                </button>
                                                {!isSystemFolder && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        type="button"
                                                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover/folder:opacity-100 transition-opacity"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.name); }}
                                                        title="Eliminar carpeta"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    }

                                    // File view
                                    const isImg = isImageFile(item.name);
                                    return (
                                        <div
                                            key={idx}
                                            className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f1f1e] overflow-hidden group shadow-sm flex flex-col"
                                        >
                                            {/* Preview/Icon */}
                                            <div className="aspect-[4/3] bg-gray-50 dark:bg-black/10 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-gray-900">
                                                {isImg ? (
                                                    <img 
                                                        src={item.url} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <FileText className="h-8 w-8 text-blue-500" />
                                                )}
                                            </div>

                                            {/* Info & Copy button */}
                                            <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                                                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate block">
                                                    {item.name}
                                                </span>
                                                
                                                <div className="flex gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-900/50">
                                                    {onSelect && (
                                                        <Button
                                                            size="sm"
                                                            type="button"
                                                            className="w-full text-[9px] h-6 px-1"
                                                            onClick={() => onSelect(item.url)}
                                                        >
                                                            Seleccionar
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        type="button"
                                                        className="h-6 w-6 shrink-0"
                                                        onClick={() => handleCopyUrl(item.url)}
                                                        title="Copiar URL"
                                                    >
                                                        {copiedUrl === item.url ? (
                                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        type="button"
                                                        className="h-6 w-6 shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                        onClick={() => handleDeleteItem(item.name)}
                                                        title="Eliminar elemento"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                                <p className="text-xs text-gray-400 italic">Esta carpeta está vacía.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
