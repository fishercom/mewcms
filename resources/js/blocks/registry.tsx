import { type ComponentType } from 'react';
import CtaRender from './cta/render';
import HeroRender from './hero/render';
import ImageRender from './image/render';
import RichTextRender from './rich-text/render';
import { type BlockRenderProps } from './types';

/**
 * Public rendering of each block type. Keep the keys in sync with
 * App\Blocks\BlockRegistry::TYPES (a Pest test checks every PHP block has a renderer).
 */
export const BLOCK_RENDERERS: Record<string, ComponentType<BlockRenderProps>> = {
    rich_text: RichTextRender,
    hero: HeroRender,
    image: ImageRender,
    cta: CtaRender,
};
