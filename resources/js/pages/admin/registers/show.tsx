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
                        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
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
                            className="text-destructive hover:bg-destructive/10 flex h-8 items-center gap-1.5 px-3 text-xs"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                        </Button>
                    </div>
                </div>

                {/* Header card */}
                <div className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                {item.review ? (
                                    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                                        <CheckCircle className="h-3 w-3" /> Revisado
                                    </span>
                                ) : (
                                    <span className="bg-primary-soft text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                                        <Clock className="h-3 w-3" /> Nuevo
                                    </span>
                                )}
                                <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs capitalize">
                                    {item.form?.name ?? `Formulario #${item.form_id}`}
                                </span>
                            </div>
                            <h1 className="text-foreground text-xl font-bold">{item.name || 'Remitente Anónimo'}</h1>
                        </div>

                        <div className="text-muted-foreground shrink-0 text-right text-xs">
                            <div className="flex items-center justify-end gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                            {item.review && item.review_date && (
                                <div className="text-muted-foreground/70 mt-0.5">
                                    Revisado: {format(new Date(item.review_date), 'dd/MM/yyyy HH:mm')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick contact info */}
                    <div className="border-border flex flex-wrap gap-4 border-t pt-2">
                        {item.email && (
                            <a
                                href={`mailto:${item.email}`}
                                className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm transition-colors"
                            >
                                <Mail className="text-muted-foreground h-4 w-4" />
                                {item.email}
                            </a>
                        )}
                        {item.phone && (
                            <a
                                href={`tel:${item.phone}`}
                                className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm transition-colors"
                            >
                                <Phone className="text-muted-foreground h-4 w-4" />
                                {item.phone}
                            </a>
                        )}
                    </div>
                </div>

                {/* Dynamic form fields */}
                {item.fields && item.fields.length > 0 && (
                    <div className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-xs">
                        <h2 className="border-border text-foreground flex items-center gap-2 border-b pb-3 text-sm font-bold">
                            <FileText className="text-primary h-4 w-4" />
                            Datos del formulario
                        </h2>

                        <dl className="divide-border divide-y">
                            {item.fields.map((f) => {
                                const displayValue = f.txt_value || f.value;
                                return (
                                    <div key={f.id} className="grid grid-cols-3 gap-4 py-3">
                                        <dt className="text-muted-foreground col-span-1 flex items-start gap-1.5 pt-0.5 text-xs font-bold capitalize">
                                            <User className="text-muted-foreground/70 mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            {f.field?.name || f.field?.alias || `Campo #${f.field_id}`}
                                        </dt>
                                        <dd className="text-foreground col-span-2 text-sm break-words">
                                            {displayValue ? (
                                                // Detect long text or multiline to use a block
                                                displayValue.length > 100 ? (
                                                    <div className="bg-muted/50 rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap">
                                                        {displayValue}
                                                    </div>
                                                ) : (
                                                    displayValue
                                                )
                                            ) : (
                                                <span className="text-muted-foreground/70 italic">—</span>
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
                    <div className="border-border bg-card space-y-3 rounded-2xl border p-6 shadow-xs">
                        <h2 className="text-foreground flex items-center gap-2 text-sm font-bold">
                            <FileText className="text-primary h-4 w-4" />
                            Mensaje
                        </h2>
                        <p className="bg-muted/50 text-foreground rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
