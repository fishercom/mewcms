import { CmsForm } from '@/types/models/cms-form';
import axios from 'axios';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Values = Record<string, string | string[]>;

const field =
    'w-full rounded-2xl border border-[#e2d7c5] bg-paper px-5 text-[0.95rem] text-ink placeholder:text-stone/60 transition-colors focus:border-brass focus:outline-none';

/**
 * A form from Admin → Forms (by its alias), in the boutique's style. Sends to the same
 * public endpoints as the shared form block.
 */
export default function ContactForm({ alias }: { alias: string }) {
    const [form, setForm] = useState<CmsForm | null>(null);
    const [values, setValues] = useState<Values>({});
    const [honeypot, setHoneypot] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [state, setState] = useState<'loading' | 'ready' | 'sending' | 'sent' | 'error'>('loading');

    useEffect(() => {
        axios
            .get<CmsForm>(`/api/forms/${alias}`)
            .then((res) => {
                setForm(res.data);
                setValues(Object.fromEntries((res.data.fields ?? []).map((f) => [f.alias, f.type === 'checkbox' ? [] : ''])));
                setState('ready');
            })
            .catch(() => setState('error'));
    }, [alias]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setState('sending');
        setErrors({});
        axios
            .post('/api/forms/submit', { ...values, form_alias: alias, _hp: honeypot })
            .then(() => setState('sent'))
            .catch((err) => {
                if (err.response?.status === 422) {
                    const found: Record<string, string> = {};
                    Object.entries(err.response.data.errors as Record<string, string[]>).forEach(([key, messages]) => (found[key] = messages[0]));
                    setErrors(found);
                    setState('ready');
                } else {
                    setState('error');
                }
            });
    };

    if (state === 'loading') {
        return (
            <p className="text-stone flex items-center gap-2 py-10">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading the form…
            </p>
        );
    }

    if (state === 'sent') {
        return (
            <div className="bg-paper rounded-[1.75rem] border border-[#e2d7c5] p-10 text-center">
                <CheckCircle2 className="text-forest mx-auto h-10 w-10" strokeWidth={1.4} />
                <p className="font-display text-ink mt-5 text-3xl">Thank you — your note is with us.</p>
                <p className="text-stone mt-3">We reply to every message within one working day.</p>
            </div>
        );
    }

    if (!form) {
        return <p className="text-stone">The form is not available right now. Please write to us by email instead.</p>;
    }

    return (
        <form onSubmit={submit} className="space-y-5" noValidate>
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                    Leave this field empty
                    <input type="text" name="_hp" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                {form.fields?.map((f) => {
                    const id = `contact-${f.alias}`;
                    const wide = f.type === 'textarea' || f.type === 'checkbox' || f.type === 'radio';
                    const value = values[f.alias];

                    return (
                        <div key={f.alias} className={wide ? 'sm:col-span-2' : ''}>
                            <label htmlFor={id} className="text-ink/80 mb-2 block text-[0.7rem] font-medium tracking-[0.2em] uppercase">
                                {f.name}
                            </label>
                            {f.type === 'textarea' ? (
                                <textarea
                                    id={id}
                                    rows={5}
                                    value={value as string}
                                    onChange={(e) => setValues((v) => ({ ...v, [f.alias]: e.target.value }))}
                                    className={`${field} py-4`}
                                />
                            ) : f.type === 'select' ? (
                                <select
                                    id={id}
                                    value={value as string}
                                    onChange={(e) => setValues((v) => ({ ...v, [f.alias]: e.target.value }))}
                                    className={`${field} h-14`}
                                >
                                    <option value="">Choose…</option>
                                    {f.options?.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : f.type === 'checkbox' || f.type === 'radio' ? (
                                <div className="flex flex-wrap gap-2" id={id}>
                                    {f.options?.map((option) => {
                                        const checked = f.type === 'checkbox' ? (value as string[]).includes(option) : value === option;
                                        return (
                                            <label
                                                key={option}
                                                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${checked ? 'border-forest bg-forest text-ivory' : 'text-ink/80 hover:border-brass border-[#e2d7c5]'}`}
                                            >
                                                <input
                                                    type={f.type}
                                                    className="sr-only"
                                                    checked={checked}
                                                    onChange={(e) =>
                                                        setValues((v) => ({
                                                            ...v,
                                                            [f.alias]:
                                                                f.type === 'checkbox'
                                                                    ? e.target.checked
                                                                        ? [...(v[f.alias] as string[]), option]
                                                                        : (v[f.alias] as string[]).filter((o) => o !== option)
                                                                    : option,
                                                        }))
                                                    }
                                                />
                                                {option}
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <input
                                    id={id}
                                    type={f.type}
                                    value={value as string}
                                    onChange={(e) => setValues((v) => ({ ...v, [f.alias]: e.target.value }))}
                                    className={`${field} h-14`}
                                />
                            )}
                            {errors[f.alias] && <p className="mt-1.5 text-sm text-[#a6402a]">Please fill in this field correctly.</p>}
                        </div>
                    );
                })}
            </div>

            {state === 'error' && <p className="text-sm text-[#a6402a]">Something went wrong. Please try again in a moment.</p>}

            <button
                type="submit"
                disabled={state === 'sending'}
                className="bg-forest text-ivory hover:bg-forest-deep inline-flex items-center gap-3 rounded-full px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase transition-colors disabled:opacity-60"
            >
                {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send message
                <ArrowRight className="h-4 w-4" />
            </button>
        </form>
    );
}
