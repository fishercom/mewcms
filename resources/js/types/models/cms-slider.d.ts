export interface CmsSlide {
    id?: number | string;
    slider_id?: number;
    title: string | null;
    caption: string | null;
    image_url: string;
    /** Shown instead of image_url on phones */
    image_mobile_url?: string | null;
    /** Plays instead of the image (which is its poster then) */
    video_url?: string | null;
    /** A second picture laid over the slide: a cut-out, an icon or a logo */
    secondary_image_url?: string | null;
    link_url: string | null;
    /** The text of the slide's button (link_url is where it goes) */
    button_label?: string | null;
    /** The slide's picture is light: the theme writes its text in a dark colour */
    dark_text?: boolean;
    position: number;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CmsSlider {
    id: number;
    name: string;
    key: string;
    description: string | null;
    settings: {
        autoplay: boolean;
        autoplaySpeed: number;
        transitionSpeed: number;
        effect: 'fade' | 'slide';
        loop: boolean;
        dots: boolean;
        arrows: boolean;
    };
    slides_count?: number;
    slides?: CmsSlide[];
    created_at: string;
    updated_at: string;
}
