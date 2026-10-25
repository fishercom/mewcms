import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsSlider } from '@/types/models/cms-slider';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsSlider> }>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (debouncedSearch !== undefined) {
            router.get(route('sliders.index'), { s: debouncedSearch }, { preserveState: true, replace: true });
        }
    }, [debouncedSearch]);

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el slider "${name}"? Se eliminarán también sus diapositivas.`)) {
            router.delete(route('sliders.destroy', id));
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
                                placeholder="Buscar slider..."
                            />
                        </div>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                            <Link href={route('sliders.create')}>
                                <Plus className="h-4 w-4" />
                                <span>Crear Slider</span>
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
                                <th scope="col" className="px-4 py-3 text-center">
                                    Diapositivas
                                </th>
                                <th scope="col" className="hidden px-4 py-3 xl:table-cell">
                                    Configuración
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Actualizado
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length > 0 ? (
                                items.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium">
                                            <Link href={route('sliders.edit', item.id)} className="hover:underline">
                                                {item.name}
                                            </Link>
                                            <div className="text-muted-foreground font-mono text-[11px] font-normal">{item.key}</div>
                                        </th>
                                        <td className="px-4 py-3 text-center">{item.slides_count || 0}</td>
                                        <td className="hidden px-4 py-3 xl:table-cell">
                                            <div className="flex max-w-[160px] flex-wrap gap-1">
                                                <span className="bg-muted text-foreground inline-flex items-center rounded px-2 py-0.5 text-[10px]">
                                                    {item.settings?.autoplay ? `Autoplay ${item.settings.autoplaySpeed}ms` : 'Manual'}
                                                </span>
                                                <span className="bg-muted text-foreground inline-flex items-center rounded px-2 py-0.5 text-[10px] capitalize">
                                                    {item.settings?.effect || 'slide'}
                                                </span>
                                                {item.settings?.loop && (
                                                    <span className="bg-muted text-foreground inline-flex items-center rounded px-2 py-0.5 text-[10px]">
                                                        Loop
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => router.visit(route('sliders.edit', item.id))}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    <span>Editar</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Eliminar</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center italic">
                                        No se encontraron sliders.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.links && <PaginationNav data={items} />}
            </div>
        </ModuleLayout>
    );
}
