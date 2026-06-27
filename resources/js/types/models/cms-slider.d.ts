export interface CmsSlide {
    id?: number | string;
    slider_id?: number;
    title: string | null;
    caption: string | null;
    image_url: string;
    link_url: string | null;
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
