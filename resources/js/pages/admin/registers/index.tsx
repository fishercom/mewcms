import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { deleteRegister } from '@/services/registers';
import { Pagination } from '@/types';
import { CmsRegister } from '@/types/models/cms-register';
import { router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CheckCircle, Clock, Eye, Mail, Phone, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    items: Pagination<CmsRegister>;
    forms: { id: number; name: string }[];
    [key: string]: unknown;
}

export default function Index() {
    const { items, forms } = usePage<Props>().props;

    const [query, setQuery] = useState({ s: '', form_id: '', reviewed: '' });

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(route('registers.index'), query as Record<string, string>, {
                preserveState: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery((q) => ({ ...q, s: e.target.value }));
    };

    const handleFormFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQuery((q) => ({ ...q, form_id: e.target.value }));
    };

    const handleReviewedFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQuery((q) => ({ ...q, reviewed: e.target.value }));
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Eliminar este mensaje recibido?')) {
            deleteRegister(id);
        }
    };

    return (
        <ModuleLayout>
            <div className="relative">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 pb-4">
                    {/* Search */}
                    <div className="relative min-w-[14rem] flex-[1_1_18rem]">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="text-muted-foreground h-4 w-4" />
                        </div>
                        <Input
                            type="text"
                            autoFocus
                            value={query.s}
                            onChange={handleSearch}
                            className="border-border text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                            placeholder="Buscar por nombre o email..."
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span className="font-medium">Filtros:</span>
                        </div>

                        <select
                            value={query.form_id}
                            onChange={handleFormFilter}
                            className="border-border text-foreground focus-visible:ring-ring h-10 rounded-md border bg-transparent px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <option value="">Todos los formularios</option>
                            {forms.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={query.reviewed}
                            onChange={handleReviewedFilter}
                            className="border-border text-foreground focus-visible:ring-ring h-10 rounded-md border bg-transparent px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <option value="">Todos los estados</option>
                            <option value="0">Sin revisar</option>
                            <option value="1">Revisados</option>
                        </select>
                    </div>

                    {/* Counter badge */}
                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                        {items.total} mensaje{items.total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    Estado
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Remitente
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Formulario
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Campos
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    Recibido
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center italic">
                                        No hay mensajes recibidos.
                                    </td>
                                </tr>
                            )}
                            {items.data.map((item: CmsRegister) => {
                                const isNew = !item.review;
                                return (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-muted/50 cursor-pointer border-b ${isNew ? 'bg-primary/20' : ''}`}
                                        onClick={() => router.visit(route('registers.show', item.id))}
                                    >
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            {isNew ? (
                                                <span className="bg-primary-soft text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                                                    <Clock className="h-2.5 w-2.5" /> Nuevo
                                                </span>
                                            ) : (
                                                <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                                                    <CheckCircle className="h-2.5 w-2.5" /> Revisado
                                                </span>
                                            )}
                                        </td>

                                        {/* Sender */}
                                        <td className="px-4 py-3">
                                            <div className="text-foreground text-sm font-semibold">
                                                {item.name || <span className="text-muted-foreground italic">Anónimo</span>}
                                            </div>
                                            {item.email && (
                                                <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{item.email}</span>
                                                </div>
                                            )}
                                            {item.phone && (
                                                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{item.phone}</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Form name */}
                                        <td className="px-4 py-3">
                                            <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium capitalize">
                                                {item.form?.name ?? `Formulario #${item.form_id}`}
                                            </span>
                                        </td>

                                        {/* Field preview — show first 2 field values */}
                                        <td className="px-4 py-3">
                                            <div className="flex max-w-xs flex-col gap-0.5">
                                                {item.fields?.slice(0, 2).map((f) => (
                                                    <div key={f.id} className="text-muted-foreground truncate text-xs">
                                                        <span className="text-muted-foreground font-semibold capitalize">
                                                            {f.field?.name ?? f.field?.alias}:{' '}
                                                        </span>
                                                        {f.txt_value || f.value || <em className="text-muted-foreground/70">–</em>}
                                                    </div>
                                                ))}
                                                {(item.fields?.length ?? 0) > 2 && (
                                                    <span className="text-muted-foreground text-[10px] italic">
                                                        +{(item.fields?.length ?? 0) - 2} más
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => router.visit(route('registers.show', item.id))}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    <span>Ver</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Eliminar</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {items.links && <PaginationNav data={items} />}
            </div>
        </ModuleLayout>
    );
}
