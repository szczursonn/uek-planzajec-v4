export const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError';

export const isFetchError = (error: unknown) => error instanceof TypeError && error.message.includes('Failed to fetch');

export const formatError = (error: unknown) => {
    if (error instanceof Error) {
        if (error.stack) {
            return error.stack;
        }

        return [error.name, error.message].filter(Boolean).join(': ');
    }

    return String(error);
};
