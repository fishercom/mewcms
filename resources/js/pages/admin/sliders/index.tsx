import { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Images } from 'lucide-react';
import { PaginationNav } from '@/components/ui/pagination-nav';
import { CmsSlider } from '@/types/models/cms-slider';
import { Pagination } from '@/types';
import { format } from 'date-fns';

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
            router.get(
                route('sliders.index'),
                { s: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el slider "${name}"? This will delete all of its slides.`)) {
            router.delete(route('sliders.destroy', id));
        }
    };

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
                    <div className="w-full md:w-1/3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-450 dark:text-gray-500" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white dark:bg-[#161615] border-zinc-200 dark:border-zinc-800"
                                placeholder="Buscar slider..."
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex justify-end">
                        <Button asChild className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            <Link href={route('sliders.create')}>
                                <Plus className="h-4 w-4" />
                                <span>Crear Slider</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-[#161615]">
                    <table className="w-full text-sm text-left text-zinc-550 dark:text-zinc-400">
                        <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-850">
                            <tr>
                                <th scope="col" className="px-6 py-4">Nombre del Slider</th>
                                <th scope="col" className="px-6 py-4">Clave (Key identifier)</th>
                                <th scope="col" className="px-6 py-4">Descripción</th>
                                <th scope="col" className="px-6 py-4 text-center">Diapositivas</th>
                                <th scope="col" className="px-6 py-4">Configuraciones rápidas</th>
                                <th scope="col" className="px-6 py-4">Última Modificación</th>
                                <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                            {items.data.length > 0 ? (
                                items.data.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                                    >
                                        <th
                                            scope="row"
                                            className="px-6 py-4 font-semibold text-zinc-900 whitespace-nowrap dark:text-white flex items-center gap-2"
                                        >
                                            <Images className="h-4 w-4 text-red-550 dark:text-red-400" />
                                            <span>{item.name}</span>
                                        </th>
                                        <td className="px-6 py-4 font-mono text-xs text-zinc-750 dark:text-zinc-300">
                                            {item.key}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-zinc-400 dark:text-zinc-500 max-w-[200px] truncate">
                                            {item.description || <span className="italic">Sin descripción</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                                {item.slides_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                                {item.settings?.autoplay ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 gap-0.5">
                                                        Autoplay ({item.settings.autoplaySpeed}ms)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500">
                                                        Manual
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 capitalize">
                                                    {item.settings?.effect || 'slide'}
                                                </span>
                                                {item.settings?.loop && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400">
                                                        Loop
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 h-8 px-2.5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                                >
                                                    <Link href={route('sliders.edit', item.id)}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                        <span>Gestionar</span>
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center gap-1 h-8 px-2.5 text-red-650 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
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
