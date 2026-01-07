import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { UnexpectedStatusCodeError } from './common';
import { encryptedBasicAuthGlobalState } from '../state/localStorage/encryptedBasicAuth';
import { isAbortError } from '../errorUtils';

const encryptBasicAuthResponseSchema = z.object({
    token: z.string().check(z.minLength(1)),
});

export const useEncryptBasicAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => () => abortControllerRef.current?.abort(), []);

    const call = useCallback(async (login: string, password: string) => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        try {
            const res = await fetch(`/api/auth/encrypt-basic-auth`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(login + ':' + password)}`,
                },
                signal: abortControllerRef.current.signal,
            });

            if (!res.ok) {
                throw new UnexpectedStatusCodeError(res.status);
            }

            const token = encryptBasicAuthResponseSchema.parse(await res.json()).token;

            encryptedBasicAuthGlobalState.set(token);
            setIsLoading(false);
        } catch (err) {
            if (isAbortError(err)) {
                return;
            }
            setError(err);
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        call,
    };
};
