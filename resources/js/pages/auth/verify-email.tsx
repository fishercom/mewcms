// Components
import { Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
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
        <AuthLayout title="Verifica tu correo" description="Confirma tu dirección de correo con el enlace que te acabamos de enviar.">
            <Head title="Verificación de correo" />

            {status === 'verification-link-sent' && (
                <div className="text-success mb-4 text-center text-sm font-medium">
                    Te enviamos un nuevo enlace de verificación al correo que registraste.
                </div>
            )}

            <form onSubmit={submit} className="space-y-6 text-center">
                <Button disabled={processing} variant="secondary">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Reenviar correo de verificación
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                    Cerrar sesión
                </TextLink>
            </form>
        </AuthLayout>
    );
}
