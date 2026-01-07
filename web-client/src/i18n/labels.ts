import type { Locale } from './locales';

import plplJason from './pl-pl.json';
import enusJason from './en-us.json';

const LOCALE_TO_LABELS = {
    'pl-pl': plplJason,
    'en-us': enusJason,
} as Record<Locale, Partial<Record<string, string>>>;

const pluralRulesCache = {} as Partial<Record<Locale, Intl.PluralRules>>;

export const getLabel = (
    locale: Locale,
    key: string,
    {
        fallback = key,
        pluralRulesN = null,
        args = [],
    }: { fallback?: string; pluralRulesN?: number | null; args?: unknown[] } = {},
): string => {
    if (pluralRulesN !== null) {
        let pluralRules = pluralRulesCache[locale];
        if (!pluralRules) {
            pluralRules = new Intl.PluralRules(locale);
            pluralRulesCache[locale] = pluralRules;
        }

        return getLabel(locale, `${key}.${pluralRules.select(pluralRulesN)}`, {
            fallback,
            args,
        });
    }

    let labelTemplate = LOCALE_TO_LABELS[locale][key];

    if (!labelTemplate) {
        return key;
    }

    for (let i = 0; i < args.length; i++) {
        labelTemplate = labelTemplate.replaceAll(`{${i}}`, `${args[i]}`);
    }

    return labelTemplate;
};

type DropFirst<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : never;

export const createLocaleBoundGetLabel =
    (locale: Locale) =>
    (...args: DropFirst<Parameters<typeof getLabel>>) =>
        getLabel(locale, ...args);

export const complexLabels = {
    durationHoursAndMinutesShort: (locale: Locale, ms: number) => {
        let minutes = Math.round(ms / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        minutes -= hours * 60;

        const parts = [];

        if (hours > 0) {
            parts.push(`${hours}${getLabel(locale, 'common.durationHoursMinutes.hourShort')}`);
        }

        if (minutes > 0 || hours === 0) {
            parts.push(`${minutes}${getLabel(locale, 'common.durationHoursMinutes.minuteShort')}`);
        }

        return parts.join(' ');
    },
} as const;
