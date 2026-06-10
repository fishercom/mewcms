import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsMenu } from '@/types/models/cms-menu';
import { ChevronDown } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
}

export default function FrontLayout({ children, navigation }: LayoutProps) {
    const { menus = [] } = usePage<{ menus: CmsMenu[] }>().props;
    const headerMenu = menus.find((m) => m.slug === 'header' || m.slug === 'navigation' || m.slug === 'site-principal');
    const menuItems = headerMenu?.items || [];

    // Helper to format underscores back to slashes for URLs
    const getUrl = (slug: string) => {
        if (!slug || slug === 'home') return '/';
        return '/' + slug.replace(/_/g, '/');
    };

    const renderNavLinks = () => {
        if (menuItems.length > 0) {
            const parents = menuItems.filter((i) => i.parent_id === null);
            const getChildrenOf = (parentId: number) => menuItems.filter((i) => i.parent_id === parentId);

            return parents.map((item) => {
                const children = getChildrenOf(item.id);
                const hasChildren = children.length > 0;

                if (hasChildren) {
                    return (
                        <div key={item.id} className="relative group py-2">
                            <button
                                className="flex items-center gap-1 text-sm font-medium hover:text-[#f53003] dark:hover:text-[#FF4433] transition-colors capitalize cursor-pointer bg-transparent border-0"
                            >
                                <span>{item.title}</span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-300" />
                            </button>
                            <div className="absolute left-0 mt-2 w-48 rounded-xl border border-[#19140015] bg-[#FDFDFC] p-2 dark:border-[#3E3E3A]/45 dark:bg-[#161615] shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transform translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-50">
                                {children.map((child) => (
                                    <Link
                                        key={child.id}
                                        href={child.resolved_url || '#'}
                                        target={child.target}
                                        className="block px-3 py-2 rounded-lg text-xs text-[#706f6c] hover:text-[#f53003] dark:text-[#c5c4c0] dark:hover:text-[#FF4433] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all capitalize"
                                    >
                                        {child.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                }

                return (
                    <Link
                        key={item.id}
                        href={item.resolved_url || '#'}
                        target={item.target}
                        className="text-sm font-medium hover:text-[#f53003] dark:hover:text-[#FF4433] transition-colors capitalize"
                    >
                        {item.title}
                    </Link>
                );
            });
        }

        return (
            <>
                <Link
                    href="/"
                    className="text-sm font-medium hover:text-[#f53003] dark:hover:text-[#FF4433] transition-colors"
                >
                    Inicio
                </Link>
                {navigation
                    .filter((item) => item.slug !== 'home')
                    .map((item) => (
                        <Link
                            key={item.id}
                            href={getUrl(item.slug)}
                            className="text-sm font-medium hover:text-[#f53003] dark:hover:text-[#FF4433] transition-colors capitalize"
                        >
                            {item.title}
                        </Link>
                    ))}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] transition-colors duration-200">
            {/* Navigation Header */}
            <header className="sticky top-0 z-40 w-full border-b border-[#19140015] bg-[#FDFDFC]/80 backdrop-blur-md dark:border-[#3E3E3A]/40 dark:bg-[#0a0a0a]/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-xl font-bold tracking-tight text-primary hover:opacity-85">
                            MewCMS
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-6">
                        {renderNavLinks()}
                    </nav>

                    {/* Admin Access & Right Actions */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="inline-flex h-9 items-center justify-center rounded-md border border-[#19140035] px-4 text-sm font-medium hover:border-[#1915014a] dark:border-[#3E3E3A] dark:hover:border-[#62605b] transition-colors"
                        >
                            Admin Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#19140010] bg-[#FDFDFC] dark:border-[#3E3E3A]/20 dark:bg-[#0a0a0a] py-8 mt-16 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-[#706f6c] dark:text-[#A1A09A]">
                    <p>© {new Date().getFullYear()} MewCMS. Powered by Laravel, Inertia, and React.</p>
                </div>
            </footer>
        </div>
    );
}
