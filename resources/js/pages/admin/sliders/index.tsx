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
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <Input
                                type="text"
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 bg-transparent p-2 pl-10 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                                placeholder="Buscar slider..."
                            />
                        </div>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        <Button
                            asChild
                            className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Link href={route('sliders.create')}>
                                <Plus className="h-4 w-4" />
                                <span>Crear Slider</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
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
                                    <tr key={item.id} className="border-b hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-gray-800/20">
                                        <th scope="row" className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            <Link href={route('sliders.edit', item.id)} className="hover:underline">
                                                {item.name}
                                            </Link>
                                            <div className="font-mono text-[11px] font-normal text-zinc-400">{item.key}</div>
                                        </th>
                                        <td className="px-4 py-3 text-center">{item.slides_count || 0}</td>
                                        <td className="hidden px-4 py-3 xl:table-cell">
                                            <div className="flex max-w-[160px] flex-wrap gap-1">
                                                <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                                                    {item.settings?.autoplay ? `Autoplay ${item.settings.autoplaySpeed}ms` : 'Manual'}
                                                </span>
                                                <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-800 capitalize dark:bg-zinc-800 dark:text-zinc-300">
                                                    {item.settings?.effect || 'slide'}
                                                </span>
                                                {item.settings?.loop && (
                                                    <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
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
                                                    className="flex h-8 items-center gap-1 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
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
                                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 italic">
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
