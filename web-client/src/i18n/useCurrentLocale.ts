import { useMemo } from 'preact/hooks';
import { createLocaleBoundGetLabel } from './labels';
import { currentLocaleGlobalState } from '../state/localStorage/locale';

export const useCurrentLocale = () => {
    const currentLocale = currentLocaleGlobalState.use();

    return {
        value: currentLocale,
        getLabel: useMemo(() => createLocaleBoundGetLabel(currentLocale), [currentLocale]),
    } as const;
};
