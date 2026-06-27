import ModuleLayout from '@/layouts/module/layout';
import { Link, router, usePage } from '@inertiajs/react';
import { CmsRegister } from '@/types/models/cms-register';
import { format } from 'date-fns';
import { ArrowLeft, Mail, Phone, User, Calendar, FileText, CheckCircle, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Show() {
    const { item } = usePage<{ item: CmsRegister }>().props;

    const handleToggleReview = () => {
        router.put(route('registers.update', item.id), {}, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
        });
    };

    const handleDelete = () => {
        if (confirm('¿Eliminar definitivamente este mensaje?')) {
            router.delete(route('registers.destroy', item.id));
        }
    };

    return (
        <ModuleLayout view="Detalle del Mensaje">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back + Actions bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href={route('registers.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver a Mensajes
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 h-8 px-3 text-xs"
                            onClick={handleToggleReview}
                        >
                            <RefreshCw className="h-3 w-3" />
                            {item.review ? 'Marcar como No Revisado' : 'Marcar como Revisado'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1.5 h-8 px-3 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                        </Button>
                    </div>
                </div>

                {/* Header card */}
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161615]/20 p-6 space-y-4 shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {item.review ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 uppercase">
                                        <CheckCircle className="h-3 w-3" /> Revisado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 uppercase">
                                        <Clock className="h-3 w-3" /> Nuevo
                                    </span>
                                )}
                                <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded capitalize">
                                    {item.form?.name ?? `Formulario #${item.form_id}`}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                                {item.name || 'Remitente Anónimo'}
                            </h1>
                        </div>

                        <div className="text-right text-xs text-zinc-400 shrink-0">
                            <div className="flex items-center gap-1 justify-end">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            {item.review && item.review_date && (
                                <div className="text-zinc-300 dark:text-zinc-600 mt-0.5">
                                    Revisado: {format(new Date(item.review_date), 'dd/MM/yyyy HH:mm')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick contact info */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                        {item.email && (
                            <a
                                href={`mailto:${item.email}`}
                                className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                                <Mail className="h-4 w-4 text-zinc-400" />
                                {item.email}
                            </a>
                        )}
                        {item.phone && (
                            <a
                                href={`tel:${item.phone}`}
                                className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                                <Phone className="h-4 w-4 text-zinc-400" />
                                {item.phone}
                            </a>
                        )}
                    </div>
                </div>

                {/* Dynamic form fields */}
                {item.fields && item.fields.length > 0 && (
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161615]/20 p-6 shadow-xs space-y-4">
                        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <FileText className="h-4 w-4 text-red-600" />
                            Datos del formulario
                        </h2>

                        <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {item.fields.map((f) => {
                                const displayValue = f.txt_value || f.value;
                                return (
                                    <div key={f.id} className="py-3 grid grid-cols-3 gap-4">
                                        <dt className="text-xs font-bold text-zinc-500 dark:text-zinc-400 capitalize col-span-1 flex items-start gap-1.5 pt-0.5">
                                            <User className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-300" />
                                            {f.field?.name || f.field?.alias || `Campo #${f.field_id}`}
                                        </dt>
                                        <dd className="col-span-2 text-sm text-zinc-800 dark:text-zinc-200 break-words">
                                            {displayValue ? (
                                                // Detect long text or multiline to use a block
                                                displayValue.length > 100 ? (
                                                    <div className="whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-900/40 rounded-lg p-3 text-xs leading-relaxed">
                                                        {displayValue}
                                                    </div>
                                                ) : (
                                                    displayValue
                                                )
                                            ) : (
                                                <span className="italic text-zinc-300 dark:text-zinc-600">—</span>
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
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161615]/20 p-6 shadow-xs space-y-3">
                        <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-600" />
                            Mensaje
                        </h2>
                        <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/40 rounded-lg p-4">
                            {item.message}
                        </p>
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
