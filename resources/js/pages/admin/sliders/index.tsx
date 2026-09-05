import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsSlider } from '@/types/models/cms-slider';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Edit, Images, Plus, Search, Trash2 } from 'lucide-react';
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
        if (window.confirm(`¿Estás seguro de que deseas eliminar el slider "${name}"? This will delete all of its slides.`)) {
            router.delete(route('sliders.destroy', id));
        }
    };

    return (
        <ModuleLayout>
            <div className="relative space-y-4 overflow-hidden">
                <div className="flex flex-col items-center justify-between gap-4 pb-2 md:flex-row">
                    <div className="w-full md:w-1/3">
                        <div className="relative">
                            <Search className="text-gray-450 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 dark:text-gray-500" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-zinc-200 bg-white pl-9 dark:border-zinc-800 dark:bg-[#161615]"
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

                <div className="dark:border-zinc-850 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:bg-[#161615]">
                    <table className="text-zinc-550 w-full text-left text-sm dark:text-zinc-400">
                        <thead className="dark:border-zinc-850 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-700 uppercase dark:bg-zinc-900/50 dark:text-zinc-400">
                            <tr>
                                <th scope="col" className="px-6 py-4">
                                    Nombre del Slider
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Clave (Key identifier)
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Descripción
                                </th>
                                <th scope="col" className="px-6 py-4 text-center">
                                    Diapositivas
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Configuraciones rápidas
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Última Modificación
                                </th>
                                <th scope="col" className="px-6 py-4 text-right">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="dark:divide-zinc-850 divide-y divide-zinc-200">
                            {items.data.length > 0 ? (
                                items.data.map((item) => (
                                    <tr key={item.id} className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                        <th
                                            scope="row"
                                            className="flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap text-zinc-900 dark:text-white"
                                        >
                                            <Images className="text-red-550 h-4 w-4 dark:text-red-400" />
                                            <span>{item.name}</span>
                                        </th>
                                        <td className="text-zinc-750 px-6 py-4 font-mono text-xs dark:text-zinc-300">{item.key}</td>
                                        <td className="max-w-[200px] truncate px-6 py-4 text-xs text-zinc-400 dark:text-zinc-500">
                                            {item.description || <span className="italic">Sin descripción</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold">
                                            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                                {item.slides_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex max-w-[220px] flex-wrap gap-1.5">
                                                {item.settings?.autoplay ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                                                        Autoplay ({item.settings.autoplaySpeed}ms)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded bg-zinc-50 px-1.5 py-0.5 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                                                        Manual
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 capitalize dark:bg-blue-950/20 dark:text-blue-400">
                                                    {item.settings?.effect || 'slide'}
                                                </span>
                                                {item.settings?.loop && (
                                                    <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400">
                                                        Loop
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 border-zinc-200 px-2.5 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                                                >
                                                    <Link href={route('sliders.edit', item.id)}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                        <span>Gestionar</span>
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-650 flex h-8 items-center gap-1 px-2.5 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
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
                                    <td colSpan={7} className="px-6 py-10 text-center text-zinc-400 italic">
                                        No se encontraron sliders. ¡Crea el primero!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.links && (
                    <div className="pt-2">
                        <PaginationNav data={items} />
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
