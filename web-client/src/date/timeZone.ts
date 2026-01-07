export const TIME_ZONE = {
    APP: 'Europe/Warsaw',
    BROWSER: new Intl.DateTimeFormat().resolvedOptions().timeZone,
} as const;
