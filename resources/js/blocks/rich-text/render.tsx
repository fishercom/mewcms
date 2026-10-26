import ContentRenderer from '@/components/content-renderer';
import { useContext } from 'react';
import { BlockTextContext, str, type BlockRenderProps } from '../types';

export default function RichTextRender({ data }: BlockRenderProps) {
    const textClassName = useContext(BlockTextContext);
    const html = str(data.html);
    if (html.trim() === '') return null;

    return <ContentRenderer html={html} className={textClassName || 'leading-relaxed'} />;
}
