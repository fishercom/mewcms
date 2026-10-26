import FrontForm from '@/components/front-form';
import { ClipboardList } from 'lucide-react';
import { type BlockRenderProps, str } from '../types';

export default function FormRender({ data, editing }: BlockRenderProps) {
    const alias = str(data.alias);
    if (!alias) return null;

    return (
        <section className="space-y-4">
            {str(data.title) && <h2 className="text-2xl font-bold tracking-tight">{str(data.title)}</h2>}
            {editing ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#19140035] p-6 text-sm text-[#706f6c] dark:border-[#3E3E3A]">
                    <ClipboardList className="h-5 w-5" />
                    Formulario «{alias}»: se muestra en la página publicada.
                </div>
            ) : (
                <FrontForm alias={alias} />
            )}
        </section>
    );
}
