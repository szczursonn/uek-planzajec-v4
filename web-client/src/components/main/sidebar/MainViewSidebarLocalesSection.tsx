import { getLabel } from '../../../i18n/labels';
import { useCurrentLocale } from '../../../i18n/useCurrentLocale';
import { ALL_LOCALES, localeSchema } from '../../../i18n/locales';
import { currentLocaleGlobalState } from '../../../state/localStorage/locale';
import { MainViewSidebarSection } from './MainViewSidebarSection';

export const MainViewSidebarLocalesSection = () => {
    const currentLocale = useCurrentLocale();

    return (
        <MainViewSidebarSection
            title={ALL_LOCALES.map((locale) => getLabel(locale, 'main.sidebar.locales.sectionTitle')).join(' / ')}
        >
            <select
                class="border-b-x-main-bg-4 hover:border-b-x-brand-400 hover:bg-x-main-bg-3 focus-visible:outline-x-brand-400 m-0.5 w-[calc(100%-0.25rem)] cursor-pointer truncate border-b px-1 py-1.5 outline-2 outline-transparent transition-colors"
                value={currentLocale.value}
                onChange={(event) => currentLocaleGlobalState.set(localeSchema.parse(event.currentTarget.value))}
            >
                {ALL_LOCALES.map((locale) => (
                    <option
                        key={locale}
                        class="bg-x-main-bg-3"
                        label={getLabel(locale, 'common.selfLanguage')}
                        value={locale}
                    />
                ))}
            </select>
        </MainViewSidebarSection>
    );
};
