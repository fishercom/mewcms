import { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import { CmsForm } from '@/types/models/cms-form';
import { Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, Plus, Edit, Trash2, Copy, Check } from 'lucide-react';
import { Input } from '@headlessui/react';
import { PaginationNav } from '@/components/ui/pagination-nav';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsForm> }>().props;
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const filteredItems = items.data.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.alias.toLowerCase().includes(search.toLowerCase())
    );

    const handleCopyShortcode = (alias: string, id: number) => {
        const shortcode = `[form alias="${alias}"]`;
        navigator.clipboard.writeText(shortcode).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el formulario "${name}"?`)) {
            router.delete(route('forms.destroy', id));
        }
    };

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 pb-4">
                    <div className="w-full md:w-3/4 flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="focus-within:outline-2 focus-within:outline-gray-400 border border-gray-300 dark:border-zinc-800 text-sm rounded-md block w-full pl-10 p-2 bg-transparent text-zinc-800 dark:text-zinc-200"
                                placeholder="Buscar formulario..."
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex justify-end">
                        <Button asChild className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            <Link href={route('forms.create')}>
                                <Plus className="h-4 w-4" />
                                <span>Crear Formulario</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Alias</th>
                                <th scope="col" className="px-6 py-3">Shortcode (Copiar)</th>
                                <th scope="col" className="px-6 py-3 text-center">Campos</th>
                                <th scope="col" className="px-6 py-3 text-center">Estado</th>
                                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="bg-white border-b dark:bg-zinc-900 dark:border-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white capitalize">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                                            {item.alias}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleCopyShortcode(item.alias, item.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-xs font-mono text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
                                            >
                                                {copiedId === item.id ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-green-600" />
                                                        <span className="text-green-600">¡Copiado!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        <span>[form alias="{item.alias}"]</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {item.fields_count ?? 0}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                                                item.active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}>
                                                {item.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('forms.edit', item.id)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, item.name)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                                        No se encontraron formularios.
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
