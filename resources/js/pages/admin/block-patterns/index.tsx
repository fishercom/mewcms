import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { Pagination } from '@/types';
import { CmsBlockPattern } from '@/types/models/cms-block-pattern';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Blocks, Copy, Edit, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Index() {
    const { items, categories } = usePage<{ items: Pagination<CmsBlockPattern>; categories: Record<string, string> }>().props;
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(route('block-patterns.index'), { s: searchTerm }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(t('¿Eliminar el bloque reutilizable ":name"? Las páginas que lo usen sincronizado dejarán de mostrarlo.', { name }))) {
            router.delete(route('block-patterns.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <ModuleLayout>
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="text-muted-foreground h-4 w-4" />
                            </div>
                            <Input
                                type="text"
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-border text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                                placeholder={t('Buscar bloque reutilizable...')}
                            />
                        </div>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                            <Link href={route('block-patterns.create')}>
                                <Plus className="h-4 w-4" />
                                <span>{t('Nuevo bloque')}</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    {t('Nombre')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Clave')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Categoría')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Bloques')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Modo')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Actualizado')}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                                        <td className="text-foreground px-4 py-3 font-semibold">
                                            <div className="flex items-center gap-2.5">
                                                <Blocks className="text-muted-foreground h-4 w-4" />
                                                <div className="min-w-0">
                                                    <div>{item.name}</div>
                                                    {item.description && (
                                                        <div className="text-muted-foreground max-w-xs truncate text-xs font-normal">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-primary px-4 py-3 font-mono text-xs">{item.key}</td>
                                        <td className="px-4 py-3">{categories[item.category] ?? item.category}</td>
                                        <td className="px-4 py-3 text-center">{item.blocks?.length ?? 0}</td>
                                        <td className="px-4 py-3">
                                            {item.synced ? (
                                                <span className="bg-primary-soft text-primary-soft-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                                                    <RefreshCw className="h-3 w-3" />
                                                    {t('Sincronizado')}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                                                    <Copy className="h-3 w-3" />
                                                    {t('Copia')}
                                                </span>
                                            )}
                                            {!item.active && <span className="text-muted-foreground ml-2 text-xs">({t('inactivo')})</span>}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 text-center">
                                            {item.updated_at ? format(new Date(item.updated_at), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => router.visit(route('block-patterns.edit', item.id))}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    <span>{t('Editar')}</span>
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
                                        {t('Aún no hay bloques reutilizables. Crea uno o guarda un bloque desde el editor de una página.')}
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
