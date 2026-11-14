import { usePage } from '@inertiajs/react';
import { type ComponentType } from 'react';
import ColumnsRender from './columns/render';
import CtaRender from './cta/render';
import FeaturesRender from './features/render';
import FormRender from './form/render';
import GalleryRender from './gallery/render';
import HeroRender from './hero/render';
import ImageRender from './image/render';
import PatternRender from './pattern/render';
import QuoteRender from './quote/render';
import RichTextRender from './rich-text/render';
import SliderRender from './slider/render';
import StatsRender from './stats/render';
import { type BlockRenderProps } from './types';
import VideoRender from './video/render';

/**
 * Public rendering of each block type. Keep the keys in sync with
 * App\Blocks\BlockRegistry::TYPES (a Pest test checks every PHP block has a renderer).
 */
export const BLOCK_RENDERERS: Record<string, ComponentType<BlockRenderProps>> = {
    rich_text: RichTextRender,
    hero: HeroRender,
    image: ImageRender,
    gallery: GalleryRender,
    video: VideoRender,
    cta: CtaRender,
    features: FeaturesRender,
    stats: StatsRender,
    quote: QuoteRender,
    columns: ColumnsRender,
    form: FormRender,
    slider: SliderRender,
    pattern: PatternRender,
};

/**
 * Renderers a theme brings, in resources/themes/{theme}/front/blocks/{key}.tsx: its own
 * block types (declared in its blocks/{key}.json) and its versions of the CMS's blocks.
 */
const THEME_RENDERERS = import.meta.glob<ComponentType<BlockRenderProps>>('../../themes/*/front/blocks/*.tsx', { eager: true, import: 'default' });

/** The renderer of a block type for a theme: the theme's own, else the CMS's */
export function blockRenderer(type: string, theme?: string | null): ComponentType<BlockRenderProps> | undefined {
    return (
        (theme ? THEME_RENDERERS[`../../themes/${theme}/front/blocks/${type}.tsx`] : undefined) ??
        BLOCK_RENDERERS[type] ??
        THEME_RENDERERS[`../../themes/default/front/blocks/${type}.tsx`]
    );
}

/** blockRenderer for the theme of the current site */
export function useBlockRenderer(): (type: string) => ComponentType<BlockRenderProps> | undefined {
    const theme = usePage().props.theme as string | undefined;
    return (type: string) => blockRenderer(type, theme);
}
