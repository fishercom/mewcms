import { BrandLockup } from '@/components/app-logo';
import { t } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="bg-background relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-4 sm:p-6 md:p-10">
            {/* Soft brand glow behind the card */}
            <div
                aria-hidden="true"
                className="bg-primary/10 dark:bg-primary/15 pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
            />
            <div className="relative w-full max-w-sm">
                <div className="border-border/70 bg-card flex flex-col gap-8 rounded-2xl border p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={route('home')}
                            className="text-foreground rounded-lg transition-opacity hover:opacity-85"
                            aria-label={t('MewCMS — ir al sitio')}
                        >
                            <BrandLockup stacked />
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="text-foreground text-xl font-semibold tracking-tight">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm text-balance">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
