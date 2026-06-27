import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import ModuleLayout from '@/layouts/module/layout';
import { format } from 'date-fns';
import { CmsRegister } from '@/types/models/cms-register';
import { Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { Search, Eye, Trash2, CheckCircle, Clock, Mail, Phone, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PaginationNav } from '@/components/ui/pagination-nav';
import { deleteRegister } from '@/services/registers';

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
            <div className="relative overflow-hidden space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span className="font-medium">Filtros:</span>
                        </div>

                        <select
                            value={query.form_id}
                            onChange={handleFormFilter}
                            className="h-9 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent rounded-lg text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors min-w-[140px]"
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
                            className="h-9 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent rounded-lg text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                            <option value="">Todos los estados</option>
                            <option value="0">Sin revisar</option>
                            <option value="1">Revisados</option>
                        </select>
                    </div>

                    {/* Counter badge */}
                    <span className="text-xs text-zinc-400 shrink-0">
                        {items.total} mensaje{items.total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-400">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th scope="col" className="px-4 py-3">Estado</th>
                                <th scope="col" className="px-4 py-3">Remitente</th>
                                <th scope="col" className="px-4 py-3">Formulario</th>
                                <th scope="col" className="px-4 py-3">Campos</th>
                                <th scope="col" className="px-4 py-3">Recibido</th>
                                <th scope="col" className="px-4 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {items.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-400 italic text-xs">
                                        No hay mensajes recibidos.
                                    </td>
                                </tr>
                            )}
                            {items.data.map((item: CmsRegister) => {
                                const isNew = !item.review;
                                return (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer ${isNew ? 'bg-red-50/20 dark:bg-red-950/5' : ''}`}
                                        onClick={() => router.visit(route('registers.show', item.id))}
                                    >
                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            {isNew ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 uppercase">
                                                    <Clock className="h-2.5 w-2.5" /> Nuevo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 uppercase">
                                                    <CheckCircle className="h-2.5 w-2.5" /> Revisado
                                                </span>
                                            )}
                                        </td>

                                        {/* Sender */}
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                                                {item.name || <span className="italic text-zinc-400">Anónimo</span>}
                                            </div>
                                            {item.email && (
                                                <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
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
                                            <span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded capitalize">
                                                {item.form?.name ?? `Formulario #${item.form_id}`}
                                            </span>
                                        </td>

                                        {/* Field preview — show first 2 field values */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5 max-w-xs">
                                                {item.fields?.slice(0, 2).map((f) => (
                                                    <div key={f.id} className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                        <span className="font-semibold text-zinc-600 dark:text-zinc-300 capitalize">
                                                            {f.field?.name ?? f.field?.alias}:{' '}
                                                        </span>
                                                        {f.txt_value || f.value || <em className="text-zinc-300">–</em>}
                                                    </div>
                                                ))}
                                                {(item.fields?.length ?? 0) > 2 && (
                                                    <span className="text-[10px] text-zinc-400 italic">
                                                        +{(item.fields?.length ?? 0) - 2} más
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                                            {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 h-8 px-2.5"
                                                    onClick={() => router.visit(route('registers.show', item.id))}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    <span>Ver</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center gap-1 h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
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
