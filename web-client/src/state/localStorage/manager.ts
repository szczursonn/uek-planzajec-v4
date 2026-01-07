import { useCallback, useEffect, useState } from 'preact/hooks';
import { deflate, inflate } from 'pako';
import type * as z from 'zod/mini';

const KEY_PREFIX = 'uekpz4_';

const keyToSubscribers = {} as Record<string, ((newValue: string) => void)[]>;

window.addEventListener('storage', (event) => {
    if (event.storageArea !== window.localStorage) {
        return;
    }

    const callbacksToExecute =
        event.key === null ? Object.values(keyToSubscribers).flat() : (keyToSubscribers[event.key] ?? []);
    callbacksToExecute.forEach((cb) => cb(event.newValue ?? ''));
});

const registerStorageEventCallback = (key: string, callback: (newValue: string) => void) => {
    keyToSubscribers[key] = keyToSubscribers[key] ?? [];
    keyToSubscribers[key].push(callback);
};

export const createLocalStorageState = <TValue>(
    unprefixedKey: string,
    decode: (encodedValue: string) => TValue,
    encode: (value: TValue) => string,
) => {
    const key = KEY_PREFIX + unprefixedKey;

    let currentValue = decode(window.localStorage.getItem(key) ?? '');
    const getCurrentValue = () => currentValue;
    const setCurrentValue = (newValue: TValue) => {
        const encodedNewValue = encode(newValue);
        if (encodedNewValue) {
            try {
                window.localStorage.setItem(key, encodedNewValue);
            } catch (err) {
                console.error('[localStorageState] failed to save to local storage', err);
            }
        } else {
            window.localStorage.removeItem(key);
        }

        currentValue = newValue;
        subscribers.forEach((cb) => cb());
    };

    const subscribers = [] as (() => void)[];
    const subscribeToValueChanges = (callback: () => void) => {
        subscribers.push(callback);
        return () => {
            const callbackIndex = subscribers.indexOf(callback);
            if (callbackIndex !== -1) {
                subscribers.splice(callbackIndex, 1);
            }
        };
    };

    registerStorageEventCallback(key, (newEncodedValue) => setCurrentValue(decode(newEncodedValue)));

    return {
        use: () => {
            const [localCurrentValue, setLocalCurrentValue] = useState(getCurrentValue);

            useEffect(
                () => subscribeToValueChanges(() => setLocalCurrentValue(getCurrentValue)),
                [setLocalCurrentValue],
            );

            return localCurrentValue;
        },
        useAsInitial: () => {
            const [localValue, setLocalValue] = useState(getCurrentValue);

            const setValueAndPropagate = useCallback(
                (newValue: TValue) => {
                    setLocalValue(newValue);
                    setCurrentValue(newValue);
                },
                [setLocalValue],
            );

            return [localValue, setValueAndPropagate] as const;
        },
        get: getCurrentValue,
        set: setCurrentValue,
        subscribe: subscribeToValueChanges,
    } as const;
};

export const createBooleanLocalStorageState = (unprefixedKey: string, defaultValue: boolean) =>
    createLocalStorageState(
        unprefixedKey,
        (encodedValue) => {
            if (encodedValue === '0') {
                return false;
            }
            if (encodedValue === '1') {
                return true;
            }
            return defaultValue;
        },
        (value) => (value ? '1' : '0'),
    );

export const createEnumLocalStorageState = <TEnumValue extends Readonly<Record<string, z.core.util.EnumValue>>>(
    unprefixedKey: string,
    enumSchema: z.ZodMiniEnum<TEnumValue>,
    defaultValue: z.core.$InferEnumOutput<TEnumValue>,
) =>
    createLocalStorageState(
        unprefixedKey,
        (encodedValue) => enumSchema.safeParse(encodedValue).data ?? defaultValue,
        (value) => (value === defaultValue ? '' : value.toString()),
    );

export const createStringLocalStorageState = (unprefixedKey: string) =>
    createLocalStorageState(
        unprefixedKey,
        (encodedValue) => encodedValue,
        (value) => value,
    );

export const createIntLocalStorageState = <TDefaultValue extends number | null>(
    unprefixedKey: string,
    minValue: number,
    maxValue: number,
    defaultValue: TDefaultValue,
) =>
    createLocalStorageState(
        unprefixedKey,
        (encodedValue) => {
            const n = parseInt(encodedValue);

            if (!isFinite(n) || n < minValue || n > maxValue) {
                return defaultValue;
            }

            return n;
        },
        (value) => (value === null ? '' : value.toString()),
    );

export const compress = (uncompressedData: string) =>
    btoa(
        Array.from(
            deflate(uncompressedData, {
                level: 9,
            }),
        )
            .map((n) => String.fromCharCode(n))
            .join(''),
    );

export const decompress = (compressedData: string) => {
    return new TextDecoder().decode(
        inflate(
            new Uint8Array(
                atob(compressedData)
                    .split('')
                    .map((char) => char.charCodeAt(0)),
            ),
        ),
    );
};
