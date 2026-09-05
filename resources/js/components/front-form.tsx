import { Button } from '@/components/ui/button';
import { CmsForm, CmsFormField } from '@/types/models/cms-form';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Props {
    alias: string;
}

export default function FrontForm({ alias }: Props) {
    const [form, setForm] = useState<CmsForm | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [values, setValues] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get(`/api/forms/${alias}`)
            .then((res) => {
                setForm(res.data);
                // Initialize form values
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const initValues: Record<string, any> = {};
                res.data.fields?.forEach((field: CmsFormField) => {
                    if (field.type === 'checkbox') {
                        initValues[field.alias] = [];
                    } else {
                        initValues[field.alias] = '';
                    }
                });
                setValues(initValues);
            })
            .catch((err) => {
                console.error('Error fetching form config:', err);
                setErrorMessage('No se pudo cargar el formulario.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [alias]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInputChange = (fieldAlias: string, type: string, value: any, checked?: boolean) => {
        if (type === 'checkbox') {
            const current = values[fieldAlias] || [];
            if (checked) {
                setValues((prev) => ({ ...prev, [fieldAlias]: [...current, value] }));
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValues((prev) => ({ ...prev, [fieldAlias]: current.filter((v: any) => v !== value) }));
            }
        } else {
            setValues((prev) => ({ ...prev, [fieldAlias]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        setSuccessMessage(null);
        setErrorMessage(null);

        axios
            .post('/api/forms/submit', {
                ...values,
                form_alias: alias,
            })
            .then((res) => {
                if (res.data.success) {
                    setSuccessMessage(res.data.message || 'Formulario enviado con éxito.');
                    // Reset form values
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const resetValues: Record<string, any> = {};
                    form?.fields?.forEach((field: CmsFormField) => {
                        if (field.type === 'checkbox') {
                            resetValues[field.alias] = [];
                        } else {
                            resetValues[field.alias] = '';
                        }
                    });
                    setValues(resetValues);
                }
            })
            .catch((err) => {
                console.error('Submission error:', err);
                if (err.response?.status === 422) {
                    // Validation errors from Laravel
                    const validationErrors: Record<string, string> = {};
                    Object.keys(err.response.data.errors).forEach((key) => {
                        validationErrors[key] = err.response.data.errors[key][0];
                    });
                    setErrors(validationErrors);
                } else {
                    setErrorMessage(err.response?.data?.message || 'Ocurrió un error al enviar el formulario.');
                }
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10 text-zinc-500">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Cargando formulario...</span>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMessage || 'Formulario no disponible.'}</span>
            </div>
        );
    }

    return (
        <div className="max-w-lg space-y-6 rounded-2xl border border-[#19140010] bg-white p-6 shadow-xs md:p-8 dark:border-[#3E3E3A]/40 dark:bg-[#161615]/20">
            <div>
                <h3 className="text-xl font-bold text-zinc-950 capitalize dark:text-white">{form.name}</h3>
                {form.info && <p className="mt-1 text-sm text-zinc-500 dark:text-[#A1A09A]">{form.info}</p>}
            </div>

            {successMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-xs font-semibold text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-500" />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {form.fields?.map((field) => {
                    const isInvalid = !!errors[field.alias];
                    return (
                        <div key={field.alias} className="space-y-1">
                            <label className="text-xs font-bold text-zinc-700 capitalize dark:text-zinc-300">{field.name}</label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    value={values[field.alias] || ''}
                                    onChange={(e) => handleInputChange(field.alias, field.type, e.target.value)}
                                    rows={4}
                                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-800 transition-all focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none dark:bg-transparent dark:text-zinc-200 ${
                                        isInvalid ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                                    }`}
                                />
                            ) : ['select'].includes(field.type) ? (
                                <select
                                    value={values[field.alias] || ''}
                                    onChange={(e) => handleInputChange(field.alias, field.type, e.target.value)}
                                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-800 transition-all focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none dark:bg-[#161615]/40 dark:text-zinc-200 ${
                                        isInvalid ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                                    }`}
                                >
                                    <option value="">Selecciona una opción</option>
                                    {field.options?.map((opt, oIdx) => (
                                        <option key={oIdx} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            ) : ['checkbox', 'radio'].includes(field.type) ? (
                                <div className="space-y-2 pt-1">
                                    {field.options?.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-2">
                                            <input
                                                type={field.type}
                                                id={`field_${field.alias}_${oIdx}`}
                                                name={field.alias}
                                                value={opt}
                                                checked={
                                                    field.type === 'checkbox'
                                                        ? (values[field.alias] || []).includes(opt)
                                                        : values[field.alias] === opt
                                                }
                                                onChange={(e) => handleInputChange(field.alias, field.type, e.target.value, e.target.checked)}
                                                className="h-4 w-4 rounded-sm border-zinc-300 bg-transparent text-red-600 focus:ring-2 focus:ring-red-500 dark:border-zinc-800"
                                            />
                                            <label
                                                htmlFor={`field_${field.alias}_${oIdx}`}
                                                className="cursor-pointer text-xs text-zinc-600 dark:text-zinc-400"
                                            >
                                                {opt}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    value={values[field.alias] || ''}
                                    onChange={(e) => handleInputChange(field.alias, field.type, e.target.value)}
                                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-zinc-800 transition-all focus:border-transparent focus:ring-2 focus:ring-red-500 focus:outline-none dark:bg-transparent dark:text-zinc-200 ${
                                        isInvalid ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                                    }`}
                                />
                            )}

                            {isInvalid && <p className="text-[11px] font-semibold text-red-500">{errors[field.alias]}</p>}
                        </div>
                    );
                })}

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Enviando...</span>
                            </>
                        ) : (
                            <span>Enviar Mensaje</span>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
