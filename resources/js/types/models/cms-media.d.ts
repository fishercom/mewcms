export type CmsMediaType = 'image' | 'document' | 'video' | 'audio' | 'other';

export interface CmsMedia {
    id: number;
    disk: string;
    path: string;
    filename: string;
    mime: string | null;
    size: number;
    width: number | null;
    height: number | null;
    alt: string | null;
    caption: string | null;
    title: string | null;
    variants: Record<string, string> | null;
    url: string;
    thumb_url: string | null;
    type: CmsMediaType;
    uploader?: { id: number; name: string } | null;
    created_at: string;
    deleted_at?: string | null;
}
