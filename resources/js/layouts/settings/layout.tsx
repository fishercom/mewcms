import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        id: 1,
        title: t('Profile'),
        description: t('Edit your profile information'),
        url: route('profile.edit'),
        icon: null,
    },
    {
        id: 2,
        title: t('Password'),
        description: t('Change your password'),
        url: route('password.edit'),
        icon: null,
    },
    {
        id: 3,
        title: t('Appearance'),
        description: t('Customize the appearance'),
        url: route('appearance'),
        icon: null,
    },
];

/** Settings of the whole panel, not of one account: super admins only */
const systemNavItems: NavItem[] = [
    {
        id: 10,
        title: t('Marca del panel'),
        description: t('Logo del cliente en el panel y en el inicio de sesión'),
        url: route('brand.edit'),
        icon: null,
    },
];

export default function SettingsLayout({ children, wide = false }: PropsWithChildren<{ wide?: boolean }>) {
    const { auth } = usePage<SharedData>().props;

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;
    const isSuperAdmin = Boolean((auth as { permissions?: { super_admin?: boolean } | null }).permissions?.super_admin);
    const navLink = (item: NavItem) => (
        <Button
            key={item.url}
            size="sm"
            variant="ghost"
            asChild
            className={cn('w-full justify-start', {
                'bg-muted': currentPath === new URL(item.url, window.location.origin).pathname,
            })}
        >
            <Link href={item.url} prefetch>
                {item.title}
            </Link>
        </Button>
    );

    return (
        <div className="px-4 py-6">
            <Heading title={t('Settings')} description={t('Manage your profile and account settings')} />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">{sidebarNavItems.map(navLink)}</nav>
                    {isSuperAdmin && (
                        <nav className="mt-6 flex flex-col space-y-1 space-x-0">
                            <span className="text-muted-foreground px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase">{t('Sistema')}</span>
                            {systemNavItems.map(navLink)}
                        </nav>
                    )}
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className={cn('flex-1', !wide && 'md:max-w-2xl')}>
                    <section className={cn('space-y-12', !wide && 'max-w-xl')}>{children}</section>
                </div>
            </div>
        </div>
    );
}
