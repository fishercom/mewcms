import { SOCIAL_NETWORKS, SocialIcon, socialNetwork, type SocialLink } from '@/components/social-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';
import { GripVertical, Plus, Share2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

export interface SocialLinkRow extends SocialLink {
    id: string;
}

let nextId = 0;
export const toSocialRows = (links: SocialLink[]): SocialLinkRow[] => links.map((link) => ({ ...link, label: link.label ?? '', id: `s${nextId++}` }));

interface Props {
    links: SocialLinkRow[];
    onChange: (links: SocialLinkRow[]) => void;
    errors: Record<string, string>;
}

export default function SocialLinksEditor({ links, onChange, errors }: Props) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const urlInputs = useRef<Record<string, HTMLInputElement | null>>({});
    // Row whose address field gets the focus once the picker has closed
    const focusRow = useRef<string | null>(null);

    const update = (id: string, changes: Partial<SocialLink>) => onChange(links.map((link) => (link.id === id ? { ...link, ...changes } : link)));

    const add = (network: string) => {
        const row = toSocialRows([{ network, url: '', label: '' }])[0];
        onChange([...links, row]);
        focusRow.current = row.id;
        setPickerOpen(false);
    };

    // Focus a newly added row right away, without waiting for the picker's closing animation
    useEffect(() => {
        if (focusRow.current) urlInputs.current[focusRow.current]?.focus();
    }, [links]);

    const used = new Set(links.map((link) => link.network));

    const picker = (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t('Añadir enlace')}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                side="bottom"
                className="w-[min(25rem,calc(100vw-2rem))] p-2"
                onCloseAutoFocus={(e) => {
                    // The new row already has the focus; don't hand it back to the button
                    if (focusRow.current) {
                        e.preventDefault();
                        focusRow.current = null;
                    }
                }}
            >
                <p className="text-muted-foreground px-1.5 pt-0.5 pb-2 text-xs">{t('Elige una red o un tipo de enlace')}</p>
                <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
                    {SOCIAL_NETWORKS.map((network) => (
                        <button
                            key={network.id}
                            type="button"
                            onClick={() => add(network.id)}
                            className="hover:bg-primary-soft hover:text-primary-soft-foreground focus-visible:ring-primary/40 text-foreground relative flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-[11px] leading-tight transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <SocialIcon network={network.id} className="h-5 w-5" />
                            <span className="text-center">{network.name}</span>
                            {used.has(network.id) && (
                                <span className="bg-primary absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" title={t('Ya añadido')} />
                            )}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );

    if (links.length === 0) {
        return (
            <div className="border-border/80 bg-muted/20 flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
                <div className="bg-primary-soft text-primary-soft-foreground mb-3 flex h-11 w-11 items-center justify-center rounded-xl">
                    <Share2 className="h-5 w-5" />
                </div>
                <p className="text-foreground text-sm font-semibold">{t('Aún no hay enlaces')}</p>
                <p className="text-muted-foreground mt-1 mb-4 max-w-xs text-xs">
                    {t('Añade tus redes sociales, un correo o un teléfono. Se mostrarán como íconos en el pie de página del sitio.')}
                </p>
                {picker}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <ReactSortable list={links} setList={onChange} handle=".social-drag" animation={150} ghostClass="opacity-40" className="space-y-2">
                {links.map((link, index) => {
                    const network = socialNetwork(link.network);
                    const urlError = errors[`social_links.${index}.url`];
                    const labelError = errors[`social_links.${index}.label`];
                    return (
                        <div
                            key={link.id}
                            className="border-border bg-card flex flex-wrap items-start gap-2 rounded-lg border p-2 sm:flex-nowrap"
                            data-testid="social-row"
                        >
                            <button
                                type="button"
                                className="social-drag text-muted-foreground hover:text-foreground hover:bg-muted flex h-9 w-6 shrink-0 cursor-grab items-center justify-center rounded active:cursor-grabbing"
                                aria-label={`Mover ${network.name}`}
                                title={t('Arrastra para ordenar')}
                            >
                                <GripVertical className="h-4 w-4" />
                            </button>

                            <Select value={link.network} onValueChange={(value) => update(link.id, { network: value })}>
                                <SelectTrigger className="h-9 min-w-0 flex-1 text-xs sm:w-44 sm:flex-none" aria-label={t('Red')}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOCIAL_NETWORKS.map((option) => (
                                        <SelectItem key={option.id} value={option.id} className="text-xs">
                                            <SocialIcon network={option.id} className="h-4 w-4" />
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive order-none h-9 w-9 shrink-0 rounded-lg sm:order-last"
                                onClick={() => onChange(links.filter((row) => row.id !== link.id))}
                                aria-label={t('Eliminar :name', { name: network.name })}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            <div className="min-w-0 flex-[1_1_14rem]">
                                <Input
                                    ref={(el) => {
                                        urlInputs.current[link.id] = el;
                                    }}
                                    value={link.url}
                                    onChange={(e) => update(link.id, { url: e.target.value })}
                                    placeholder={network.placeholder}
                                    inputMode={network.id === 'phone' ? 'tel' : network.id === 'email' ? 'email' : 'url'}
                                    aria-label={t('Enlace de :name', { name: network.name })}
                                    aria-invalid={!!urlError}
                                    className="h-9 text-xs"
                                />
                                {urlError && <p className="text-destructive mt-1 text-[11px]">{urlError}</p>}
                            </div>

                            <div className="min-w-0 flex-[1_1_9rem] sm:max-w-44">
                                <Input
                                    value={link.label}
                                    onChange={(e) => update(link.id, { label: e.target.value })}
                                    placeholder={`Texto (${network.name})`}
                                    maxLength={60}
                                    aria-label={t('Texto alternativo de :name', { name: network.name })}
                                    className="h-9 text-xs"
                                />
                                {labelError && <p className="text-destructive mt-1 text-[11px]">{labelError}</p>}
                            </div>
                        </div>
                    );
                })}
            </ReactSortable>

            <div className="flex flex-wrap items-center justify-between gap-2">
                {picker}
                <p className="text-muted-foreground text-[11px]">{t('Arrastra los enlaces para cambiar el orden en el pie de página.')}</p>
            </div>
        </div>
    );
}
