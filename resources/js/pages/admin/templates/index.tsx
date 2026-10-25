import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { deleteTemplate } from '@/services/templates';
import { Pagination } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TemplateItem {
    name: string;
    value: string;
    file: string;
}

export default function Index() {
    const { items = [], canEdit } = usePage<{ items: TemplateItem[]; canEdit: boolean }>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isCoreTemplate = (file: string) => {
        const base = file.replace('.tsx', '');
        return ['home', 'page', 'post'].includes(base);
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

    const singlePage = {
        current_page: 1,
        last_page: 1,
        data: filteredItems,
        links: [{ label: '1', url: route('templates.index'), active: true }],
    } as unknown as Pagination<(typeof filteredItems)[number]>;

    return (
        <ModuleLayout>
            <div className="relative">
                {errorMessage && (
                    <div className="border-destructive/30 bg-destructive-soft text-destructive mb-4 rounded-lg border p-3 text-sm">
                        {errorMessage}
                    </div>
                )}

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
                                placeholder="Buscar plantilla..."
                            />
                        </div>
                    </div>
                    <div className="flex w-full justify-end md:w-auto">
                        {canEdit && (
                            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                                <Link href="/admin/templates/create">
                                    <Plus className="h-4 w-4" />
                                    <span>Crear Plantilla</span>
                                </Link>
                            </Button>
                        )}
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
                                    Archivo
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Ruta
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Tipo
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    const isCore = isCoreTemplate(item.file);
                                    return (
                                        <tr key={item.file} className="hover:bg-muted/50 border-b">
                                            <th scope="row" className="text-foreground px-4 py-3 font-medium whitespace-nowrap">
                                                {item.name}
                                            </th>
                                            <td className="px-4 py-3 font-mono text-xs">{item.file}</td>
                                            <td className="text-muted-foreground px-4 py-3 font-mono text-xs">{item.value}</td>
                                            <td className="px-4 py-3">
                                                {isCore ? (
                                                    <Badge variant="secondary" className="bg-muted text-foreground font-medium">
                                                        Sistema
                                                    </Badge>
                                                ) : (
                                                    <Badge className="border-warning/30 bg-warning-soft text-warning font-medium">
                                                        Personalizado
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="flex items-center justify-end gap-2 px-4 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => router.visit(route('templates.edit', item.file))}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    <span>{canEdit ? 'Editar' : 'Ver'}</span>
                                                </Button>

                                                {canEdit && !isCore && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
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
                                    <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center italic">
                                        No se encontraron plantillas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Templates are files, not a paginated query: same footer as the other lists */}
                <PaginationNav data={singlePage} />
            </div>
        </ModuleLayout>
    );
}
