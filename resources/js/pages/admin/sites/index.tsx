import { deleteSite, getSites, switchSite } from '@/services/sites';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { Pagination } from '@/types';
import { CmsSite, CmsTheme } from '@/types/models/cms-site';
import { Input } from '@headlessui/react';
import { format } from 'date-fns';
import { AlertTriangle, Edit, ExternalLink, LogIn, Plus, Search, Trash2 } from 'lucide-react';

export default function Index() {
    const { items, themes, site } = usePage<{ items: Pagination<CmsSite>; themes: Record<string, CmsTheme>; site: { id: number } | null }>().props;
    const [query, setQuery] = useState({ s: '' });

    useEffect(() => {
        if (query.s) {
            getSites(query);
        }
    }, [query]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery({ s: value });
    };

    const deleteSiteHandler = (id: number) => {
        deleteSite(id);
    };

    return (
        <ModuleLayout>
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-3/4">
                        <form className="flex items-center">
                            <div className="relative w-full">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                    <Search />
                                </div>
                                <Input
                                    type="text"
                                    autoFocus
                                    value={query.s ?? ''}
                                    onChange={handleSearch}
                                    className="border-border-strong block w-full rounded-md border p-2 pl-10 text-sm"
                                    placeholder={t('Buscar')}
                                />
                            </div>
                        </form>
                    </div>
                    <div className="flex w-full flex-shrink-0 flex-col items-stretch justify-end space-y-2 md:w-auto md:flex-row md:items-center md:space-y-0 md:space-x-3">
                        <Link
                            href={route('sites.create')}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{t('Agregar sitio')}</span>
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    {t('Name')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Dominios')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Tema')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Updated Date')}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.map((item: CmsSite) => {
                                return (
                                    <tr key={item.id} className="border-b">
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium whitespace-nowrap">
                                            {item.name}
                                            {item.default && (
                                                <span className="bg-primary-soft text-primary-soft-foreground ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
                                                    {t('Por defecto')}
                                                </span>
                                            )}
                                            {!item.active && (
                                                <span className="bg-muted text-muted-foreground ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
                                                    {t('Inactivo')}
                                                </span>
                                            )}
                                            {item.has_home === false && (
                                                <span
                                                    className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                                                    title={t('Este sitio aún no tiene páginas publicadas: su dirección muestra un error 404.')}
                                                >
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {t('Sin página de inicio')}
                                                </span>
                                            )}
                                        </th>
                                        <td className="px-4 py-3">{(item.domains || []).join(', ') || item.site_url || '—'}</td>
                                        <td className="px-4 py-3">{themes[item.theme]?.name || item.theme}</td>
                                        <td className="px-4 py-3">{format(item.updated_at, 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="flex items-center justify-end gap-2 px-4 py-3">
                                            {item.public_url && (
                                                <a
                                                    href={item.public_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:bg-accent hover:text-accent-foreground flex h-8 items-center gap-1 rounded-md px-2.5 text-sm font-medium"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    <span>{t('Ver sitio')}</span>
                                                </a>
                                            )}
                                            {site && site.id !== item.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => switchSite(item.id)}
                                                >
                                                    <LogIn className="h-3.5 w-3.5" />
                                                    <span>{t('Trabajar aquí')}</span>
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => router.visit(route('sites.edit', item.id))}
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                <span>{t('Editar')}</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                onClick={() => deleteSiteHandler(item.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>{t('Eliminar')}</span>
                                            </Button>
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
