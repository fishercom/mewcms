import { Button } from '@/components/ui/button';
import ModuleLayout from '@/layouts/module/layout';
import { CmsRegister } from '@/types/models/cms-register';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, CheckCircle, Clock, FileText, Mail, Phone, RefreshCw, Trash2, User } from 'lucide-react';

export default function Show() {
    const { item } = usePage<{ item: CmsRegister }>().props;

    const handleToggleReview = () => {
        router.put(
            route('registers.update', item.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => router.reload(),
            },
        );
    };

    const handleDelete = () => {
        if (confirm('¿Eliminar definitivamente este mensaje?')) {
            router.delete(route('registers.destroy', item.id));
        }
    };

    return (
        <ModuleLayout view="Detalle del Mensaje">
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Back + Actions bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('registers.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver a Mensajes
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex h-8 items-center gap-1.5 px-3 text-xs" onClick={handleToggleReview}>
                            <RefreshCw className="h-3 w-3" />
                            {item.review ? 'Marcar como No Revisado' : 'Marcar como Revisado'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex h-8 items-center gap-1.5 px-3 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                        </Button>
                    </div>
                </div>

                {/* Header card */}
                <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-[#161615]/20">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                {item.review ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                                        <CheckCircle className="h-3 w-3" /> Revisado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase dark:bg-red-950/30 dark:text-red-400">
                                        <Clock className="h-3 w-3" /> Nuevo
                                    </span>
                                )}
                                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400 capitalize dark:bg-zinc-800">
                                    {item.form?.name ?? `Formulario #${item.form_id}`}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{item.name || 'Remitente Anónimo'}</h1>
                        </div>

                        <div className="shrink-0 text-right text-xs text-zinc-400">
                            <div className="flex items-center justify-end gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            {item.review && item.review_date && (
                                <div className="mt-0.5 text-zinc-300 dark:text-zinc-600">
                                    Revisado: {format(new Date(item.review_date), 'dd/MM/yyyy HH:mm')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick contact info */}
                    <div className="dark:border-zinc-850 flex flex-wrap gap-4 border-t border-zinc-100 pt-2">
                        {item.email && (
                            <a
                                href={`mailto:${item.email}`}
                                className="inline-flex items-center gap-1.5 text-sm text-zinc-600 transition-colors hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400"
                            >
                                <Mail className="h-4 w-4 text-zinc-400" />
                                {item.email}
                            </a>
                        )}
                        {item.phone && (
                            <a
                                href={`tel:${item.phone}`}
                                className="inline-flex items-center gap-1.5 text-sm text-zinc-600 transition-colors hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400"
                            >
                                <Phone className="h-4 w-4 text-zinc-400" />
                                {item.phone}
                            </a>
                        )}
                    </div>
                </div>

                {/* Dynamic form fields */}
                {item.fields && item.fields.length > 0 && (
                    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-[#161615]/20">
                        <h2 className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                            <FileText className="h-4 w-4 text-red-600" />
                            Datos del formulario
                        </h2>

                        <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {item.fields.map((f) => {
                                const displayValue = f.txt_value || f.value;
                                return (
                                    <div key={f.id} className="grid grid-cols-3 gap-4 py-3">
                                        <dt className="col-span-1 flex items-start gap-1.5 pt-0.5 text-xs font-bold text-zinc-500 capitalize dark:text-zinc-400">
                                            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-300" />
                                            {f.field?.name || f.field?.alias || `Campo #${f.field_id}`}
                                        </dt>
                                        <dd className="col-span-2 text-sm break-words text-zinc-800 dark:text-zinc-200">
                                            {displayValue ? (
                                                // Detect long text or multiline to use a block
                                                displayValue.length > 100 ? (
                                                    <div className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed whitespace-pre-wrap dark:bg-zinc-900/40">
                                                        {displayValue}
                                                    </div>
                                                ) : (
                                                    displayValue
                                                )
                                            ) : (
                                                <span className="text-zinc-300 italic dark:text-zinc-600">—</span>
                                            )}
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </div>
                )}

                {/* Fallback: legacy message field if no dynamic fields */}
                {(!item.fields || item.fields.length === 0) && item.message && (
                    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-[#161615]/20">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                            <FileText className="h-4 w-4 text-red-600" />
                            Mensaje
                        </h2>
                        <p className="rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
                            {item.message}
                        </p>
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
