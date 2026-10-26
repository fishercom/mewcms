import { Button } from '@/components/ui/button';
import { PaginationNav } from '@/components/ui/pagination-nav';
import ModuleLayout from '@/layouts/module/layout';
import { t } from '@/lib/i18n';
import { Pagination } from '@/types';
import { CmsForm } from '@/types/models/cms-form';
import { Input } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import { Check, Copy, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Index() {
    const { items } = usePage<{ items: Pagination<CmsForm> }>().props;
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const filteredItems = items.data.filter(
        (item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.alias.toLowerCase().includes(search.toLowerCase()),
    );

    const handleCopyShortcode = (alias: string, id: number) => {
        const shortcode = `[form alias="${alias}"]`;
        navigator.clipboard.writeText(shortcode).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(t('¿Estás seguro de que deseas eliminar el formulario ":name"?', { name }))) {
            router.delete(route('forms.destroy', id));
        }
    };

    return (
        <ModuleLayout>
            <div className="relative">
                <div className="flex flex-col items-center justify-between space-y-3 pb-4 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="flex w-full gap-3 md:w-3/4">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="text-muted-foreground h-4 w-4" />
                            </div>
                            <Input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border-border text-foreground block w-full rounded-md border bg-transparent p-2 pl-10 text-sm"
                                placeholder={t('Buscar formulario...')}
                            />
                        </div>
                    </div>

                    <div className="flex w-full justify-end md:w-auto">
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                            <Link href={route('forms.create')}>
                                <Plus className="h-4 w-4" />
                                <span>{t('Crear Formulario')}</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="text-muted-foreground w-full text-left text-sm">
                        <thead className="bg-table-header text-muted-foreground text-xs uppercase">
                            <tr>
                                <th scope="col" className="rounded-l-md px-4 py-3">
                                    {t('Nombre')}
                                </th>
                                <th scope="col" className="hidden px-4 py-3 xl:table-cell">
                                    {t('Alias')}
                                </th>
                                <th scope="col" className="px-4 py-3">
                                    {t('Shortcode (Copiar)')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Campos')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {t('Estado')}
                                </th>
                                <th scope="col" className="rounded-r-md px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                                        <th scope="row" className="text-foreground px-4 py-3 font-medium capitalize">
                                            {item.name}
                                        </th>
                                        <td className="text-muted-foreground hidden px-4 py-3 font-mono text-xs xl:table-cell">{item.alias}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleCopyShortcode(item.alias, item.id)}
                                                className="border-border bg-muted/50 text-muted-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-xs transition-colors"
                                            >
                                                {copiedId === item.id ? (
                                                    <>
                                                        <Check className="text-success h-3 w-3" />
                                                        <span className="text-success">{t('¡Copiado!')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        <span>[form alias="{item.alias}"]</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium">{item.fields_count ?? 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                                    item.active ? 'bg-success-soft text-success' : 'bg-muted text-foreground'
                                                }`}
                                            >
                                                {item.active ? t('Activo') : t('Inactivo')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => router.visit(route('forms.edit', item.id))}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    <span>{t('Editar')}</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive flex h-8 items-center gap-1 px-2.5"
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>{t('Eliminar')}</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center italic">
                                        {t('No se encontraron formularios.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.links && <PaginationNav data={items} />}
            </div>
        </ModuleLayout>
    );
}
