import { DEFAULT_LOCALE, localeSchema } from '../../i18n/locales';
import { createEnumLocalStorageState } from './manager';

export const currentLocaleGlobalState = createEnumLocalStorageState('locale', localeSchema, DEFAULT_LOCALE);
