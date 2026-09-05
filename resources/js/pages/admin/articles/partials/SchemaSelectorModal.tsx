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
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Seleccionar Campo Personalizado</h3>
                    <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        &times;
                    </button>
                </div>
                <div className="mt-4 min-h-[150px]">
                    {loading ? (
                        <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
                    ) : schemas.length > 0 ? (
                        <ul className="space-y-2">
                            {schemas.map((schema) => (
                                <li key={schema.id}>
                                    <Link
                                        href={`/admin/articles/create?schema_id=${schema.id}`}
                                        className="block rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                        onClick={onClose}
                                    >
                                        {schema.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300">No hay campos personalizados hijos disponibles.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
