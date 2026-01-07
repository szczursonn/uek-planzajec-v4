import type { TargetedEvent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import type * as z from 'zod/mini';

window.history.scrollRestoration = 'manual';

type QueryParams = Record<string, string>;
export type QueryParamsUpdate = Readonly<[string, string]>;
type HistoryUpdateType = 'replaceState' | 'pushState';

const extractQueryParamsFromURL = (url: string) =>
    Object.fromEntries(Array.from(new URL(url).searchParams.entries()).filter(([, value]) => value)) as QueryParams;

const createURLFromQueryParams = (queryParams: QueryParams) => {
    const encodedQueryParams = new URLSearchParams(
        Object.fromEntries([...Object.entries(queryParams)].filter(([, value]) => value)),
    ).toString();

    if (encodedQueryParams.length === 0) {
        return window.location.origin;
    }

    return `${window.location.origin}/?${encodedQueryParams}`;
};

let currentQueryParams = extractQueryParamsFromURL(window.location.href);
const subscribers = [] as (() => void)[];

window.addEventListener('popstate', () => {
    currentQueryParams = extractQueryParamsFromURL(window.location.href);
    subscribers.forEach((callback) => callback());
});

const getCurrentQueryParams = () => currentQueryParams;
const getCurrentQueryParamValue = (name: string) => currentQueryParams[name] ?? '';
const setCurrentQueryParams = (historyUpdateType: HistoryUpdateType, newQueryParams: QueryParams) => {
    currentQueryParams = newQueryParams;
    try {
        window.history[historyUpdateType](window.history.state, '', createURLFromQueryParams(currentQueryParams));
    } catch (err) {
        console.error('[queryParamsState] failed to modify history', err);
    }

    subscribers.forEach((cb) => cb());
};
const subscribeToCurrentQueryParamsChanges = (callback: () => void) => {
    subscribers.push(callback);
    return () => {
        const callbackIndex = subscribers.indexOf(callback);
        if (callbackIndex !== -1) {
            subscribers.splice(callbackIndex, 1);
        }
    };
};

const applyQueryParamsUpdates = (baseQueryParams: QueryParams, updates: QueryParamsUpdate[]) =>
    updates.reduce((newQueryParams, [queryParamName, value]) => {
        newQueryParams[queryParamName] = value;
        return newQueryParams;
    }, structuredClone(baseQueryParams));

export const updateQueryParams = (historyUpdateType: HistoryUpdateType, ...updates: QueryParamsUpdate[]) =>
    setCurrentQueryParams(historyUpdateType, applyQueryParamsUpdates(currentQueryParams, updates));

export const useURLCreator = () => {
    const [hookQueryParams, setHookQueryParams] = useState(getCurrentQueryParams);

    useEffect(
        () => subscribeToCurrentQueryParamsChanges(() => setHookQueryParams(getCurrentQueryParams)),
        [setHookQueryParams],
    );

    return useCallback(
        (...updates: QueryParamsUpdate[]) =>
            createURLFromQueryParams(applyQueryParamsUpdates(hookQueryParams, updates)),
        [hookQueryParams],
    );
};

export const anchorPushStateHandler = (event: TargetedEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setCurrentQueryParams('pushState', extractQueryParamsFromURL(event.currentTarget.href));
};

export const createQueryParamState = <TValue>(
    queryParamName: string,
    decode: (queryParamValue: string) => TValue,
    encode: (value: TValue) => string,
) => {
    let currentQueryParamValue = getCurrentQueryParamValue(queryParamName);
    let currentValue = decode(currentQueryParamValue);

    const subscribers = [] as (() => void)[];

    subscribeToCurrentQueryParamsChanges(() => {
        let newCurrentQueryParamValue = getCurrentQueryParamValue(queryParamName);
        if (newCurrentQueryParamValue === currentQueryParamValue) {
            return;
        }

        currentQueryParamValue = newCurrentQueryParamValue;
        currentValue = decode(newCurrentQueryParamValue);
        subscribers.forEach((cb) => cb());
    });

    const getCurrentValue = () => currentValue;
    const subscribeToCurrentValueChanges = (callback: () => void) => {
        subscribers.push(callback);
        return () => {
            const callbackIndex = subscribers.indexOf(callback);
            if (callbackIndex !== -1) {
                subscribers.splice(callbackIndex, 1);
            }
        };
    };

    return {
        use: () => {
            const [localCurrentValue, setLocalCurrentValue] = useState(getCurrentValue);

            useEffect(
                () => subscribeToCurrentValueChanges(() => setLocalCurrentValue(getCurrentValue)),
                [setLocalCurrentValue],
            );

            return localCurrentValue;
        },
        get: getCurrentValue,
        createUpdate: (newValue: TValue): QueryParamsUpdate => [queryParamName, encode(newValue)],
    } as const;
};

export const createBooleanQueryParamState = (queryParamName: string, defaultValue: boolean) => {
    const baseState = createQueryParamState(
        queryParamName,
        (queryParamValue) => {
            if (queryParamValue === '0') {
                return false;
            }
            if (queryParamValue === '1') {
                return true;
            }
            return defaultValue;
        },
        (value) => {
            if (value === defaultValue) {
                return '';
            }
            return value ? '1' : '0';
        },
    );

    return {
        ...baseState,
        createClearUpdate: () => baseState.createUpdate(defaultValue),
    };
};

export const createStringQueryParamState = (queryParamName: string) =>
    createQueryParamState(
        queryParamName,
        (queryParamValue) => queryParamValue,
        (value) => value,
    );

export const createIntQueryParamState = (queryParamName: string) =>
    createQueryParamState(
        queryParamName,
        (queryParamValue) => {
            const n = parseInt(queryParamValue);
            return isFinite(n) ? n : null;
        },
        (value) => (value === null ? '' : value.toString()),
    );

export const createEnumQueryParamState = <TEnumValue extends Readonly<Record<string, z.core.util.EnumValue>>>(
    queryParamName: string,
    enumSchema: z.ZodMiniEnum<TEnumValue>,
    defaultValue: z.core.$InferEnumOutput<TEnumValue>,
) =>
    createQueryParamState(
        queryParamName,
        (queryParamValue) => enumSchema.safeParse(queryParamValue).data ?? defaultValue,
        (value) => (value === defaultValue ? '' : value.toString()),
    );
