import { useCallback, useMemo } from 'preact/hooks';
import useSWR from 'swr';
import { UnexpectedStatusCodeError } from './common';
import { encryptedBasicAuthGlobalState } from '../state/localStorage/encryptedBasicAuth';

const fetcher = async ([resourceType, queryParams, encryptedBasicAuth]: [string, string, string]) => {
    const res = await fetch(`/api/data/${resourceType}${queryParams.length > 0 ? '?' : ''}${queryParams}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${encryptedBasicAuth}`,
        },
    });

    if (!res.ok) {
        throw new UnexpectedStatusCodeError(res.status);
    }

    const resource = (await res.json()) as unknown;
    const createdAt = new Date(res.headers.get('Date') ?? NaN).getTime() || Date.now();

    return {
        resource,
        createdAt,
    } as const;
};

export const createUseDataAPI =
    <TArgs extends Readonly<unknown[]>, TResource>({
        resourceType,
        freshTimeMs,
        queryParamsCreator = () => '',
        resourceProcessor,
    }: {
        resourceType: string;
        freshTimeMs: number;
        queryParamsCreator?: (...args: TArgs) => string | null;
        resourceProcessor: (responseData: unknown, ...args: TArgs) => Readonly<TResource>;
    }) =>
    (...args: TArgs) => {
        const encryptedBasicAuth = encryptedBasicAuthGlobalState.use();
        const queryParams = queryParamsCreator(...args);

        const queryKey =
            queryParams !== null && encryptedBasicAuth.length > 0
                ? ([resourceType, queryParams, encryptedBasicAuth] as const)
                : null;
        const query = useSWR(queryKey, fetcher, {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            refreshInterval: (latestData) =>
                Math.max((latestData?.createdAt ?? Date.now()) - Date.now() + freshTimeMs, 1),
            onError: (err) => console.error('[swr]', err),
            errorRetryCount: 0,
        });

        const resourceProcessorResult = useMemo(() => {
            if (!query.data) {
                return null;
            }

            try {
                return {
                    resource: resourceProcessor(query.data.resource, ...args),
                } as const;
            } catch (error) {
                return {
                    error,
                } as const;
            }
        }, [query.data, ...args]);

        return {
            data: useMemo(
                () =>
                    resourceProcessorResult === null || resourceProcessorResult.error
                        ? null
                        : ({
                              resource: resourceProcessorResult.resource!,
                              createdAt: new Date(query.data!.createdAt),
                          } as const),
                [resourceProcessorResult],
            ),
            error: resourceProcessorResult?.error || (query.error as unknown),
            // isLoading = true when query is running or is waiting for refreshInterval to fire the first request
            isLoading: query.isValidating || (!query.data && !query.error && queryKey !== null),
            refresh: useCallback(() => void query.mutate(), [query.mutate]),
        } as const;
    };
