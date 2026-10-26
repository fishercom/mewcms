import FrontSlider from '@/components/front-slider';
import { type CmsSlider } from '@/types/models/cms-slider';
import { GalleryHorizontal } from 'lucide-react';
import { type BlockRenderProps, str } from '../types';

export default function SliderRender({ data, editing }: BlockRenderProps) {
    // "slider" (with its slides) is added by the server when the page is rendered
    const slider = data.slider as unknown as CmsSlider | null | undefined;

    if (editing || !slider) {
        return str(data.key) ? (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#19140035] p-6 text-sm text-[#706f6c] dark:border-[#3E3E3A]">
                <GalleryHorizontal className="h-5 w-5" />
                Slider «{str(data.key)}»{editing ? ': se muestra en la página publicada.' : ' no encontrado.'}
            </div>
        ) : null;
    }

    return <FrontSlider slider={slider} />;
}
