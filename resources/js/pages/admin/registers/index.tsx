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
            <div className="relative space-y-4 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                            <Search className="h-4 w-4" />
                        </div>
                        <Input
                            type="text"
                            autoFocus
                            value={query.s}
                            onChange={handleSearch}
                            className="pl-9 text-sm"
                            placeholder="Buscar por nombre o email..."
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span className="font-medium">Filtros:</span>
                        </div>

                        <select
                            value={query.form_id}
                            onChange={handleFormFilter}
                            className="h-9 min-w-[140px] rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-700 transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-300"
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
                            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-700 transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-zinc-800 dark:bg-transparent dark:text-zinc-300"
                        >
                            <option value="">Todos los estados</option>
                            <option value="0">Sin revisar</option>
                            <option value="1">Revisados</option>
                        </select>
                    </div>

                    {/* Counter badge */}
                    <span className="shrink-0 text-xs text-zinc-400">
                        {items.total} mensaje{items.total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
                            <tr>
                                <th scope="col" className="px-4 py-3">
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
                                <th scope="col" className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {items.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-xs text-zinc-400 italic">
                                        No hay mensajes recibidos.
                                    </td>
                                </tr>
                            )}
                            {items.data.map((item: CmsRegister) => {
                                const isNew = !item.review;
                                return (
                                    <tr
                                        key={item.id}
                                        className={`cursor-pointer transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 ${isNew ? 'bg-red-50/20 dark:bg-red-950/5' : ''}`}
                                        onClick={() => router.visit(route('registers.show', item.id))}
                                    >
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            {isNew ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase dark:bg-red-950/30 dark:text-red-400">
                                                    <Clock className="h-2.5 w-2.5" /> Nuevo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                                                    <CheckCircle className="h-2.5 w-2.5" /> Revisado
                                                </span>
                                            )}
                                        </td>

                                        {/* Sender */}
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                                {item.name || <span className="text-zinc-400 italic">Anónimo</span>}
                                            </div>
                                            {item.email && (
                                                <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{item.email}</span>
                                                </div>
                                            )}
                                            {item.phone && (
                                                <div className="flex items-center gap-1 text-xs text-zinc-400">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{item.phone}</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Form name */}
                                        <td className="px-4 py-3">
                                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 capitalize dark:bg-zinc-800 dark:text-zinc-300">
                                                {item.form?.name ?? `Formulario #${item.form_id}`}
                                            </span>
                                        </td>

                                        {/* Field preview — show first 2 field values */}
                                        <td className="px-4 py-3">
                                            <div className="flex max-w-xs flex-col gap-0.5">
                                                {item.fields?.slice(0, 2).map((f) => (
                                                    <div key={f.id} className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                                        <span className="font-semibold text-zinc-600 capitalize dark:text-zinc-300">
                                                            {f.field?.name ?? f.field?.alias}:{' '}
                                                        </span>
                                                        {f.txt_value || f.value || <em className="text-zinc-300">–</em>}
                                                    </div>
                                                ))}
                                                {(item.fields?.length ?? 0) > 2 && (
                                                    <span className="text-[10px] text-zinc-400 italic">+{(item.fields?.length ?? 0) - 2} más</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 text-xs whitespace-nowrap text-zinc-400">
                                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
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
                                                    className="flex h-8 items-center gap-1 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
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
