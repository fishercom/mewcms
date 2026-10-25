import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsPostType } from '@/types/models/cms-post';
import { Input } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import { BookOpen, Check, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsPostType> }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s !== undefined) {
            router.get(
                route('post-types.index'),
                { s: query.s },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery({ s: e.target.value });
    };

    const handleDelete = (id: number, name: string) => {
        if (
            window.confirm(
                `¿Estás seguro de que deseas eliminar el tipo de contenido "${name}"? Se eliminarán todas las entradas y módulos del menú asociados.`,
            )
        ) {
            router.delete(route('post-types.destroy', id), {
                preserveScroll: true,
                onError: () => alert('Ocurrió un error al eliminar el tipo de contenido.'),
            });
        }
    };

    // Helper to render Lucide icon by name
    const renderIcon = (iconName: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IconComponent = (LucideIcons as any)[iconName];
        if (IconComponent) {
            return <IconComponent className="text-muted-foreground h-4 w-4" />;
        }
        return <BookOpen className="text-muted-foreground h-4 w-4" />;
    };

    return (
        <ModuleLayout>
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="text-muted-foreground h-4 w-4" />
                                </div>
                                <Input
                                    type="text"
                                    autoFocus
                                    value={query.s ?? ''}
                                    onChange={handleSearch}
                                    className="border-border text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                                    placeholder="Buscar tipo de contenido..."
                                />
                            </div>
                        </form>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                            <Link href="/admin/post-types/create">
                                <Plus className="h-4 w-4" />
                                <span>Nuevo Tipo de Contenido</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Nombre
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Slug (Prefijo URL)
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Plantilla Predefinida
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Descripción
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    Activo
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    Creado
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item: CmsPostType) => (
                                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                                        <td className="text-foreground flex items-center gap-2.5 px-4 py-3 font-semibold">
                                            {renderIcon(item.icon)}
                                            <span>{item.name}</span>
                                        </td>
                                        <td className="text-primary px-4 py-3 font-mono text-xs">/{item.slug}</td>
                                        <td className="text-muted-foreground px-4 py-3">
                                            {item.default_schema ? (
                                                item.default_schema.name
                                            ) : (
                                                <em className="text-muted-foreground text-xs">Ninguna</em>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground max-w-xs truncate px-4 py-3">{item.description || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {item.active ? (
                                                <span className="bg-success-soft text-success inline-flex items-center justify-center rounded-full p-1">
                                                    <Check className="h-3.5 w-3.5" />
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Inactivo</span>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 text-center">
                                            {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => router.visit(route('post-types.edit', item.id))}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    <span>Editar</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg"
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center italic">
                                        No se encontraron tipos de contenido.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.last_page > 1 && (
                    <div className="pt-4">
                        <PaginationNav data={items} />
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
