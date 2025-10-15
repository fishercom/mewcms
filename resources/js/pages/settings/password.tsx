import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { generateBreadcrumb } from '@/lib/breadcrumbs';
import { Transition } from '@headlessui/react';
import { Head } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword } from '@/services/auth';

const breadcrumbs: BreadcrumbItem[] = generateBreadcrumb('Password settings', '', route('password.edit'));

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [data, setData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const updatePasswordHandler: FormEventHandler = (e) => {
        e.preventDefault();

        setProcessing(true);
        setErrors({});
        setRecentlySuccessful(false);

        updatePassword(data, {
            onSuccess: () => {
                setData({
                    current_password: '',
                    password: '',
                    password_confirmation: '',
                });
                setProcessing(false);
                setRecentlySuccessful(true);
                setTimeout(() => setRecentlySuccessful(false), 2000);
            },
            onError: (err: Record<string, string>) => {
                setErrors(err);
                setProcessing(false);
                if (err.password) {
                    setData(prevData => ({ ...prevData, password: '', password_confirmation: '' }));
                    passwordInput.current?.focus();
                }

                if (err.current_password) {
                    setData(prevData => ({ ...prevData, current_password: '' }));
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Update password" description="Ensure your account is using a long, random password to stay secure" />

                    <form onSubmit={updatePasswordHandler} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Current password</Label>

                            <Input
                                id="current_password"
                                ref={currentPasswordInput}
                                value={data.current_password}
                                onChange={(e) => setData({ ...data, current_password: e.target.value })}
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                placeholder="Current password"
                            />

                            <InputError message={errors.current_password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">New password</Label>

                            <Input
                                id="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder="New password"
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm password</Label>

                            <Input
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) => setData({ ...data, password_confirmation: e.target.value })}
                                type="password"
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                placeholder="Confirm password"
                            />

                            <InputError message={errors.password_confirmation} />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save password</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
