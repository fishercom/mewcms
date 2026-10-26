import { cn } from '@/lib/utils';
import { type CmsMedia, type CmsMediaType } from '@/types/models/cms-media';
import axios from 'axios';
import { FileArchive, FileAudio, FileImage, FileText, FileVideo, type LucideIcon } from 'lucide-react';

export const MEDIA_TYPE_LABELS: Record<CmsMediaType, string> = {
    image: 'Imagen',
    document: 'Documento',
    video: 'Vídeo',
    audio: 'Audio',
    other: 'Archivo',
};

const TYPE_ICONS: Record<CmsMediaType, LucideIcon> = {
    image: FileImage,
    document: FileText,
    video: FileVideo,
    audio: FileAudio,
    other: FileArchive,
};

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface UploadProgress {
    name: string;
    progress: number;
    error?: string;
}

/**
 * Upload files one by one to the library. Reports progress per file and returns the
 * items that were stored; a rejected file keeps its error message in the progress list.
 */
export async function uploadMedia(files: File[], onProgress: (list: UploadProgress[]) => void): Promise<CmsMedia[]> {
    const list: UploadProgress[] = files.map((file) => ({ name: file.name, progress: 0 }));
    const update = (index: number, changes: Partial<UploadProgress>) => {
        list[index] = { ...list[index], ...changes };
        onProgress([...list]);
    };
    onProgress([...list]);

    const stored: CmsMedia[] = [];
    for (const [index, file] of files.entries()) {
        const form = new FormData();
        form.append('file', file);
        try {
            const { data } = await axios.post<CmsMedia>(route('media.store'), form, {
                headers: { Accept: 'application/json' },
                onUploadProgress: (e) => update(index, { progress: Math.round((e.loaded * 100) / (e.total || 1)) }),
            });
            stored.push(data);
            update(index, { progress: 100 });
        } catch (error) {
            const response = axios.isAxiosError(error) ? error.response?.data : null;
            const message = response?.errors?.file?.[0] ?? response?.message ?? 'No se pudo subir el archivo.';
            update(index, { error: message });
        }
    }

    return stored;
}

/** Square preview: the smallest image version, or an icon for other files */
export function MediaThumb({ item, className, iconClassName }: { item: CmsMedia; className?: string; iconClassName?: string }) {
    if (item.type === 'image' && item.thumb_url) {
        return <img src={item.thumb_url} alt={item.alt ?? ''} loading="lazy" className={cn('h-full w-full object-cover', className)} />;
    }
    const Icon = TYPE_ICONS[item.type];
    const extension = item.filename.split('.').pop()?.toUpperCase();
    return (
        <div className={cn('text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1', className)}>
            <Icon className={cn('h-8 w-8', iconClassName)} />
            {extension && <span className="text-[10px] font-semibold tracking-wide">{extension}</span>}
        </div>
    );
}
