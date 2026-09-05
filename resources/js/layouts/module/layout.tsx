import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import { generateBreadcrumb } from '@/lib/breadcrumbs';
import { NavGroup, NavItem, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function ModuleLayout({ children, view = '' }: PropsWithChildren<{ view?: string | null }>) {
    const { adm_menu } = usePage<{ adm_menu: NavGroup[] }>().props;
    const page = usePage();
    const url = page.url;
    const currentPath = url.split('?')[0];
    const module: NavItem = { id: 0, title: '', description: '', url: '', icon: null };

    for (const group of adm_menu) {
        for (const item of group.items) {
            if (item.url !== '/admin' && (currentPath === item.url || currentPath.startsWith(item.url + '/'))) {
                module.id = item.id;
                module.title = item.title;
                module.description = item.description;
                module.icon = item.icon;
                module.url = item.url;
                break;
            }
        }
    }

    const breadcrumbs: BreadcrumbItem[] = generateBreadcrumb(module.title, view, module.url);
    const title = view ? `${view} ${module.title}` : module.title;

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head />
            <section className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 antialiased">
                <div className="mb-6">
                    <Heading title={title} description={module.description} />
                </div>
                <div className="mx-auto">{children}</div>
            </section>
        </AppLayout>
    );
}
