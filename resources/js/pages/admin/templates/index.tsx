import { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import { deleteTemplate } from '@/services/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, FileCode } from 'lucide-react';

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
        (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.file.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ModuleLayout>
            <div className="relative overflow-hidden space-y-4">
                {errorMessage && (
                    <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                        {errorMessage}
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
                    <div className="w-full md:w-1/3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white dark:bg-[#161615]"
                                placeholder="Buscar plantilla..."
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex justify-end">
                        <Button asChild className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600">
                            <Link href="/admin/templates/create">
                                <Plus className="h-4 w-4" />
                                <span>Crear Plantilla</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161615]">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-4">Nombre de la Plantilla</th>
                                <th scope="col" className="px-6 py-4">Nombre del Archivo</th>
                                <th scope="col" className="px-6 py-4">Directorio / Ruta</th>
                                <th scope="col" className="px-6 py-4">Tipo</th>
                                <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const isCore = isCoreTemplate(item.file);
                                    return (
                                        <tr
                                            key={item.file}
                                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                                        >
                                            <th
                                                scope="row"
                                                className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-2"
                                            >
                                                <FileCode className="h-4 w-4 text-red-500 dark:text-red-400" />
                                                <span>{item.name}</span>
                                            </th>
                                            <td className="px-6 py-4 font-mono text-xs">{item.file}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-400 dark:text-gray-500">
                                                {item.value}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isCore ? (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium">
                                                        Sistema
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 font-medium">
                                                        Personalizado
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 h-8 px-2.5"
                                                    onClick={() => router.visit(route('templates.edit', item.file))}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                    <span>Editar</span>
                                                </Button>

                                                {!isCore && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex items-center gap-1 h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
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
                                    <td colSpan={5} className="text-center py-8 text-gray-500 italic">
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
