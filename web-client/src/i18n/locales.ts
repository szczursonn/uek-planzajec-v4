import * as z from 'zod/mini';

export const ALL_LOCALES = ['pl-pl', 'en-us'] as const;
export const localeSchema = z.enum(ALL_LOCALES);
export type Locale = z.infer<typeof localeSchema>;

export const DEFAULT_LOCALE = 'pl-pl';
