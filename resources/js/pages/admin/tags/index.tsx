import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
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

    const showErrors = (errors: Record<string, string>) => setError(Object.values(errors)[0] ?? 'Ocurrió un error.');

    const create = (e: FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setError(null);
        router.post(
            route('tags.store'),
            { name: newName },
            { preserveScroll: true, onSuccess: () => setNewName(''), onError: showErrors },
        );
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
        const message = uses > 0 ? `"${tag.name}" se quitará de ${uses} contenido(s). ¿Eliminar la etiqueta?` : `¿Eliminar la etiqueta "${tag.name}"?`;
        if (window.confirm(message)) {
            router.delete(route('tags.destroy', tag.id), { preserveScroll: true, onError: showErrors });
        }
    };

    return (
        <ModuleLayout>
            <div className="relative space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar etiqueta..." className="pl-9" />
                    </div>

                    <form onSubmit={create} className="flex w-full gap-2 md:w-auto">
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nueva etiqueta" className="md:w-56" />
                        <Button type="submit" disabled={!newName.trim()} className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Crear
                        </Button>
                    </form>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Etiqueta
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Slug
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    Páginas
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    Entradas
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    Activa
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((tag) => {
                                    const isEditing = editing?.id === tag.id;
                                    return (
                                        <tr key={tag.id} className="border-b hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-gray-800/20">
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <Input
                                                        autoFocus
                                                        value={editing.name}
                                                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                                        onKeyDown={handleEditKey}
                                                        className="h-8"
                                                        aria-label="Nombre"
                                                    />
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                                                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
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
                                                        aria-label="Slug"
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
                                                    title={tag.active ? 'Desactivar' : 'Activar'}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted"
                                                >
                                                    {tag.active ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <Button size="sm" className="h-8" onClick={saveEdit}>
                                                                Guardar
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(null)}>
                                                                Cancelar
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
                                                                <span>Renombrar</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                                                onClick={() => destroy(tag)}
                                                                aria-label={`Eliminar ${tag.name}`}
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
                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 italic">
                                        {search ? `No hay etiquetas que coincidan con "${search}".` : 'Aún no hay etiquetas. Crea la primera arriba o desde el editor de una página.'}
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
