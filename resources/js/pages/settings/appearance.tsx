import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import LanguageTabs from '@/components/language-tabs';
import { generateBreadcrumb } from '@/lib/breadcrumbs';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { t } from '@/lib/i18n';

const breadcrumbs: BreadcrumbItem[] = generateBreadcrumb(t('Appearance settings'), '', route('appearance'));

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Apariencia')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('Appearance settings')} description={t("Update your account's appearance settings")} />
                    <AppearanceTabs />
                </div>

                <div className="space-y-6">
                    <HeadingSmall title={t('Idioma')} description={t('El idioma del panel de administración. El sitio público no cambia.')} />
                    <LanguageTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
