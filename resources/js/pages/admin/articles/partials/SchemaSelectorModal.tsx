import { t } from '@/lib/i18n';
import { getSchemas } from '@/services/schemas';
import { CmsSchema } from '@/types/models/cms-schema';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    parentSchemaId: number | undefined;
}

export default function SchemaSelectorModal({ isOpen, onClose, parentSchemaId }: Props) {
    const [schemas, setSchemas] = useState<CmsSchema[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getSchemas(parentSchemaId)
                .then((response) => {
                    setSchemas(response.data);
                })
                .catch((error) => {
                    console.error('Failed to fetch schemas:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, parentSchemaId]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="bg-card w-full max-w-md rounded-lg p-6 shadow-xl">
                <div className="border-border flex items-center justify-between border-b pb-3">
                    <h3 className="text-foreground text-lg font-medium">{t('Seleccionar Campo Personalizado')}</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground text-2xl dark:hover:text-white">
                        &times;
                    </button>
                </div>
                <div className="mt-4 min-h-[150px]">
                    {loading ? (
                        <p className="text-muted-foreground">{t('Cargando...')}</p>
                    ) : schemas.length > 0 ? (
                        <ul className="space-y-2">
                            {schemas.map((schema) => (
                                <li key={schema.id}>
                                    <Link
                                        href={`/admin/articles/create?schema_id=${schema.id}`}
                                        className="text-foreground hover:bg-muted block rounded-md px-4 py-2 text-sm"
                                        onClick={onClose}
                                    >
                                        {schema.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">{t('No hay campos personalizados hijos disponibles.')}</p>
                    )}
                </div>
                <div className="border-border mt-6 flex justify-end border-t pt-4">
                    <button onClick={onClose} className="bg-muted text-foreground hover:bg-muted rounded-md px-4 py-2">
                        {t('Cancelar')}
                    </button>
                </div>
            </div>
        </div>
    );
}
