import { useEffect, useMemo } from 'preact/hooks';
import { useCurrentLocale } from './i18n/useCurrentLocale';

export const useDocumentTitle = (partsProvider: () => unknown[], dependencies: unknown[]) => {
    const currentLocale = useCurrentLocale();

    const title = useMemo(() => {
        const parts = partsProvider().filter(Boolean);

        if (parts.length === 0) {
            return currentLocale.getLabel('common.appTitle');
        }

        return [...parts, currentLocale.getLabel('common.appTitleShort')].join(' | ');
    }, [currentLocale.getLabel, ...dependencies]);

    useEffect(() => {
        document.title = title;
    }, [title]);
};
