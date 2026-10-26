import { Globe, Link2, Mail, Phone, type LucideIcon } from 'lucide-react';
import type { IconType } from 'react-icons';
import {
    FaBehance,
    FaDiscord,
    FaDribbble,
    FaFacebook,
    FaGithub,
    FaInstagram,
    FaLinkedin,
    FaPinterest,
    FaSpotify,
    FaTelegram,
    FaThreads,
    FaTiktok,
    FaWhatsapp,
    FaXTwitter,
    FaYoutube,
} from 'react-icons/fa6';

export interface SocialLink {
    network: string;
    url: string;
    label: string;
}

export interface SocialNetwork {
    id: string;
    name: string;
    icon: IconType | LucideIcon;
    placeholder: string;
    /** Accepts a bare address/number instead of a URL */
    plain?: boolean;
}

// Keep the ids in sync with App\Support\SocialLinks::NETWORKS
export const SOCIAL_NETWORKS: SocialNetwork[] = [
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, placeholder: 'https://facebook.com/usuario' },
    { id: 'instagram', name: 'Instagram', icon: FaInstagram, placeholder: 'https://instagram.com/usuario' },
    { id: 'x', name: 'X (Twitter)', icon: FaXTwitter, placeholder: 'https://x.com/usuario' },
    { id: 'tiktok', name: 'TikTok', icon: FaTiktok, placeholder: 'https://tiktok.com/@usuario' },
    { id: 'youtube', name: 'YouTube', icon: FaYoutube, placeholder: 'https://youtube.com/@canal' },
    { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, placeholder: 'https://linkedin.com/company/empresa' },
    { id: 'whatsapp', name: 'WhatsApp', icon: FaWhatsapp, placeholder: 'https://wa.me/51999999999' },
    { id: 'telegram', name: 'Telegram', icon: FaTelegram, placeholder: 'https://t.me/usuario' },
    { id: 'threads', name: 'Threads', icon: FaThreads, placeholder: 'https://threads.net/@usuario' },
    { id: 'pinterest', name: 'Pinterest', icon: FaPinterest, placeholder: 'https://pinterest.com/usuario' },
    { id: 'github', name: 'GitHub', icon: FaGithub, placeholder: 'https://github.com/usuario' },
    { id: 'discord', name: 'Discord', icon: FaDiscord, placeholder: 'https://discord.gg/invitacion' },
    { id: 'spotify', name: 'Spotify', icon: FaSpotify, placeholder: 'https://open.spotify.com/artist/…' },
    { id: 'behance', name: 'Behance', icon: FaBehance, placeholder: 'https://behance.net/usuario' },
    { id: 'dribbble', name: 'Dribbble', icon: FaDribbble, placeholder: 'https://dribbble.com/usuario' },
    { id: 'email', name: 'Email', icon: Mail, placeholder: 'contacto@tusitio.com', plain: true },
    { id: 'phone', name: 'Teléfono', icon: Phone, placeholder: '+51 999 999 999', plain: true },
    { id: 'website', name: 'Sitio web', icon: Globe, placeholder: 'https://tusitio.com' },
    { id: 'custom', name: 'Personalizado', icon: Link2, placeholder: 'https://…' },
];

export const socialNetwork = (id: string): SocialNetwork => SOCIAL_NETWORKS.find((n) => n.id === id) ?? SOCIAL_NETWORKS[SOCIAL_NETWORKS.length - 1];

/** The visible name of a link: its own label, else the network name */
export const socialLinkName = (link: SocialLink): string => link.label?.trim() || socialNetwork(link.network).name;

export const isExternalLink = (url: string): boolean => /^https?:\/\//i.test(url);

export function SocialIcon({ network, className }: { network: string; className?: string }) {
    const Icon = socialNetwork(network).icon;
    return <Icon className={className} aria-hidden="true" />;
}
