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
