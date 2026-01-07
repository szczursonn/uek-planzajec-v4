import type { Cache, State } from 'swr';
import { swrDataCacheGlobalState } from '../state/localStorage/swrDataCache';
import { encryptedBasicAuthGlobalState } from '../state/localStorage/encryptedBasicAuth';

const dataCache = (() => {
    const PERSIST_TIMEOUT_DURATION_BASE = 2_500;
    const PERSIST_TIMEOUT_DURATION_JITTER_MAX = 1_000;
    const MAX_ENTRIES = 25;

    const cache = swrDataCacheGlobalState.get();

    let persistTimeout: ReturnType<typeof setTimeout> | null = null;
    const clearPersistTimeout = () => {
        if (persistTimeout) {
            clearTimeout(persistTimeout);
            persistTimeout = null;
        }
    };
    const persistToLocalStorage = () => {
        const encryptedBasicAuth = encryptedBasicAuthGlobalState.get();

        const cacheToPersist = new Map(
            Array.from(cache.entries())
                .filter(([key]) => encryptedBasicAuth && key.includes(encryptedBasicAuth))
                .sort((a, b) => (a[1].lastUsedAt < b[1].lastUsedAt ? 1 : -1))
                .slice(0, MAX_ENTRIES),
        );

        swrDataCacheGlobalState.set(cacheToPersist);
        clearPersistTimeout();
    };
    const startPersistTimeoutIfNotStarted = () => {
        if (persistTimeout) {
            return;
        }

        persistTimeout = setTimeout(
            persistToLocalStorage,
            PERSIST_TIMEOUT_DURATION_BASE + Math.random() * PERSIST_TIMEOUT_DURATION_JITTER_MAX,
        );
    };

    swrDataCacheGlobalState.subscribe(() => {
        const remoteCache = swrDataCacheGlobalState.get();
        for (const [key, remoteEntry] of remoteCache.entries()) {
            const entry = cache.get(key);
            if (entry) {
                entry.lastUsedAt = Math.max(entry.lastUsedAt, remoteEntry.lastUsedAt);
            } else {
                cache.set(key, remoteEntry);
            }
        }
    });

    encryptedBasicAuthGlobalState.subscribe(persistToLocalStorage);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && persistTimeout !== null) {
            persistToLocalStorage();
        }
    });

    return {
        get: (key: string) => {
            const entry = cache.get(key);

            if (!entry) {
                return undefined;
            }

            entry.lastUsedAt = Date.now();
            startPersistTimeoutIfNotStarted();

            return entry.value;
        },
        set: (key: string, value: unknown) => {
            cache.set(key, {
                value,
                lastUsedAt: Date.now(),
            });
            startPersistTimeoutIfNotStarted();
        },
    };
})();

export const swrLocalStorageCache = (() => {
    const stateStore = new Map<string, State<unknown, unknown>>();

    return {
        get: (key) => {
            const state = stateStore.get(key) ?? {};

            state.data = dataCache.get(key) ?? state.data;

            return state;
        },
        set: (key, state) => {
            if (state.data) {
                dataCache.set(key, state.data);
            }
            stateStore.set(key, state);
        },
        delete: (key) => {
            stateStore.delete(key);
        },
        keys: () => stateStore.keys(),
    } satisfies Cache<unknown>;
})();
