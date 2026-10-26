import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { Pagination } from '@/types';
import { CmsTag } from '@/types/models/cms-tag';
import { router, usePage } from '@inertiajs/react';
import { Check, Edit, ExternalLink, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

export default function Index() {
    const { items, filters } = usePage<{ items: Pagination<CmsTag>; filters: { s?: string } }>().props;
    const [search, setSearch] = useState(filters.s ?? '');
    const [newName, setNewName] = useState('');
    const [editing, setEditing] = useState<{ id: number; name: string; slug: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(route('tags.index'), search ? { s: search } : {}, { preserveState: true, replace: true });
        }, 250);
        return () => clearTimeout(timer);
    }, [search]);

    const showErrors = (errors: Record<string, string>) => setError(Object.values(errors)[0] ?? t('Ocurrió un error.'));

    const create = (e: FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setError(null);
        router.post(route('tags.store'), { name: newName }, { preserveScroll: true, onSuccess: () => setNewName(''), onError: showErrors });
    };

    const saveEdit = () => {
        if (!editing || !editing.name.trim()) return;
        setError(null);
        router.put(
            route('tags.update', editing.id),
            { name: editing.name, slug: editing.slug },
            { preserveScroll: true, onSuccess: () => setEditing(null), onError: showErrors },
        );
    };

    const handleEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            setEditing(null);
        }
    };

    const toggleActive = (tag: CmsTag) => {
        router.put(route('tags.update', tag.id), { name: tag.name, active: !tag.active }, { preserveScroll: true, onError: showErrors });
    };

    const destroy = (tag: CmsTag) => {
        const uses = (tag.articles_count ?? 0) + (tag.posts_count ?? 0);
        const message =
            uses > 0
                ? t('":name" se quitará de :count contenido(s). ¿Eliminar la etiqueta?', { name: tag.name, count: uses })
                : t('¿Eliminar la etiqueta ":name"?', { name: tag.name });
        if (window.confirm(message)) {
            router.delete(route('tags.destroy', tag.id), { preserveScroll: true, onError: showErrors });
        }
    };

    return (
        <ModuleLayout>
            <div className="relative space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Buscar etiqueta...')} className="pl-9" />
                    </div>

                    <form onSubmit={create} className="flex w-full gap-2 md:w-auto">
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('Nueva etiqueta')} className="md:w-56" />
                        <Button type="submit" disabled={!newName.trim()} className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            {t('Crear')}
                        </Button>
                    </form>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    {t('Etiqueta')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Slug')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Páginas')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Entradas')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Activa')}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((tag) => {
                                    const isEditing = editing?.id === tag.id;
                                    return (
                                        <tr key={tag.id} className="hover:bg-muted/50 border-b">
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <Input
                                                        autoFocus
                                                        value={editing.name}
                                                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                                        onKeyDown={handleEditKey}
                                                        className="h-8"
                                                        aria-label={t('Nombre')}
                                                    />
                                                ) : (
                                                    <span className="text-foreground inline-flex items-center gap-1.5 font-medium">
                                                        <Tag className="text-muted-foreground h-3.5 w-3.5" />
                                                        {tag.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {isEditing ? (
                                                    <Input
                                                        value={editing.slug}
                                                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                                                        onKeyDown={handleEditKey}
                                                        className="h-8 font-mono text-xs"
                                                        aria-label={t('Slug')}
                                                    />
                                                ) : (
                                                    <a
                                                        href={`/tag/${tag.slug}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 hover:underline"
                                                    >
                                                        /tag/{tag.slug}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">{tag.articles_count ?? 0}</td>
                                            <td className="px-4 py-3 text-center">{tag.posts_count ?? 0}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(tag)}
                                                    title={tag.active ? t('Desactivar') : t('Activar')}
                                                    className="hover:bg-muted inline-flex h-6 w-6 items-center justify-center rounded-full"
                                                >
                                                    {tag.active ? (
                                                        <Check className="text-success h-4 w-4" />
                                                    ) : (
                                                        <X className="text-muted-foreground h-4 w-4" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <Button size="sm" className="h-8" onClick={saveEdit}>
                                                                {t('Guardar')}
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(null)}>
                                                                {t('Cancelar')}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex h-8 items-center gap-1 px-2.5"
                                                                onClick={() => setEditing({ id: tag.id, name: tag.name, slug: tag.slug })}
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                                <span>{t('Renombrar')}</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg"
                                                                onClick={() => destroy(tag)}
                                                                aria-label={t('Eliminar :name', { name: tag.name })}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center italic">
                                        {search
                                            ? t('No hay etiquetas que coincidan con ":search".', { search })
                                            : t('Aún no hay etiquetas. Crea la primera arriba o desde el editor de una página.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.last_page > 1 && <PaginationNav data={items} />}
            </div>
        </ModuleLayout>
    );
}
