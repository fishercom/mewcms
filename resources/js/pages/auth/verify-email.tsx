// Components
import { Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { t } from '@/lib/i18n';
import { sendVerificationEmail } from '@/services/auth';

export default function VerifyEmail({ status }: { status?: string }) {
    const [processing, setProcessing] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        sendVerificationEmail(
            () => setProcessing(true),
            () => setProcessing(false),
        );
    };

    return (
        <AuthLayout title={t('Verifica tu correo')} description={t('Confirma tu dirección de correo con el enlace que te acabamos de enviar.')}>
            <Head title={t('Verificación de correo')} />

            {status === 'verification-link-sent' && (
                <div className="text-success mb-4 text-center text-sm font-medium">
                    {t('Te enviamos un nuevo enlace de verificación al correo que registraste.')}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6 text-center">
                <Button disabled={processing} variant="secondary">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {t('Reenviar correo de verificación')}
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                    {t('Cerrar sesión')}
                </TextLink>
            </form>
        </AuthLayout>
    );
}
