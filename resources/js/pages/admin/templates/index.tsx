import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModuleLayout from '@/layouts/module/layout';
import { deleteTemplate } from '@/services/templates';
import { Link, router, usePage } from '@inertiajs/react';
import { Edit, FileCode, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TemplateItem {
    name: string;
    value: string;
    file: string;
}

export default function Index() {
    const { items = [] } = usePage<{ items: TemplateItem[] }>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isCoreTemplate = (file: string) => {
        const base = file.replace('.tsx', '');
        return ['home', 'page', 'post', 'term-list'].includes(base);
    };

    const handleDelete = (file: string) => {
        setErrorMessage(null);
        deleteTemplate(file, (err) => {
            setErrorMessage(err);
        });
    };

    const filteredItems = items.filter(
        (item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.file.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <ModuleLayout>
            <div className="relative space-y-4 overflow-hidden">
                {errorMessage && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                        {errorMessage}
                    </div>
                )}

                <div className="flex flex-col items-center justify-between gap-4 pb-2 md:flex-row">
                    <div className="w-full md:w-1/3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white pl-9 dark:bg-[#161615]"
                                placeholder="Buscar plantilla..."
                            />
                        </div>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        <Button
                            asChild
                            className="flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            <Link href="/admin/templates/create">
                                <Plus className="h-4 w-4" />
                                <span>Crear Plantilla</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#161615]">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-700 uppercase dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-4">
                                    Nombre de la Plantilla
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Nombre del Archivo
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Directorio / Ruta
                                </th>
                                <th scope="col" className="px-6 py-4">
                                    Tipo
                                </th>
                                <th scope="col" className="px-6 py-4 text-right">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const isCore = isCoreTemplate(item.file);
                                    return (
                                        <tr key={item.file} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                            <th
                                                scope="row"
                                                className="flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap text-gray-900 dark:text-white"
                                            >
                                                <FileCode className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                <span>{item.name}</span>
                                            </th>
                                            <td className="px-6 py-4 font-mono text-xs">{item.file}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-400 dark:text-gray-500">{item.value}</td>
                                            <td className="px-6 py-4">
                                                {isCore ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-gray-100 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                    >
                                                        Sistema
                                                    </Badge>
                                                ) : (
                                                    <Badge className="border-amber-200 bg-amber-100 font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                                                        Personalizado
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="flex items-center justify-end gap-2 px-6 py-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => router.visit(route('templates.edit', item.file))}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    <span>Editar</span>
                                                </Button>

                                                {!isCore && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex h-8 items-center gap-1 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                                                        onClick={() => handleDelete(item.file)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span>Eliminar</span>
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                                        No se encontraron plantillas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModuleLayout>
    );
}
