import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { Pagination } from '@/types';
import { CmsForm } from '@/types/models/cms-form';
import { Input } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import { Check, Copy, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsForm> }>().props;
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const filteredItems = items.data.filter(
        (item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.alias.toLowerCase().includes(search.toLowerCase()),
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
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="flex w-full gap-3 md:w-3/4">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-zinc-400" />
                            </div>
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full rounded-md border border-gray-300 bg-transparent p-2 pl-10 text-sm text-zinc-800 focus-within:outline-2 focus-within:outline-gray-400 dark:border-zinc-800 dark:text-zinc-200"
                                placeholder="Buscar formulario..."
                            />
                        </div>
                    </div>

                    <div className="flex w-full justify-end md:w-auto">
                        <Button
                            asChild
                            className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Link href={route('forms.create')}>
                                <Plus className="h-4 w-4" />
                                <span>Crear Formulario</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-100 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Nombre
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Alias
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Shortcode (Copiar)
                                </th>
                                <th scope="col" className="px-6 py-3 text-center">
                                    Campos
                                </th>
                                <th scope="col" className="px-6 py-3 text-center">
                                    Estado
                                </th>
                                <th scope="col" className="px-6 py-3 text-right">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="dark:border-zinc-850 border-b bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                                    >
                                        <td className="px-6 py-4 font-semibold text-gray-900 capitalize dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">{item.alias}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleCopyShortcode(item.alias, item.id)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-xs text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
                                        <td className="px-6 py-4 text-center font-medium">{item.fields_count ?? 0}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                                    item.active
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                                                }`}
                                            >
                                                {item.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="space-x-2 px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link
                                                    href={route('forms.edit', item.id)}
                                                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                            >
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
