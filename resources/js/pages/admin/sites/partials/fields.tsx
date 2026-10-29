import InputError from '@/components/input-error';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { CmsSiteForm, CmsSiteLang, CmsTheme } from '@/types/models/cms-site';
import { Link } from '@inertiajs/react';
import { Check, ImageOff, Trash2, UploadCloud } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface Props {
    data: CmsSiteForm;
    setData: (data: CmsSiteForm) => void;
    errors: Record<string, string>;
    processing: boolean;
    themes: CmsTheme[];
    langs: CmsSiteLang[];
}

const NO_LANG = 'none';

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <section className="border-border bg-card space-y-5 rounded-xl border p-5 shadow-xs">
            <div>
                <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{title}</h3>
                {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
            </div>
            {children}
        </section>
    );
}

export default function SiteFormFields({ data, setData, errors, processing, themes, langs }: Props) {
    const [pickingFavicon, setPickingFavicon] = useState(false);
    return (
        <>
            <Section title={t('Sitio')}>
                <div className="grid gap-2">
                    <Label htmlFor="name">{t('Name')}</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autoFocus
                        autoComplete="off"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        disabled={processing}
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="domains">{t('Dominios')}</Label>
                    <Textarea
                        id="domains"
                        rows={3}
                        placeholder={'www.ejemplo.com\nejemplo.com'}
                        value={data.domains}
                        onChange={(e) => setData({ ...data, domains: e.target.value })}
                        disabled={processing}
                    />
                    <p className="text-muted-foreground text-xs">
                        {t('Uno por línea. Las visitas a estos dominios ven este sitio; un dominio desconocido muestra el sitio por defecto.')}
                    </p>
                    <InputError message={errors.domains || Object.entries(errors).find(([key]) => key.startsWith('domains.'))?.[1]} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="site_url">{t('Site URL')}</Label>
                    <Input
                        id="site_url"
                        type="url"
                        placeholder="https://www.ejemplo.com"
                        value={data.site_url}
                        onChange={(e) => setData({ ...data, site_url: e.target.value })}
                        disabled={processing}
                    />
                    <p className="text-muted-foreground text-xs">{t('La dirección principal, usada en los enlaces a este sitio.')}</p>
                    <InputError message={errors.site_url} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="lang_id">{t('Idioma principal')}</Label>
                    <Select
                        value={data.lang_id || NO_LANG}
                        onValueChange={(value) => setData({ ...data, lang_id: value === NO_LANG ? '' : value })}
                        disabled={processing}
                    >
                        <SelectTrigger id="lang_id">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NO_LANG}>{t('El idioma por defecto del CMS')}</SelectItem>
                            {langs.map((lang) => (
                                <SelectItem key={lang.id} value={lang.id.toString()}>
                                    {lang.name} ({lang.iso})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">{t('Su página de inicio se busca primero en este idioma.')}</p>
                    <InputError message={errors.lang_id} />
                </div>

                <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="default"
                            name="default"
                            checked={Boolean(data.default)}
                            onClick={() => setData({ ...data, default: !data.default })}
                        />
                        <Label htmlFor="default">{t('Sitio por defecto')}</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="active"
                            name="active"
                            checked={Boolean(data.active)}
                            onClick={() => setData({ ...data, active: !data.active })}
                        />
                        <Label htmlFor="active">{t('Active')}</Label>
                    </div>
                </div>
            </Section>

            <Section title={t('Tema')} description={t('Cómo se ve el sitio público. Cada sitio puede usar un tema distinto.')}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label={t('Tema')}>
                    {themes.map((item) => {
                        const selected = item.slug === data.theme;

                        return (
                            <button
                                key={item.slug}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setData({ ...data, theme: item.slug })}
                                disabled={processing}
                                className={cn(
                                    'group bg-background relative overflow-hidden rounded-xl border text-left transition',
                                    selected ? 'border-primary ring-primary/30 ring-2' : 'border-border hover:border-primary/40',
                                )}
                            >
                                <div className="bg-muted aspect-[16/10] w-full overflow-hidden border-b">
                                    {item.screenshot ? (
                                        <img
                                            src={route('themes.screenshot', item.slug)}
                                            alt={item.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover object-top transition group-hover:scale-[1.02]"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-xs">
                                            <ImageOff className="h-6 w-6" />
                                            {t('Sin vista previa')}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-foreground text-sm font-semibold">{item.name}</span>
                                        {item.version && <span className="text-muted-foreground text-[10px]">v{item.version}</span>}
                                    </div>
                                    {item.description && <p className="text-muted-foreground line-clamp-2 text-xs">{item.description}</p>}
                                </div>
                                {selected && (
                                    <span className="bg-primary text-primary-foreground absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full shadow">
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <InputError message={errors.theme} />
                <p className="text-muted-foreground text-xs">
                    {t('Cada tema trae su propio diseño, estilos y scripts.')}{' '}
                    <Link href={route('themes.index')} className="text-primary font-medium hover:underline">
                        {t('Subir o gestionar temas')}
                    </Link>
                </p>
            </Section>

            <Section
                title={t('Buscadores y navegador')}
                description={t('Lo que se muestra en la pestaña del navegador y en los resultados de búsqueda.')}
            >
                <div className="grid gap-2">
                    <Label htmlFor="title">{t('Título del sitio')}</Label>
                    <Input
                        id="title"
                        type="text"
                        maxLength={255}
                        placeholder={data.name}
                        value={data.title}
                        onChange={(e) => setData({ ...data, title: e.target.value })}
                        disabled={processing}
                    />
                    <p className="text-muted-foreground text-xs">{t('Se añade al título de cada página. Vacío usa el nombre del sitio.')}</p>
                    <InputError message={errors.title} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">{t('Descripción')}</Label>
                    <Textarea
                        id="description"
                        rows={3}
                        maxLength={500}
                        value={data.description}
                        onChange={(e) => setData({ ...data, description: e.target.value })}
                        disabled={processing}
                    />
                    <p className="text-muted-foreground text-xs">{t('Para las páginas que no tienen una descripción propia.')}</p>
                    <InputError message={errors.description} />
                </div>

                <div className="grid gap-2">
                    <Label>{t('Favicon')}</Label>
                    {data.favicon ? (
                        <div className="border-border bg-muted/50 flex items-center justify-between gap-4 rounded-lg border p-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="border-border bg-background flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                                    <img src={data.favicon} alt={t('Favicon')} className="max-h-8 max-w-8 object-contain" />
                                </div>
                                <span className="text-muted-foreground truncate text-xs" title={data.favicon}>
                                    {data.favicon}
                                </span>
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                                <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setPickingFavicon(true)}>
                                    {t('Cambiar')}
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                    aria-label={t('Quitar')}
                                    onClick={() => setData({ ...data, favicon: '' })}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPickingFavicon(true)}
                            className="group border-border hover:border-primary/40 hover:bg-muted/30 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors"
                        >
                            <UploadCloud className="text-muted-foreground group-hover:text-primary mb-2 h-7 w-7 transition-colors" />
                            <span className="text-foreground text-xs font-semibold">{t('Seleccionar favicon')}</span>
                            <span className="text-muted-foreground mt-1 text-[10px]">
                                {t('Una imagen cuadrada (PNG, SVG o ICO). Sin favicon se usa el de MewCMS.')}
                            </span>
                        </button>
                    )}
                    <InputError message={errors.favicon} />
                </div>
            </Section>

            <Section
                title={t('Scripts')}
                description={t(
                    'Código de servicios externos como Google Analytics, Tag Manager o un píxel. Se añade a las páginas públicas de este sitio, nunca al admin.',
                )}
            >
                <div className="grid gap-2">
                    <Label htmlFor="head_scripts">{t('En <head>')}</Label>
                    <Textarea
                        id="head_scripts"
                        rows={5}
                        spellCheck={false}
                        className="font-mono text-xs"
                        placeholder={'<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>'}
                        value={data.head_scripts}
                        onChange={(e) => setData({ ...data, head_scripts: e.target.value })}
                        disabled={processing}
                    />
                    <p className="text-muted-foreground text-xs">{t('Analytics, Tag Manager, verificación de buscadores.')}</p>
                    <InputError message={errors.head_scripts} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="body_scripts">{t('Al final de <body>')}</Label>
                    <Textarea
                        id="body_scripts"
                        rows={5}
                        spellCheck={false}
                        className="font-mono text-xs"
                        value={data.body_scripts}
                        onChange={(e) => setData({ ...data, body_scripts: e.target.value })}
                        disabled={processing}
                    />
                    <p className="text-muted-foreground text-xs">{t('Chats, píxeles y el <noscript> de Tag Manager.')}</p>
                    <InputError message={errors.body_scripts} />
                </div>
            </Section>

            <QuickMediaDrawer
                isOpen={pickingFavicon}
                onClose={() => setPickingFavicon(false)}
                onSelect={(url) => {
                    setData({ ...data, favicon: url });
                    setPickingFavicon(false);
                }}
                initialType="Images"
            />
        </>
    );
}
